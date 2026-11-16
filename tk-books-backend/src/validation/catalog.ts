import { z } from 'zod';
import { boolQuery, paginationQuery, slugField, textLong, textShort } from './common';

const keyField = z.string().trim().min(1).max(300);
const urlField = z.string().trim().url().max(500);

/* ---------------- ספרים ---------------- */
export const bookCreateBody = z.object({
  slug: slugField.optional(),
  titleHe: textShort,
  titleEn: textShort,
  descriptionHe: textLong.default(''),
  descriptionEn: textLong.default(''),
  coverImageKey: keyField.nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
});
export const bookUpdateBody = bookCreateBody.partial();

export const adminListQuery = paginationQuery(20).extend({
  q: z.string().trim().max(100).optional(),
  includeInactive: boolQuery,
});

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

/* ---------------- חומרי למידה ---------------- */
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

/* ---------------- שאלות נפוצות ---------------- */
export const faqListQuery = z.object({
  bookSlug: z.string().min(1).max(120).optional(),
  scope: z.enum(['all', 'general']).default('all'),
  includeGeneral: boolQuery,
  q: z.string().trim().max(100).optional(),
});
export const faqCreateBody = z.object({
  bookId: z.string().uuid().nullable().optional(),
  questionHe: textShort,
  questionEn: textShort,
  answerHe: z.string().trim().min(1).max(5000),
  answerEn: z.string().trim().min(1).max(5000),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true),
});
export const faqUpdateBody = faqCreateBody.partial();
export const adminFaqListQuery = adminListQuery.extend({ bookId: z.string().uuid().optional() });

/* ---------------- מוצרים ---------------- */
export const productKindEnum = z.enum(['DIGITAL', 'PHYSICAL']);
export const productCategoryEnum = z.enum(['FLASHCARDS', 'SONGBOOK', 'PRINTABLES', 'STICKERS', 'STAMPS', 'OTHER']);

export const productListQuery = paginationQuery(20).extend({
  kind: productKindEnum.optional(),
  category: productCategoryEnum.optional(),
  bookSlug: z.string().min(1).max(120).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['new', 'price_asc', 'price_desc', 'name']).default('new'),
});

const productImageInput = z.object({
  key: keyField,
  altHe: z.string().trim().max(200).default(''),
  altEn: z.string().trim().max(200).default(''),
});

const productFields = z.object({
  slug: slugField.optional(),
  bookId: z.string().uuid().nullable().optional(),
  kind: productKindEnum,
  category: productCategoryEnum.default('OTHER'),
  nameHe: textShort,
  nameEn: textShort,
  descriptionHe: textLong.default(''),
  descriptionEn: textLong.default(''),
  priceAgorot: z.number().int().min(0).max(10_000_000),
  digitalFileKey: keyField.nullable().optional(),
  images: z.array(productImageInput).max(10).default([]),
  isActive: z.boolean().default(true),
});

export const productCreateBody = productFields.refine((p) => p.kind !== 'DIGITAL' || !!p.digitalFileKey, {
  message: 'מוצר דיגיטלי חייב קובץ להורדה (digitalFileKey)',
  path: ['digitalFileKey'],
});
export const productUpdateBody = productFields.partial();
export const adminProductListQuery = adminListQuery.extend({
  kind: productKindEnum.optional(),
  category: productCategoryEnum.optional(),
});

/* ---------------- העלאת קבצים ---------------- */
export const uploadBody = z.object({
  area: z.enum(['public', 'private']).default('private'),
  folder: z
    .string()
    .regex(/^[a-z0-9][a-z0-9/_-]{0,60}$/, 'folder: אותיות קטנות/ספרות/מקף/קו תחתון/סלאש')
    .default('misc'),
});
