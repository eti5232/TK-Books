import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { openApiSpec } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';
import { adminRouter } from './routes/adminRoutes';
import { publicRouter } from './routes/publicRoutes';
import { localPublicDir } from './services/storageService';

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
  app.use('/api/admin', adminRouter);
  app.use('/api', publicRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
