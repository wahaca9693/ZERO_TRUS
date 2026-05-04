import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { NotFoundError, ValidationError } from '../utils/errors';

const prisma = new PrismaClient();
const router = Router();

const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'BANNED', 'SUSPENDED']).optional(),
  storageLimit: z.number().positive().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(128),
});

router.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const search = req.query.search as string | undefined;

      const where = search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            storageLimit: true,
            storageUsed: true,
            lastLogin: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        users: users.map((u) => ({
          ...u,
          storageLimit: Number(u.storageLimit),
          storageUsed: Number(u.storageUsed),
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          storageLimit: true,
          storageUsed: true,
          lastLogin: true,
          createdAt: true,
          _count: { select: { ownedProjects: true, files: true, apiKeys: true } },
        },
      });
      if (!user) throw new NotFoundError('User');
      res.json({
        ...user,
        storageLimit: Number(user.storageLimit),
        storageUsed: Number(user.storageUsed),
      });
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
      const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
      const isSelf = req.user!.id === req.params.id;

      if (!isAdmin && !isSelf) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const body = updateUserSchema.parse(req.body);

      if (!isAdmin) {
        delete body.role;
        delete body.status;
        delete body.storageLimit;
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          ...body,
          storageLimit: body.storageLimit ? BigInt(body.storageLimit) : undefined,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError(error.errors.map((e) => e.message).join(', ')));
      } else {
        next(error);
      }
    }
  }
);

router.put(
  '/:id/password',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isSelf = req.user!.id === req.params.id;
      if (!isSelf) {
        res.status(403).json({ error: 'Can only change your own password' });
        return;
      }

      const body = changePasswordSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) throw new NotFoundError('User');

      const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
      if (!valid) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }

      const passwordHash = await bcrypt.hash(body.newPassword, 12);
      await prisma.user.update({
        where: { id: req.params.id },
        data: { passwordHash },
      });

      res.json({ message: 'Password updated successfully' });
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
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
