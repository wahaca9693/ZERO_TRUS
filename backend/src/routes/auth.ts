import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { AppError, ValidationError, UnauthorizedError } from '../utils/errors';

const prisma = new PrismaClient();
const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post(
  '/register',
  authLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = registerSchema.parse(req.body);

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email: body.email }, { username: body.username }] },
      });
      if (existing) {
        throw new ValidationError('Email or username already exists');
      }

      const passwordHash = await bcrypt.hash(body.password, 12);
      const user = await prisma.user.create({
        data: {
          username: body.username,
          email: body.email,
          passwordHash,
        },
        select: { id: true, username: true, email: true, role: true, createdAt: true },
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, username: user.username },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

      await prisma.log.create({
        data: { userId: user.id, action: 'REGISTER', ip: req.ip ?? null },
      });

      res.status(201).json({ user, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError(error.errors.map((e) => e.message).join(', ')));
      } else {
        next(error);
      }
    }
  }
);

router.post(
  '/login',
  authLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email: body.email } });
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }
      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Account is suspended or banned');
      }

      const valid = await bcrypt.compare(body.password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, username: user.username },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

      await prisma.log.create({
        data: { userId: user.id, action: 'LOGIN', ip: req.ip ?? null },
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      });
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
  '/me',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
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
      });
      if (!user) {
        throw new AppError(404, 'User not found');
      }
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

router.post(
  '/logout',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.log.create({
        data: { userId: req.user!.id, action: 'LOGOUT', ip: req.ip ?? null },
      });
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
