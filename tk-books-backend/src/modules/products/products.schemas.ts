import { z } from 'zod';
import { adminListQuery, paginationQuery, slugField, textLong, textShort } from '../../utils/validation';

const keyField = z.string().trim().min(1).max(300);

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
