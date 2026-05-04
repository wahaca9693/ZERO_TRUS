import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();
const router = Router();

const dataItemSchema = z.object({
  collectionId: z.string().uuid(),
  data: z.any(),
  fileUrl: z.string().url().optional(),
});

const updateDataSchema = z.object({
  data: z.any(),
  fileUrl: z.string().url().optional().nullable(),
});

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const collectionId = req.query.collectionId as string;
      if (!collectionId) {
        res.status(400).json({ error: 'collectionId is required' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const search = req.query.search as string | undefined;

      const where: Record<string, unknown> = { collectionId };
      if (search) {
        where.data = { path: [], string_contains: search };
      }

      const [items, total] = await Promise.all([
        prisma.dataItem.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.dataItem.count({ where }),
      ]);

      res.json({
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = dataItemSchema.parse(req.body);

      const collection = await prisma.collection.findUnique({
        where: { id: body.collectionId },
        select: { projectId: true },
      });
      if (!collection) throw new NotFoundError('Collection');

      const item = await prisma.dataItem.create({
        data: {
          collectionId: body.collectionId,
          data: body.data,
          fileUrl: body.fileUrl,
        },
      });

      res.status(201).json(item);
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
      const item = await prisma.dataItem.findUnique({
        where: { id: req.params.id },
        include: {
          versions: { orderBy: { version: 'desc' }, take: 10 },
          collection: { select: { id: true, name: true, projectId: true } },
        },
      });
      if (!item) throw new NotFoundError('Data item');
      res.json(item);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = updateDataSchema.parse(req.body);
      const existing = await prisma.dataItem.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) throw new NotFoundError('Data item');

      const [item] = await prisma.$transaction([
        prisma.dataItem.update({
          where: { id: req.params.id },
          data: {
            data: body.data,
            fileUrl: body.fileUrl ?? existing.fileUrl,
            version: { increment: 1 },
          },
        }),
        prisma.dataVersion.create({
          data: {
            dataItemId: existing.id,
            data: existing.data as object,
            version: existing.version,
          },
        }),
      ]);

      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError(error.errors.map((e) => e.message).join(', ')));
      } else {
        next(error);
      }
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await prisma.dataItem.findUnique({
        where: { id: req.params.id },
      });
      if (!item) throw new NotFoundError('Data item');

      await prisma.dataItem.delete({ where: { id: req.params.id } });
      res.json({ message: 'Data item deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id/versions',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const versions = await prisma.dataVersion.findMany({
        where: { dataItemId: req.params.id },
        orderBy: { version: 'desc' },
      });
      res.json(versions);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
