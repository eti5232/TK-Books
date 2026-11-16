import bcrypt from 'bcryptjs';
import request from 'supertest';
import sharp from 'sharp';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { samplePdf } from '../src/seed/placeholders';
import { saveFile } from '../src/services/storageService';

export const app = createApp();
export const api = (): ReturnType<typeof request> => request(app);

export const ADMIN = { email: 'admin@tkbooks.test', password: 'Test-Pass-123!' };

export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "EmailLog","DownloadGrant","OrderItem","Order","ProductImage","Product","Faq","Material","BookPage","Book","ContactMessage","Admin" RESTART IDENTITY CASCADE',
  );
}

export async function adminToken(): Promise<string> {
  const exists = await prisma.admin.findUnique({ where: { email: ADMIN.email } });
  if (!exists) {
    await prisma.admin.create({ data: { email: ADMIN.email, name: 'Test Admin', passwordHash: await bcrypt.hash(ADMIN.password, 4) } });
  }
  const res = await api().post('/api/auth/login').send(ADMIN);
  return res.body.token as string;
}

export const auth = (token: string): { Authorization: string } => ({ Authorization: `Bearer ${token}` });

export async function makeBook(slug = 'book-1', extra: Record<string, unknown> = {}) {
  return prisma.book.create({ data: { slug, titleHe: `ספר ${slug}`, titleEn: `Book ${slug}`, ...extra } });
}

export async function makeProduct(opts: { slug: string; kind?: 'DIGITAL' | 'PHYSICAL'; price?: number; bookId?: string; isActive?: boolean; category?: 'FLASHCARDS' | 'STICKERS' | 'OTHER'; nameEn?: string }) {
  const kind = opts.kind ?? 'DIGITAL';
  let digitalFileKey: string | null = null;
  if (kind === 'DIGITAL') {
    digitalFileKey = `products/${opts.slug}.pdf`;
    await saveFile('private', digitalFileKey, samplePdf(opts.slug), 'application/pdf');
  }
  return prisma.product.create({
    data: {
      slug: opts.slug,
      kind,
      category: opts.category ?? 'OTHER',
      nameHe: `מוצר ${opts.slug}`,
      nameEn: opts.nameEn ?? `Product ${opts.slug}`,
      priceAgorot: opts.price ?? 1000,
      bookId: opts.bookId,
      isActive: opts.isActive ?? true,
      digitalFileKey,
    },
  });
}

export const pngBuffer = (): Promise<Buffer> =>
  sharp({ create: { width: 200, height: 300, channels: 3, background: '#ffccdd' } }).png().toBuffer();

export const validOrder = (items: { productId: string; quantity: number }[], extra: Record<string, unknown> = {}) => ({
  customerName: 'דנה כהן',
  customerEmail: 'Dana@Example.com',
  customerPhone: '050-1234567',
  preferredLanguage: 'he',
  items,
  ...extra,
});

export const address = { street: 'הרצל 1', city: 'חיפה', zip: '3300000' };
