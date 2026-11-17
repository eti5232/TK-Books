import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const make = (windowMs: number, limit: number, code: string): RequestHandler =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (_req, res) => {
      res.status(429).json({ error: { code, message: 'יותר מדי בקשות, נסי שוב מאוחר יותר / Too many requests' } });
    },
  });

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export const loginLimiter = make(MIN, 5, 'TOO_MANY_LOGIN_ATTEMPTS');
export const contactLimiter = make(HOUR, 5, 'TOO_MANY_CONTACT_MESSAGES');
export const orderLimiter = make(HOUR, 20, 'TOO_MANY_ORDERS');
export const trackLimiter = make(MIN, 10, 'TOO_MANY_TRACK_REQUESTS');
export const bookPageLimiter = make(MIN, 120, 'TOO_MANY_PAGE_REQUESTS');
export const downloadLimiter = make(MIN, 30, 'TOO_MANY_DOWNLOADS');
export const generalLimiter = make(MIN, 300, 'TOO_MANY_REQUESTS');
