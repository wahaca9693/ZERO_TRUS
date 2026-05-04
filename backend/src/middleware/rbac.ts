import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ForbiddenError } from '../utils/errors';

type Permission =
  | 'create_data'
  | 'edit_data'
  | 'delete_data'
  | 'view_data'
  | 'share_data'
  | 'manage_users'
  | 'access_api'
  | 'admin_panel';

const rolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'create_data',
    'edit_data',
    'delete_data',
    'view_data',
    'share_data',
    'manage_users',
    'access_api',
    'admin_panel',
  ],
  ADMIN: [
    'create_data',
    'edit_data',
    'delete_data',
    'view_data',
    'share_data',
    'manage_users',
    'access_api',
  ],
  USER: ['create_data', 'edit_data', 'delete_data', 'view_data', 'access_api'],
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient role'));
      return;
    }
    next();
  };
};

export const requirePermission = (...permissions: Permission[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }
    const userPermissions = rolePermissions[req.user.role] || [];
    const hasPermission = permissions.every((p) => userPermissions.includes(p));
    if (!hasPermission) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };
};
