import 'dotenv/config';
import { z } from 'zod';

const emptyToUndef = (v: unknown): unknown => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const str = () => z.preprocess(emptyToUndef, z.string().optional());
const bool = () =>
  z.preprocess(emptyToUndef, z.enum(['true', 'false']).optional()).transform((v) => (v === undefined ? undefined : v === 'true'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL חסר'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET חייב להיות באורך 16 תווים לפחות (מומלץ 32+)'),
  JWT_EXPIRES_IN: z.preprocess(emptyToUndef, z.string().default('8h')),
  CORS_ORIGIN: z.preprocess(emptyToUndef, z.string().default('http://localhost:5173')),
  FRONTEND_URL: str(),
  PUBLIC_BASE_URL: str(),
  RENDER_EXTERNAL_URL: str(),

  STORAGE_DRIVER: z.preprocess(emptyToUndef, z.enum(['local', 'supabase']).default('local')),
  UPLOAD_DIR: z.preprocess(emptyToUndef, z.string().default('uploads')),
  SUPABASE_URL: str(),
  SUPABASE_SERVICE_KEY: str(),
  SUPABASE_BUCKET_PUBLIC: z.preprocess(emptyToUndef, z.string().default('tk-public')),
  SUPABASE_BUCKET_PRIVATE: z.preprocess(emptyToUndef, z.string().default('tk-private')),

  SMTP_HOST: str(),
  SMTP_PORT: z.preprocess(emptyToUndef, z.coerce.number().int().default(587)),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  MAIL_FROM: z.preprocess(emptyToUndef, z.string().default('TK Books <no-reply@example.com>')),
  SUPPORT_EMAIL: z.preprocess(emptyToUndef, z.string().email().default('support@example.com')),
  ADMIN_NOTIFY_EMAIL: str(),

  ADMIN_EMAIL: str(),
  ADMIN_PASSWORD: str(),
  ADMIN_NAME: z.preprocess(emptyToUndef, z.string().default('TK Admin')),
  SEED_DEMO: bool(),

  // fake = תשלום דמה (לפיתוח/הדגמה בלבד – לא גובה כסף!). חברת סליקה אמיתית תתווסף בהמשך.
  PAYMENT_DRIVER: z.preprocess(emptyToUndef, z.enum(['fake']).default('fake')),
  ALLOW_FAKE_PAYMENTS_IN_PRODUCTION: bool(),

  DOWNLOAD_VALID_DAYS: z.preprocess(emptyToUndef, z.coerce.number().int().positive().default(3)),
  DELIVERY_BUSINESS_DAYS: z.preprocess(emptyToUndef, z.coerce.number().int().positive().default(7)),
  MAX_ITEM_QUANTITY: z.preprocess(emptyToUndef, z.coerce.number().int().min(1).max(10).default(10)),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ הגדרות סביבה לא תקינות:');
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

const raw = parsed.data;
const corsOrigins = raw.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
const publicBaseUrl = (raw.PUBLIC_BASE_URL ?? raw.RENDER_EXTERNAL_URL ?? `http://localhost:${raw.PORT}`).replace(/\/+$/, '');

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  corsOrigins,
  publicBaseUrl,
  frontendUrl: (raw.FRONTEND_URL ?? corsOrigins.find((o) => o !== '*') ?? 'http://localhost:5173').replace(/\/+$/, ''),
  adminNotifyEmail: raw.ADMIN_NOTIFY_EMAIL ?? raw.SUPPORT_EMAIL,
};

// הגנה: תשלום דמה בענן = מוצרים בחינם לכולם. חובה אישור מפורש.
if (env.isProd && env.PAYMENT_DRIVER === 'fake' && !env.ALLOW_FAKE_PAYMENTS_IN_PRODUCTION) {
  console.error('❌ PAYMENT_DRIVER=fake (תשלום דמה) אסור בייצור: כל אחת היתה מקבלת מוצרים בלי לשלם.');
  console.error('   לבדיקה בענן בלבד אפשר להגדיר ALLOW_FAKE_PAYMENTS_IN_PRODUCTION=true.');
  process.exit(1);
}

if (env.STORAGE_DRIVER === 'supabase' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY)) {
  console.error('❌ STORAGE_DRIVER=supabase דורש SUPABASE_URL ו-SUPABASE_SERVICE_KEY');
  process.exit(1);
}
