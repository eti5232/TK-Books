import { z } from 'zod';

export const idParam = z.object({ id: z.string().uuid('מזהה לא תקין') });
export const slugParam = z.object({ slug: z.string().min(1).max(120) });

export const slugField = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug: אותיות אנגליות קטנות, ספרות ומקפים בלבד');

/** "true"/"false" מ-query string => boolean */
export const boolQuery = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

export const paginationQuery = (defaultSize = 20) =>
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(defaultSize),
  });

export const textShort = z.string().trim().min(1).max(200);
export const textLong = z.string().trim().max(5000);

export function paginate<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
