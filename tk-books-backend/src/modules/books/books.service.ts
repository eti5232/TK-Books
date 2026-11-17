import { randomUUID } from 'node:crypto';
import type { Book, Prisma } from '@prisma/client';
import sharp from 'sharp';
import { badRequest, conflict, notFound } from '../../utils/app-error';
import { slugify } from '../../utils/order-code';
import { prisma } from '../../db/prisma';
import { paginate } from '../../utils/validation';
import { deleteFile, publicUrl, readFile, saveFile } from '../../services/storage.service';

type BookWithCount = Book & { _count: { pages: number; materials: number; faqs: number; products: number } };

const countInclude = { _count: { select: { pages: true, materials: true, faqs: true, products: true } } } as const;

export function serializeBook(b: BookWithCount, admin = false) {
  return {
    id: b.id,
    slug: b.slug,
    titleHe: b.titleHe,
    titleEn: b.titleEn,
    descriptionHe: b.descriptionHe,
    descriptionEn: b.descriptionEn,
    coverImageUrl: publicUrl(b.coverImageKey),
    sortOrder: b.sortOrder,
    pageCount: b._count.pages,
    ...(admin
      ? {
          isActive: b.isActive,
          coverImageKey: b.coverImageKey,
          counts: { materials: b._count.materials, faqs: b._count.faqs, products: b._count.products },
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        }
      : {}),
  };
}

export async function listBooks() {
  const books = await prisma.book.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: countInclude,
  });
  return { items: books.map((b) => serializeBook(b)) };
}

export async function getBookBySlug(slug: string) {
  const book = await prisma.book.findFirst({ where: { slug, isActive: true }, include: countInclude });
  if (!book) throw notFound('הספר לא נמצא / Book not found', 'BOOK_NOT_FOUND');
  const grouped = await prisma.material.groupBy({
    by: ['type'],
    where: { bookId: book.id, isActive: true },
    _count: { _all: true },
  });
  const materialCounts = { SONG: 0, TEST: 0, REVIEW_SHEET: 0, TEACHER_GUIDE: 0 } as Record<string, number>;
  for (const g of grouped) materialCounts[g.type] = g._count._all;
  const [faqCount, productCount] = await Promise.all([
    prisma.faq.count({ where: { bookId: book.id, isActive: true } }),
    prisma.product.count({ where: { bookId: book.id, isActive: true } }),
  ]);
  return { ...serializeBook(book), materialCounts, faqCount, productCount };
}

/** תמונת עמוד עם סימן מים. לא נשמר מטמון, אין URL ישיר לקובץ. */
export async function getPageImage(slug: string, pageNumber: number): Promise<Buffer> {
  const book = await prisma.book.findFirst({ where: { slug, isActive: true }, select: { id: true } });
  if (!book) throw notFound('הספר לא נמצא / Book not found', 'BOOK_NOT_FOUND');
  const page = await prisma.bookPage.findUnique({ where: { bookId_pageNumber: { bookId: book.id, pageNumber } } });
  if (!page) throw notFound('העמוד לא נמצא / Page not found', 'PAGE_NOT_FOUND');
  const { buffer } = await readFile('private', page.storageKey);
  const { data, info } = await sharp(buffer).resize({ width: 1400, withoutEnlargement: true }).toBuffer({ resolveWithObject: true });
  return sharp(data)
    .composite([{ input: Buffer.from(watermarkSvg(info.width, info.height)) }])
    .webp({ quality: 80 })
    .toBuffer();
}

function watermarkSvg(w: number, h: number): string {
  const stepX = 360;
  const stepY = 260;
  let texts = '';
  for (let y = 80; y < h + stepY; y += stepY) {
    for (let x = ((y / stepY) % 2) * 180; x < w + stepX; x += stepX) {
      texts += `<text x="${x}" y="${y}" transform="rotate(-28 ${x} ${y})">TK Books - Teachers only</text>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="bold" fill="#e0559b" fill-opacity="0.16">${texts}</g></svg>`;
}

/* ---------------- ניהול (מנהלת) ---------------- */
export async function adminListBooks(opts: { page: number; pageSize: number; q?: string }) {
  const where: Prisma.BookWhereInput = opts.q
    ? { OR: [{ titleHe: { contains: opts.q, mode: 'insensitive' } }, { titleEn: { contains: opts.q, mode: 'insensitive' } }, { slug: { contains: opts.q, mode: 'insensitive' } }] }
    : {};
  const [total, rows] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      include: countInclude,
    }),
  ]);
  return paginate(rows.map((b) => serializeBook(b, true)), total, opts.page, opts.pageSize);
}

