import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import * as auth from '../controllers/authController';
import * as catalog from '../controllers/catalogController';
import * as orders from '../controllers/orderController';
import { asyncHandler as h } from '../lib/asyncHandler';
import { authenticate } from '../middleware/auth';
import { bookPageLimiter, contactLimiter, downloadLimiter, loginLimiter, orderLimiter, trackLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { loginBody } from '../validation/auth';
import { faqListQuery, materialListQuery, pageNumberParams, productListQuery } from '../validation/catalog';
import { slugParam } from '../validation/common';
import { contactBody, downloadTokenParams, orderCreateBody, payDemoBody, trackBody } from '../validation/orders';

export const publicRouter = Router();

publicRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/** הגדרות שה-React צריך להציג (מייל תמיכה, מגבלת כמות...) */
publicRouter.get('/config', (_req, res) => {
  res.json({
    supportEmail: env.SUPPORT_EMAIL,
    maxItemQuantity: env.MAX_ITEM_QUANTITY,
    downloadValidDays: env.DOWNLOAD_VALID_DAYS,
    deliveryBusinessDays: env.DELIVERY_BUSINESS_DAYS,
    currency: 'ILS',
    paymentMode: env.PAYMENT_DRIVER,
  });
});

/* Auth */
publicRouter.post('/auth/login', loginLimiter, validate({ body: loginBody }), h(auth.login));
publicRouter.get('/auth/me', authenticate, h(auth.me));

/* ספרים */
publicRouter.get('/books', h(catalog.listBooks));
publicRouter.get('/books/:slug', validate({ params: slugParam }), h(catalog.getBook));
publicRouter.get('/books/:slug/pages/:n', bookPageLimiter, validate({ params: pageNumberParams }), h(catalog.getBookPage));
publicRouter.get('/books/:slug/materials', validate({ params: slugParam, query: materialListQuery }), h(catalog.listMaterials));

/* חומרים, שאלות נפוצות, מוצרים */
publicRouter.get('/materials/:id/download', downloadLimiter, validate({ params: z.object({ id: z.string().uuid() }) }), h(catalog.downloadMaterial));
publicRouter.get('/faqs', validate({ query: faqListQuery }), h(catalog.listFaqs));
publicRouter.get('/products', validate({ query: productListQuery }), h(catalog.listProducts));
publicRouter.get('/products/:slug', validate({ params: slugParam }), h(catalog.getProduct));

/* הזמנות, מעקב, הורדה, פנייה */
publicRouter.post('/orders', orderLimiter, validate({ body: orderCreateBody }), h(orders.createOrder));
publicRouter.post('/orders/track', trackLimiter, validate({ body: trackBody }), h(orders.trackOrder));
publicRouter.post('/orders/pay-demo', trackLimiter, validate({ body: payDemoBody }), h(orders.payDemo)); // תשלום דמה – 404 אם PAYMENT_DRIVER אינו fake
publicRouter.get('/downloads/:token', downloadLimiter, validate({ params: downloadTokenParams }), h(orders.download));
publicRouter.post('/contact', contactLimiter, validate({ body: contactBody }), h(orders.contact));
