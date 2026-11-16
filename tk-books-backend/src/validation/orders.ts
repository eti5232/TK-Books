import { z } from 'zod';
import { env } from '../config/env';
import { paginationQuery } from './common';

const quantityMessage = `כמות חייבת להיות בין 1 ל-${env.MAX_ITEM_QUANTITY}. לכמויות גדולות יותר פני אל ${env.SUPPORT_EMAIL} / For larger quantities contact ${env.SUPPORT_EMAIL}`;

export const orderCreateBody = z.object({
  customerName: z.string().trim().min(2, 'שם חובה').max(100),
  customerEmail: z.string().trim().toLowerCase().email('מייל לא תקין').max(200),
  customerPhone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+\-\s()]*$/, 'טלפון לא תקין')
    .optional(),
  preferredLanguage: z.enum(['he', 'en']).default('he'),
  shippingAddress: z
    .object({
      street: z.string().trim().min(2).max(200),
      city: z.string().trim().min(2).max(100),
      zip: z.string().trim().max(20).optional(),
    })
    .optional(),
  notes: z.string().trim().max(1000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('מזהה מוצר לא תקין'),
        quantity: z
          .number({ error: quantityMessage })
          .int(quantityMessage)
          .min(1, quantityMessage)
          .max(env.MAX_ITEM_QUANTITY, quantityMessage),
      }),
    )
    .min(1, 'ההזמנה ריקה')
    .max(50),
});

export const trackBody = z.object({
  code: z.string().trim().toUpperCase().regex(/^TK-[A-Z0-9]{6}$/, 'קוד הזמנה לא תקין'),
  email: z.string().trim().toLowerCase().email('מייל לא תקין'),
});

export const payDemoBody = trackBody.extend({ outcome: z.enum(['success', 'fail']).default('success') });

export const downloadTokenParams = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'קישור לא תקין') });

export const adminOrderListQuery = paginationQuery(20).extend({
  status: z.enum(['PENDING', 'PAID', 'ORDERED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  q: z.string().trim().max(100).optional(),
});

export const cancelBody = z.object({ reason: z.string().trim().max(500).optional() });
export const refundBody = cancelBody;
export const shipBody = z.object({ trackingNumber: z.string().trim().max(100).optional() });

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
