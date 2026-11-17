import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: `הנתיב ${req.method} ${req.path} לא קיים / Route not found` },
  });
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'הנתונים שנשלחו אינם תקינים / Invalid input',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'הרשומה לא נמצאה / Record not found' } });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({
        error: { code: 'ALREADY_EXISTS', message: 'ערך כזה כבר קיים (למשל slug) / Duplicate value', details: err.meta },
      });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({
        error: {
          code: 'IN_USE',
          message: 'לא ניתן למחוק/לשנות: הרשומה מקושרת לנתונים אחרים (למשל מוצר שהוזמן – יש להסתיר אותו במקום למחוק) / Record is in use',
        },
      });
      return;
    }
  }
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooBig ? 413 : 400).json({
      error: { code: tooBig ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR', message: tooBig ? 'הקובץ גדול מדי (מקסימום 25MB)' : err.message },
    });
    return;
  }
  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'JSON לא תקין / Malformed JSON' } });
    return;
  }

  if (!env.isTest) console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'שגיאת שרת / Internal server error' } });
};
