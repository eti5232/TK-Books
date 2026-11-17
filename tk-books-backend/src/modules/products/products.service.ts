import type { Prisma, Product, ProductCategory, ProductImage, ProductKind } from '@prisma/client';
import { badRequest, conflict, notFound } from '../../utils/app-error';
import { slugify } from '../../utils/order-code';
import { prisma } from '../../db/prisma';
import { paginate } from '../../utils/validation';
import { deleteFile, publicUrl } from '../../services/storage.service';

type ProductFull = Product & { images: ProductImage[]; book: { slug: string; titleHe: string; titleEn: string } | null };

const include = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  book: { select: { slug: true, titleHe: true, titleEn: true } },
};

export function serializeProduct(p: ProductFull, admin = false) {
  return {
    id: p.id,
    slug: p.slug,
    bookId: p.bookId,
    book: p.book,
    kind: p.kind,
    category: p.category,
    nameHe: p.nameHe,
    nameEn: p.nameEn,
    descriptionHe: p.descriptionHe,
    descriptionEn: p.descriptionEn,
    priceAgorot: p.priceAgorot,
    currency: p.currency,
    images: p.images.map((i) => ({ url: publicUrl(i.key), altHe: i.altHe, altEn: i.altEn })),
    ...(admin
      ? {
          isActive: p.isActive,
          digitalFileKey: p.digitalFileKey,
          imageKeys: p.images.map((i) => i.key),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }
      : {}),
  };
}

const searchWhere = (q?: string): Prisma.ProductWhereInput =>
  q
    ? {
        OR: [
          { nameHe: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
          { descriptionHe: { contains: q, mode: 'insensitive' } },
          { descriptionEn: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

export async function listPublic(opts: {
  kind?: ProductKind;
  category?: ProductCategory;
  bookSlug?: string;
  q?: string;
  sort: 'new' | 'price_asc' | 'price_desc' | 'name';
  page: number;
  pageSize: number;
}) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(opts.kind ? { kind: opts.kind } : {}),
    ...(opts.category ? { category: opts.category } : {}),
    ...(opts.bookSlug ? { book: { slug: opts.bookSlug } } : {}),
    ...searchWhere(opts.q),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    opts.sort === 'price_asc' ? { priceAgorot: 'asc' } : opts.sort === 'price_desc' ? { priceAgorot: 'desc' } : opts.sort === 'name' ? { nameEn: 'asc' } : { createdAt: 'desc' };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize, include }),
  ]);
  return paginate(rows.map((p) => serializeProduct(p)), total, opts.page, opts.pageSize);
}

export async function getPublic(slug: string) {
  const p = await prisma.product.findFirst({ where: { slug, isActive: true }, include });
  if (!p) throw notFound('המוצר לא נמצא / Product not found', 'PRODUCT_NOT_FOUND');
  return serializeProduct(p);
}

export async function adminList(opts: { page: number; pageSize: number; q?: string; kind?: ProductKind; category?: ProductCategory }) {
  const where: Prisma.ProductWhereInput = { ...(opts.kind ? { kind: opts.kind } : {}), ...(opts.category ? { category: opts.category } : {}), ...searchWhere(opts.q) };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize, include }),
  ]);
  return paginate(rows.map((p) => serializeProduct(p, true)), total, opts.page, opts.pageSize);
}

export async function adminGet(id: string) {
  const p = await prisma.product.findUnique({ where: { id }, include });
  if (!p) throw notFound('המוצר לא נמצא / Product not found', 'PRODUCT_NOT_FOUND');
  return serializeProduct(p, true);
}

interface ProductInput {
  slug?: string;
  bookId?: string | null;
  kind?: ProductKind;
  category?: ProductCategory;
  nameHe?: string;
  nameEn?: string;
  descriptionHe?: string;
  descriptionEn?: string;
  priceAgorot?: number;
  digitalFileKey?: string | null;
  images?: { key: string; altHe: string; altEn: string }[];
  isActive?: boolean;
}

async function assertBook(bookId: string | null | undefined): Promise<void> {
  if (bookId && !(await prisma.book.findUnique({ where: { id: bookId } }))) throw notFound('הספר לא נמצא / Book not found', 'BOOK_NOT_FOUND');
}

export async function create(input: ProductInput & { kind: ProductKind; nameHe: string; nameEn: string; priceAgorot: number }) {
  await assertBook(input.bookId);
  const { images = [], slug: rawSlug, ...rest } = input;
  const slug = rawSlug ?? slugify(input.nameEn);
  if (await prisma.product.findUnique({ where: { slug } })) throw conflict('SLUG_TAKEN', `ה-slug "${slug}" כבר קיים`);
  if (rest.kind === 'PHYSICAL') rest.digitalFileKey = null;
  const p = await prisma.product.create({
    data: { ...rest, slug, images: { create: images.map((im, i) => ({ ...im, sortOrder: i })) } },
    include,
  });
  return serializeProduct(p, true);
}

export async function update(id: string, input: ProductInput) {
  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) throw notFound('המוצר לא נמצא / Product not found', 'PRODUCT_NOT_FOUND');
  await assertBook(input.bookId);
  if (input.slug) {
    const other = await prisma.product.findUnique({ where: { slug: input.slug } });
    if (other && other.id !== id) throw conflict('SLUG_TAKEN', `ה-slug "${input.slug}" כבר קיים`);
  }
  const { images, ...rest } = input;
  const nextKind = rest.kind ?? current.kind;
  if (nextKind === 'PHYSICAL') rest.digitalFileKey = null;
  if (nextKind === 'DIGITAL' && !(rest.digitalFileKey ?? current.digitalFileKey)) {
    throw badRequest('DIGITAL_FILE_REQUIRED', 'מוצר דיגיטלי חייב קובץ להורדה (digitalFileKey)');
  }
  const p = await prisma.$transaction(async (tx) => {
    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({ data: images.map((im, i) => ({ ...im, productId: id, sortOrder: i })) });
    }
    return tx.product.update({ where: { id }, data: rest, include });
  });
  return serializeProduct(p, true);
}

export async function remove(id: string): Promise<void> {
  const p = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!p) throw notFound('המוצר לא נמצא / Product not found', 'PRODUCT_NOT_FOUND');
  const used = await prisma.orderItem.count({ where: { productId: id } });
  if (used > 0) throw conflict('PRODUCT_IN_USE', 'המוצר הוזמן בעבר ולכן לא ניתן למחוק אותו. אפשר להסתיר אותו (isActive=false).');
  await prisma.product.delete({ where: { id } });
  await Promise.all([deleteFile('private', p.digitalFileKey), ...p.images.map((i) => deleteFile('public', i.key))]);
}