export async function adminGetBook(id: string) {
  const b = await prisma.book.findUnique({ where: { id }, include: countInclude });
  if (!b) throw notFound('הספר לא נמצא / Book not found', 'BOOK_NOT_FOUND');
  const pages = await prisma.bookPage.findMany({ where: { bookId: id }, orderBy: { pageNumber: 'asc' }, select: { pageNumber: true } });
  return { ...serializeBook(b, true), pageNumbers: pages.map((p) => p.pageNumber) };
}

type BookInput = {
  slug?: string;
  titleHe?: string;
  titleEn?: string;
  descriptionHe?: string;
  descriptionEn?: string;
  coverImageKey?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export async function createBook(input: BookInput & { titleHe: string; titleEn: string }) {
  const slug = input.slug ?? slugify(input.titleEn);
  if (await prisma.book.findUnique({ where: { slug } })) throw conflict('SLUG_TAKEN', `ה-slug "${slug}" כבר קיים`);
  const b = await prisma.book.create({ data: { ...input, slug }, include: countInclude });
  return serializeBook(b, true);
}

export async function updateBook(id: string, input: BookInput) {
  if (input.slug) {
    const other = await prisma.book.findUnique({ where: { slug: input.slug } });
    if (other && other.id !== id) throw conflict('SLUG_TAKEN', `ה-slug "${input.slug}" כבר קיים`);
  }
  const b = await prisma.book.update({ where: { id }, data: input, include: countInclude });
  return serializeBook(b, true);
}

export async function deleteBook(id: string): Promise<void> {
  const book = await prisma.book.findUnique({
    where: { id },
    include: { pages: true, materials: { select: { fileKey: true } } },
  });
  if (!book) throw notFound('הספר לא נמצא / Book not found', 'BOOK_NOT_FOUND');
  await prisma.book.delete({ where: { id } }); // עמודים/חומרים/שאלות נמחקים בקסקדה; מוצרים נשארים ללא שיוך
  await Promise.all([
    ...book.pages.map((p) => deleteFile('private', p.storageKey)),
    ...book.materials.map((m) => deleteFile('private', m.fileKey)),
    deleteFile('public', book.coverImageKey),
  ]);
}

/** העלאת עמודי ספר (תמונות). נשמרים כ-WebP בדלי פרטי. replace=true מוחק את העמודים הקיימים קודם. */
export async function addPages(bookId: string, files: Express.Multer.File[], replace: boolean) {
  if (files.length === 0) throw badRequest('NO_FILES', 'לא נשלחו קבצים (שדה pages)');
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw notFound('הספר לא נמצא / Book not found', 'BOOK_NOT_FOUND');

  if (replace) {
    const old = await prisma.bookPage.findMany({ where: { bookId } });
    await prisma.bookPage.deleteMany({ where: { bookId } });
    await Promise.all(old.map((p) => deleteFile('private', p.storageKey)));
  }
  const last = await prisma.bookPage.aggregate({ where: { bookId }, _max: { pageNumber: true } });
  let n = last._max.pageNumber ?? 0;
  const created: number[] = [];
  for (const f of files) {
    n += 1;
    const webp = await sharp(f.buffer).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    const key = `books/${book.slug}/page-${n}-${randomUUID().slice(0, 8)}.webp`;
    await saveFile('private', key, webp, 'image/webp');
    await prisma.bookPage.create({ data: { bookId, pageNumber: n, storageKey: key } });
    created.push(n);
  }
  return { added: created.length, pageNumbers: created };
}

export async function deletePage(bookId: string, pageNumber: number): Promise<void> {
  const page = await prisma.bookPage.findUnique({ where: { bookId_pageNumber: { bookId, pageNumber } } });
  if (!page) throw notFound('העמוד לא נמצא / Page not found', 'PAGE_NOT_FOUND');
  await prisma.bookPage.delete({ where: { id: page.id } });
  await deleteFile('private', page.storageKey);
}
