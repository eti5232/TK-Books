import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 180000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
      CORS_ORIGIN: 'http://localhost:5173',
      STORAGE_DRIVER: 'local',
      UPLOAD_DIR: 'uploads-test',
      SUPPORT_EMAIL: 'support@tkbooks.test',
      ADMIN_NOTIFY_EMAIL: 'owner@tkbooks.test',
      PUBLIC_BASE_URL: 'http://localhost:3000',
    },
  },
});
