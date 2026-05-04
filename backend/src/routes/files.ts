import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

const prisma = new PrismaClient();
const router = Router();

const uploadDir = path.resolve(config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
});

const folderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().optional().nullable(),
});

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parentId = (req.query.parentId as string) || null;

      const files = await prisma.file.findMany({
        where: {
          userId: req.user!.id,
          parentId: parentId || null,
        },
        orderBy: [{ isFolder: 'desc' }, { originalName: 'asc' }],
      });

      res.json(
        files.map((f) => ({
          ...f,
          size: Number(f.size),
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      const parentId = (req.body.parentId as string) || null;

      const file = await prisma.file.create({
        data: {
          userId: req.user!.id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: BigInt(req.file.size),
          path: req.file.path,
          parentId,
        },
      });

      await prisma.user.update({
        where: { id: req.user!.id },
        data: { storageUsed: { increment: BigInt(req.file.size) } },
      });

      res.status(201).json({ ...file, size: Number(file.size) });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/folder',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = folderSchema.parse(req.body);

      const folder = await prisma.file.create({
        data: {
          userId: req.user!.id,
          filename: body.name,
          originalName: body.name,
          mimeType: 'folder',
          size: BigInt(0),
          path: '',
          parentId: body.parentId ?? null,
          isFolder: true,
        },
      });

      res.status(201).json({ ...folder, size: 0 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError(error.errors.map((e) => e.message).join(', ')));
      } else {
        next(error);
      }
    }
  }
);

router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = await prisma.file.findUnique({
        where: { id: req.params.id },
      });
      if (!file) throw new NotFoundError('File');
      if (file.userId !== req.user!.id && req.user!.role === 'USER') {
        throw new ForbiddenError();
      }

      if (file.isFolder) {
        const children = await prisma.file.findMany({
          where: { parentId: file.id },
          orderBy: [{ isFolder: 'desc' }, { originalName: 'asc' }],
        });
        res.json({
          ...file,
          size: Number(file.size),
          children: children.map((c) => ({ ...c, size: Number(c.size) })),
        });
        return;
      }

      res.download(file.path, file.originalName);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = await prisma.file.findUnique({
        where: { id: req.params.id },
      });
      if (!file) throw new NotFoundError('File');
      if (file.userId !== req.user!.id && req.user!.role === 'USER') {
        throw new ForbiddenError();
      }

      if (!file.isFolder && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        await prisma.user.update({
          where: { id: file.userId },
          data: { storageUsed: { decrement: file.size } },
        });
      }

      await prisma.file.delete({ where: { id: req.params.id } });
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
