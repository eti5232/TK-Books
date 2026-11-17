import { afterAll } from 'vitest';
import { prisma } from '../src/db/prisma';

// סוגר את החיבור למסד אחרי כל קובץ בדיקות כדי שהתהליך יסתיים נקי
afterAll(async () => {
  await prisma.$disconnect();
});
