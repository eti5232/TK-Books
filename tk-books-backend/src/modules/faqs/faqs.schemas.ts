import { z } from 'zod';
import { adminListQuery, boolQuery, textShort } from '../../utils/validation';

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
