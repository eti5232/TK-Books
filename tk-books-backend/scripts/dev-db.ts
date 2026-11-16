/**
 * מפעיל מסד PostgreSQL אמיתי לפיתוח מקומי (בלי להתקין Postgres ובלי Docker).
 * שימוש: npm run db:dev   (להשאיר את החלון פתוח; Ctrl+C לעצירה)
 * המסד מחכה בכתובת: postgresql://postgres:postgres@localhost:5433/tkbooks
 */
import fs from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const dir = path.resolve('.dev-db', 'data');
const port = Number(process.env.DEV_DB_PORT ?? 5433);

async function main(): Promise<void> {
  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: 'postgres',
    password: 'postgres',
    port,
    persistent: true,
  });

  const firstRun = !fs.existsSync(path.join(dir, 'PG_VERSION'));
  if (firstRun) await pg.initialise();
  await pg.start();
  if (firstRun) await pg.createDatabase('tkbooks');

  console.log(`PostgreSQL פועל: postgresql://postgres:postgres@localhost:${port}/tkbooks`);
  console.log('Ctrl+C לעצירה');

  const stop = async (): Promise<void> => {
    await pg.stop();
    process.exit(0);
  };
  process.on('SIGINT', () => void stop());
  process.on('SIGTERM', () => void stop());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
