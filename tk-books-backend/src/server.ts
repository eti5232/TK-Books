import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`✅ TK Books API פועל על פורט ${env.PORT}`);
  console.log(`   Swagger: ${env.publicBaseUrl}/api-docs`);
  console.log(`   Health:  ${env.publicBaseUrl}/api/health`);
});

const shutdown = (): void => {
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
