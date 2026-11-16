import type { Request, RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/** מאמת ומנקה body/query/params לפי Zod. שגיאה => 400 (דרך errorHandler) */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params) as Request['params'];
      if (schemas.query) req.query = schemas.query.parse(req.query) as Request['query'];
      if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
      next();
    } catch (e) {
      next(e);
    }
  };

/** עוזר לקריאת ערכים מאומתים עם טיפוס */
export const parsedQuery = <T extends ZodTypeAny>(req: Request, _schema: T): z.infer<T> =>
  req.query as unknown as z.infer<T>;
