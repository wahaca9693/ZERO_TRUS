import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

const prisma = new PrismaClient();
const router = Router();

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
});

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { userId: req.user!.id },
        select: {
          id: true,
          name: true,
          key: true,
          permissions: true,
          lastUsed: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(
        keys.map((k) => ({
          ...k,
          key: `${k.key.slice(0, 8)}...${k.key.slice(-4)}`,
        }))
      );
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
      const body = createKeySchema.parse(req.body);

      const key = `zdc_${uuidv4().replace(/-/g, '')}`;

      const apiKey = await prisma.apiKey.create({
        data: {
          userId: req.user!.id,
          name: body.name,
          key,
          permissions: body.permissions,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        },
      });

      res.status(201).json(apiKey);
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
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: req.params.id },
      });
      if (!apiKey) throw new NotFoundError('API Key');
      if (apiKey.userId !== req.user!.id && req.user!.role === 'USER') {
        throw new ForbiddenError();
      }

      await prisma.apiKey.delete({ where: { id: req.params.id } });
      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
