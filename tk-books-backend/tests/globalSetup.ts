import { execSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

/**
 * לפני הבדיקות: מרים PostgreSQL אמיתי זמני (או משתמש ב-TEST_DATABASE_URL אם הוגדר),
 * מריץ עליו את כל ה-Migrations האמיתיות, ומנקה בסוף.
 */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 54329;
      srv.close(() => resolve(port));
    });
  });
}

let pg: EmbeddedPostgres | undefined;
let dataDir: string | undefined;

export async function setup(): Promise<void> {
  let url = process.env['TEST_DATABASE_URL'];
  if (!url) {
    const port = await freePort(); // פורט פנוי אקראי, כדי שלא יתנגש עם הרצה קודמת
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tkbooks-test-pg-'));
    pg = new EmbeddedPostgres({ databaseDir: path.join(dataDir, 'data'), user: 'postgres', password: 'postgres', port, persistent: true });
    await pg.initialise();
    await pg.start();
    await pg.createDatabase('tkbooks_test');
    url = `postgresql://postgres:postgres@localhost:${port}/tkbooks_test`;
  }
  process.env['DATABASE_URL'] = url;
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
}

export async function teardown(): Promise<void> {
  if (pg) await pg.stop();
  if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(path.resolve('uploads-test'), { recursive: true, force: true });
}
