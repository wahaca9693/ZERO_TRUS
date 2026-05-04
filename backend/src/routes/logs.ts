import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const prisma = new PrismaClient();
const router = Router();

router.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const action = req.query.action as string | undefined;
      const userId = req.query.userId as string | undefined;

      const where: Record<string, unknown> = {};
      if (action) where.action = action;
      if (userId) where.userId = userId;

      const [logs, total] = await Promise.all([
        prisma.log.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
          orderBy: { timestamp: 'desc' },
        }),
        prisma.log.count({ where }),
      ]);

      res.json({
        logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/stats',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [totalLogs, todayLogs, weekLogs, totalUsers, activeUsers] =
        await Promise.all([
          prisma.log.count(),
          prisma.log.count({ where: { timestamp: { gte: oneDayAgo } } }),
          prisma.log.count({ where: { timestamp: { gte: oneWeekAgo } } }),
          prisma.user.count(),
          prisma.user.count({
            where: { lastLogin: { gte: oneWeekAgo } },
          }),
        ]);

      res.json({
        totalLogs,
        todayLogs,
        weekLogs,
        totalUsers,
        activeUsers,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
