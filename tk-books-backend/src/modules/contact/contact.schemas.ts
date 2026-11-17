import { z } from 'zod';
import { paginationQuery } from '../../utils/validation';

export const contactBody = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(3000),
  orderCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^TK-[A-Z0-9]{6}$/)
    .optional(),
});

export const contactListQuery = paginationQuery(20).extend({
  status: z.enum(['NEW', 'HANDLED']).optional(),
});
export const contactUpdateBody = z.object({ status: z.enum(['NEW', 'HANDLED']) });
