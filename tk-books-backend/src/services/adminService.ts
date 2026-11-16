import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { badRequest } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { paginate } from '../validation/common';
import { ALLOWED_MIME } from '../middleware/upload';
import { publicUrl, saveFile, type StorageArea } from './storageService';

export async function stats() {
  const [pendingOrders, totalOrders, newMessages, books, materials, products, faqs] = await Promise.all([
    prisma.order.count({ where: { status: { in: ['PAID', 'ORDERED'] } } }), // הזמנות ששולמו וממתינות לטיפול (הזמנה מהספק / שליחה)
    prisma.order.count(),
    prisma.contactMessage.count({ where: { status: 'NEW' } }),
    prisma.book.count(),
    prisma.material.count(),
    prisma.product.count(),
    prisma.faq.count(),
  ]);
  return { pendingOrders, totalOrders, newMessages, books, materials, products, faqs };
}

/** "משתמשים": אין הרשמה באתר, לכן לקוחות = מי שהזמינו. מקובצים לפי מייל. */
export async function customers(opts: { page: number; pageSize: number; q?: string }) {
  const q = opts.q?.toLowerCase();
  const groups = await prisma.order.groupBy({
    by: ['customerEmail'],
    where: q ? { OR: [{ customerEmail: { contains: q, mode: 'insensitive' } }, { customerName: { contains: q, mode: 'insensitive' } }] } : {},
    _count: { _all: true },
    _sum: { totalAgorot: true },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: 'desc' } },
  });
  const pageGroups = groups.slice((opts.page - 1) * opts.pageSize, opts.page * opts.pageSize);
  const latest = await prisma.order.findMany({
    where: { customerEmail: { in: pageGroups.map((g) => g.customerEmail) } },
    orderBy: { createdAt: 'desc' },
    select: { customerEmail: true, customerName: true, customerPhone: true },
  });
  const byEmail = new Map<string, { customerName: string; customerPhone: string | null }>();
  for (const o of latest) if (!byEmail.has(o.customerEmail)) byEmail.set(o.customerEmail, o);

  const items = pageGroups.map((g) => ({
    email: g.customerEmail,
    name: byEmail.get(g.customerEmail)?.customerName ?? '',
    phone: byEmail.get(g.customerEmail)?.customerPhone ?? null,
    ordersCount: g._count._all,
    totalAgorot: g._sum.totalAgorot ?? 0,
    lastOrderAt: g._max.createdAt,
  }));
  return paginate(items, groups.length, opts.page, opts.pageSize);
}

export async function uploadFile(file: Express.Multer.File | undefined, area: StorageArea, folder: string) {
  if (!file) throw badRequest('NO_FILE', 'לא נשלח קובץ (שדה file)');
  const isImage = file.mimetype.startsWith('image/');
  if (area === 'public' && !isImage) throw badRequest('PUBLIC_IMAGES_ONLY', 'באזור public מותר להעלות תמונות בלבד');
  const ext = ALLOWED_MIME[file.mimetype] ?? path.extname(file.originalname).toLowerCase();
  const key = `${folder}/${randomUUID()}${ext}`;
  await saveFile(area, key, file.buffer, file.mimetype);
  return { area, key, url: area === 'public' ? publicUrl(key) : null, size: file.size, contentType: file.mimetype };
}
