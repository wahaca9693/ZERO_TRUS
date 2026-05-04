import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();
const router = Router();

const collectionSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['JSON', 'FILE', 'TABLE']).default('JSON'),
  schema: z.any().optional(),
});

async function checkProjectAccess(userId: string, projectId: string, role: string, minRole: string[] = ['OWNER', 'ADMIN', 'EDITOR']): Promise<boolean> {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true;
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return member !== null && minRole.includes(member.role);
}

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.query.projectId as string;
      if (!projectId) {
        res.status(400).json({ error: 'projectId is required' });
        return;
      }

      const hasAccess = await checkProjectAccess(req.user!.id, projectId, req.user!.role, ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']);
      if (!hasAccess) throw new ForbiddenError();

      const collections = await prisma.collection.findMany({
        where: { projectId },
        include: { _count: { select: { dataItems: true } } },
        orderBy: { createdAt: 'desc' },
      });

      res.json(collections);
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
      const body = collectionSchema.parse(req.body);
      const hasAccess = await checkProjectAccess(req.user!.id, body.projectId, req.user!.role);
      if (!hasAccess) throw new ForbiddenError();

      const collection = await prisma.collection.create({
        data: body,
        include: { _count: { select: { dataItems: true } } },
      });

      res.status(201).json(collection);
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
      const collection = await prisma.collection.findUnique({
        where: { id: req.params.id },
        include: {
          project: { select: { id: true, name: true } },
          _count: { select: { dataItems: true } },
        },
      });
      if (!collection) throw new NotFoundError('Collection');

      const hasAccess = await checkProjectAccess(req.user!.id, collection.projectId, req.user!.role, ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']);
      if (!hasAccess) throw new ForbiddenError();

      res.json(collection);
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
      const collection = await prisma.collection.findUnique({
        where: { id: req.params.id },
      });
      if (!collection) throw new NotFoundError('Collection');

      const hasAccess = await checkProjectAccess(req.user!.id, collection.projectId, req.user!.role, ['OWNER', 'ADMIN']);
      if (!hasAccess) throw new ForbiddenError();

      await prisma.collection.delete({ where: { id: req.params.id } });
      res.json({ message: 'Collection deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
