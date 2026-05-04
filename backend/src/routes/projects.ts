import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();
const router = Router();

const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';

      const where = isAdmin
        ? {}
        : {
            OR: [
              { ownerId: req.user!.id },
              { members: { some: { userId: req.user!.id } } },
            ],
          };

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            owner: { select: { id: true, username: true } },
            _count: { select: { collections: true, members: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.project.count({ where }),
      ]);

      res.json({
        projects,
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
      const body = projectSchema.parse(req.body);

      const project = await prisma.project.create({
        data: {
          name: body.name,
          description: body.description,
          ownerId: req.user!.id,
          members: {
            create: { userId: req.user!.id, role: 'OWNER' },
          },
        },
        include: {
          owner: { select: { id: true, username: true } },
          _count: { select: { collections: true, members: true } },
        },
      });

      res.status(201).json(project);
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
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: {
          owner: { select: { id: true, username: true, email: true } },
          members: {
            include: { user: { select: { id: true, username: true, email: true } } },
          },
          collections: {
            select: { id: true, name: true, type: true, createdAt: true },
          },
        },
      });
      if (!project) throw new NotFoundError('Project');

      const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
      const isMember = project.members.some((m) => m.userId === req.user!.id);
      if (!isAdmin && !isMember) throw new ForbiddenError();

      res.json(project);
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
      const body = projectSchema.parse(req.body);
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: { members: true },
      });
      if (!project) throw new NotFoundError('Project');

      const member = project.members.find((m) => m.userId === req.user!.id);
      const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
      if (!isAdmin && (!member || !['OWNER', 'ADMIN'].includes(member.role))) {
        throw new ForbiddenError();
      }

      const updated = await prisma.project.update({
        where: { id: req.params.id },
        data: body,
      });
      res.json(updated);
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
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
      });
      if (!project) throw new NotFoundError('Project');

      const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
      if (!isAdmin && project.ownerId !== req.user!.id) {
        throw new ForbiddenError();
      }

      await prisma.project.delete({ where: { id: req.params.id } });
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
