import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

export const auditLog = (action: string, resource?: string) => {
  return async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await prisma.log.create({
        data: {
          userId: req.user?.id ?? null,
          action,
          resource: resource ?? req.originalUrl,
          details: {
            method: req.method,
            params: req.params,
            query: req.query,
          },
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        },
      });
    } catch {
      // Don't block request if logging fails
    }
    next();
  };
};
