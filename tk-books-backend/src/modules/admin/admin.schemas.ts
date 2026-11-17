import { z } from 'zod';
import { adminListQuery, paginationQuery } from '../../utils/validation';

export const customersQuery = paginationQuery(20).extend({ q: adminListQuery.shape.q });

export const uploadBody = z.object({
  area: z.enum(['public', 'private']).default('private'),
  folder: z
    .string()
    .regex(/^[a-z0-9][a-z0-9/_-]{0,60}$/, 'folder: אותיות קטנות/ספרות/מקף/קו תחתון/סלאש')
    .default('misc'),
});
