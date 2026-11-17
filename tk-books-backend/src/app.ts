import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { openApiSpec } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { generalLimiter } from './middleware/rate-limit';
import { authenticate } from './middleware/authenticate';
import { requireAdmin } from './middleware/authorize';
import { adminRouter } from './modules/admin/admin.routes';
import { authRouter } from './modules/auth/auth.routes';
import { adminBooksRouter, booksRouter } from './modules/books/books.routes';
import { adminContactRouter, contactRouter } from './modules/contact/contact.routes';
import { downloadsRouter } from './modules/downloads/downloads.routes';
import { adminFaqsRouter, faqsRouter } from './modules/faqs/faqs.routes';
import { healthRouter } from './modules/health/health.routes';
import { adminMaterialsRouter, materialsRouter } from './modules/materials/materials.routes';
import { adminOrdersRouter, ordersRouter } from './modules/orders/orders.routes';
import { adminProductsRouter, productsRouter } from './modules/products/products.routes';
import { localPublicDir } from './services/storage.service';

export function createApp(): Express {
  const app = express();
  app.set('trust proxy', 1); // Render עובד מאחורי proxy – נדרש לזיהוי IP נכון
  app.disable('x-powered-by');

  // Swagger UI צריך סקריפטים מקומיים, לכן CSP רופף רק בנתיב הזה
  app.get('/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.use(
    '/api-docs',
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'TK Books API',
      swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
    }),
  );

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(generalLimiter);

  // תמונות ציבוריות (כריכות, מוצרים) כשהאחסון מקומי
  if (env.STORAGE_DRIVER === 'local') {
    app.use('/files', express.static(localPublicDir(), { maxAge: '1h', index: false, dotfiles: 'deny' }));
  }

  app.get('/', (_req, res) => {
    res.json({ name: 'TK Books API', docs: '/api-docs', health: '/api/health' });
  });
  // ניהול: כל מה שמתחת מחייב Token של מנהלת
  app.use('/api/admin', authenticate, requireAdmin, adminRouter, adminBooksRouter, adminMaterialsRouter, adminFaqsRouter, adminProductsRouter, adminOrdersRouter, adminContactRouter);

  // ציבורי
  app.use('/api', healthRouter, authRouter, booksRouter, materialsRouter, faqsRouter, productsRouter, ordersRouter, downloadsRouter, contactRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
