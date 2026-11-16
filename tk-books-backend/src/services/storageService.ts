import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { AppError, notFound } from '../lib/errors';

export type StorageArea = 'public' | 'private';

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.zip': 'application/zip',
};

export const contentTypeFor = (key: string): string =>
  MIME_BY_EXT[path.extname(key).toLowerCase()] ?? 'application/octet-stream';

const rootDir = (): string => path.resolve(env.UPLOAD_DIR);

/** מונע יציאה מחוץ לתיקיית האחסון (path traversal) */
function safeLocalPath(area: StorageArea, key: string): string {
  const base = path.join(rootDir(), area);
  const full = path.resolve(base, key);
  if (!full.startsWith(base + path.sep)) throw new AppError(400, 'INVALID_KEY', 'מפתח קובץ לא תקין');
  return full;
}

function supabaseBucket(area: StorageArea): string {
  return area === 'public' ? env.SUPABASE_BUCKET_PUBLIC : env.SUPABASE_BUCKET_PRIVATE;
}

function supabaseHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY ?? ''}`, apikey: env.SUPABASE_SERVICE_KEY ?? '', ...extra };
}

const supabaseObjectUrl = (area: StorageArea, key: string, mode: 'object' | 'authenticated' | 'public' = 'object'): string => {
  const prefix = mode === 'object' ? 'object' : `object/${mode}`;
  return `${env.SUPABASE_URL}/storage/v1/${prefix}/${supabaseBucket(area)}/${key.split('/').map(encodeURIComponent).join('/')}`;
};

export async function saveFile(area: StorageArea, key: string, buffer: Buffer, contentType: string): Promise<void> {
  if (env.STORAGE_DRIVER === 'supabase') {
    const res = await fetch(supabaseObjectUrl(area, key), {
      method: 'POST',
      headers: supabaseHeaders({ 'Content-Type': contentType, 'x-upsert': 'true' }),
      body: new Uint8Array(buffer),
    });
    if (!res.ok) throw new AppError(502, 'STORAGE_ERROR', `שמירת קובץ נכשלה (${res.status})`);
    return;
  }
  const full = safeLocalPath(area, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer);
}

export async function readFile(area: StorageArea, key: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (env.STORAGE_DRIVER === 'supabase') {
    const res = await fetch(supabaseObjectUrl(area, key, 'authenticated'), { headers: supabaseHeaders() });
    if (res.status === 404 || res.status === 400) throw notFound('הקובץ לא נמצא באחסון', 'FILE_NOT_FOUND');
    if (!res.ok) throw new AppError(502, 'STORAGE_ERROR', `קריאת קובץ נכשלה (${res.status})`);
    return { buffer: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') ?? contentTypeFor(key) };
  }
  const full = safeLocalPath(area, key);
  try {
    return { buffer: await fs.readFile(full), contentType: contentTypeFor(key) };
  } catch {
    throw notFound('הקובץ לא נמצא באחסון', 'FILE_NOT_FOUND');
  }
}

/** מחיקה "בטוחה": לא זורקת שגיאה אם הקובץ לא קיים */
export async function deleteFile(area: StorageArea, key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    if (env.STORAGE_DRIVER === 'supabase') {
      await fetch(supabaseObjectUrl(area, key), { method: 'DELETE', headers: supabaseHeaders() });
    } else {
      await fs.rm(safeLocalPath(area, key), { force: true });
    }
  } catch {
    /* מתעלמים – ניקוי קבצים הוא best-effort */
  }
}

/** כתובת ציבורית לתמונה (כריכות, תמונות מוצרים) */
export function publicUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (/^https?:\/\//.test(key)) return key;
  if (env.STORAGE_DRIVER === 'supabase') return supabaseObjectUrl('public', key, 'public');
  return `${env.publicBaseUrl}/files/${key.split('/').map(encodeURIComponent).join('/')}`;
}

/** ב-Supabase: יוצר את שני ה-buckets (ציבורי ופרטי) אם עדיין לא קיימים. נקרא מה-Seed בעת העלייה. */
export async function ensureBuckets(): Promise<void> {
  if (env.STORAGE_DRIVER !== 'supabase') return;
  for (const area of ['public', 'private'] as const) {
    const name = supabaseBucket(area);
    const res = await fetch(`${env.SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: supabaseHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: name, name, public: area === 'public' }),
    });
    const body = await res.text();
    if (res.ok) console.log(`🪣 נוצר bucket ${name} (${area})`);
    else if (res.status === 409 || /already exists|Duplicate/i.test(body)) console.log(`🪣 bucket ${name} כבר קיים`);
    else console.warn(`⚠️  יצירת bucket ${name} נכשלה (${res.status}): ${body}. אפשר ליצור אותו ידנית ב-Supabase.`);
  }
}

export const localPublicDir =(): string => path.join(rootDir(), 'public');
