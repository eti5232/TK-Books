import { z } from 'zod';
import { adminListQuery, paginationQuery, textLong, textShort } from '../../utils/validation';

const keyField = z.string().trim().min(1).max(300);
const urlField = z.string().trim().url().max(500);

export const materialTypeEnum = z.enum(['SONG', 'TEST', 'REVIEW_SHEET', 'TEACHER_GUIDE']);

export const materialListQuery = paginationQuery(100).extend({
  type: materialTypeEnum.optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['order', 'title', 'new']).default('order'),
});

export const materialCreateBody = z.object({
  bookId: z.string().uuid(),
  type: materialTypeEnum,
  titleHe: textShort,
  titleEn: textShort,
  descriptionHe: textLong.default(''),
  descriptionEn: textLong.default(''),
  unit: z.number().int().min(1).max(100).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  fileKey: keyField.nullable().optional(),
  mediaUrl: urlField.nullable().optional(),
  lyricsHe: textLong.nullable().optional(),
  lyricsEn: textLong.nullable().optional(),
  isActive: z.boolean().default(true),
});
export const materialUpdateBody = materialCreateBody.partial();
export const adminMaterialListQuery = adminListQuery.extend({
  bookId: z.string().uuid().optional(),
  type: materialTypeEnum.optional(),
});
