import type { RequestHandler } from 'express';
import { forbidden, unauthorized } from '../lib/errors';
import { verifyToken } from '../lib/jwt';

/** מחייב Bearer Token תקין. בלי Token / Token פגום / פג תוקף => 401 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized('UNAUTHORIZED', 'חסר Token. יש להתחבר. / Missing bearer token'));
  }
  try {
    const payload = verifyToken(header.slice('Bearer '.length).trim());
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(unauthorized('INVALID_TOKEN', 'Token לא תקין או שפג תוקפו. / Invalid or expired token'));
  }
};

/** מחייב תפקיד מנהלת. Token תקין בלי הרשאה => 403 */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return next(forbidden('FORBIDDEN', 'אין לך הרשאה לפעולה זו. / Admin role required'));
  }
  return next();
};
