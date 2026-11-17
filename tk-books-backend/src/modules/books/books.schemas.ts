import { z } from 'zod';
import { adminListQuery, slugField, textLong, textShort } from '../../utils/validation';

export { adminListQuery as adminBookListQuery };

export const bookCreateBody = z.object({
  slug: slugField.optional(),
  titleHe: textShort,
  titleEn: textShort,
  descriptionHe: textLong.default(''),
  descriptionEn: textLong.default(''),
  coverImageKey: z.string().trim().min(1).max(300).nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
});
export const bookUpdateBody = bookCreateBody.partial();

export const pageNumberParams = z.object({
  slug: z.string().min(1).max(120),
  n: z.coerce.number().int().min(1),
});
export const adminPageParams = z.object({
  id: z.string().uuid(),
  n: z.coerce.number().int().min(1),
});
export const addPagesBody = z.object({
  replace: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});
