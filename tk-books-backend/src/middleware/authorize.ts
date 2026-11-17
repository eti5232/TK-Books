import type { RequestHandler } from 'express';
import { forbidden } from '../utils/app-error';

/** מחייב תפקיד מנהלת. Token תקין בלי הרשאה => 403 */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return next(forbidden('FORBIDDEN', 'אין לך הרשאה לפעולה זו. / Admin role required'));
  }
  return next();
};
