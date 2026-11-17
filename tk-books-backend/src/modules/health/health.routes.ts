import { Router } from 'express';
import { env } from '../../config/env';

/** מותקן על /api */
export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/** הגדרות שה-React צריך להציג (מייל תמיכה, מגבלת כמות...) */
healthRouter.get('/config', (_req, res) => {
  res.json({
    supportEmail: env.SUPPORT_EMAIL,
    maxItemQuantity: env.MAX_ITEM_QUANTITY,
    downloadValidDays: env.DOWNLOAD_VALID_DAYS,
    deliveryBusinessDays: env.DELIVERY_BUSINESS_DAYS,
    currency: 'ILS',
    paymentMode: env.PAYMENT_DRIVER,
  });
});
