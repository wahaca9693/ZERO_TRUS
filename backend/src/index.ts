import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import { generalLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import collectionRoutes from './routes/collections';
import dataRoutes from './routes/data';
import fileRoutes from './routes/files';
import apiKeyRoutes from './routes/apiKeys';
import logRoutes from './routes/logs';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.use('/uploads', express.static(path.resolve(config.uploadDir)));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/logs', logRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    logger.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
);

app.listen(config.port, () => {
  logger.info(`ZDC Backend running on port ${config.port}`);
});

export default app;
