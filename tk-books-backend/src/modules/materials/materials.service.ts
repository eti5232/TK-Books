import type { Material, MaterialType, Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { notFound } from '../../utils/app-error';
import { prisma } from '../../db/prisma';
import { paginate } from '../../utils/validation';
import { deleteFile, readFile } from '../../services/storage.service';

export function serializeMaterial(m: Material, admin = false) {
  return {
    id: m.id,
    bookId: m.bookId,
    type: m.type,
    titleHe: m.titleHe,
    titleEn: m.titleEn,
    descriptionHe: m.descriptionHe,
    descriptionEn: m.descriptionEn,
    unit: m.unit,
    sortOrder: m.sortOrder,
    mediaUrl: m.mediaUrl,
    lyricsHe: m.lyricsHe,
    lyricsEn: m.lyricsEn,
    hasFile: !!m.fileKey,
    downloadUrl: m.fileKey ? `${env.publicBaseUrl}/api/materials/${m.id}/download` : null,
    ...(admin ? { fileKey: m.fileKey, isActive: m.isActive, createdAt: m.createdAt, updatedAt: m.updatedAt } : {}),
  };
}

const searchWhere = (q?: string): Prisma.MaterialWhereInput =>
  q
    ? {
        OR: [
          { titleHe: { contains: q, mode: 'insensitive' } },
          { titleEn: { contains: q, mode: 'insensitive' } },
          { descriptionHe: { contains: q, mode: 'insensitive' } },
          { descriptionEn: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

export async function listForBook(
  slug: string,
  opts: { type?: MaterialType; q?: string; sort: 'order' | 'title' | 'new'; page: number; pageSize: number },
) {
  const book = await prisma.book.findFirst({ where: { slug, isActive: true }, select: { id: true } });
  if (!book) throw notFound('הספר לא נמצא / Book not found', 'BOOK_NOT_FOUND');
  const where: Prisma.MaterialWhereInput = { bookId: book.id, isActive: true, ...(opts.type ? { type: opts.type } : {}), ...searchWhere(opts.q) };
  const orderBy: Prisma.MaterialOrderByWithRelationInput[] =
    opts.sort === 'title' ? [{ titleEn: 'asc' }] : opts.sort === 'new' ? [{ createdAt: 'desc' }] : [{ unit: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }];
  const [total, rows] = await Promise.all([
    prisma.material.count({ where }),
    prisma.material.findMany({ where, orderBy, skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize }),
  ]);
  return paginate(rows.map((m) => serializeMaterial(m)), total, opts.page, opts.pageSize);
}

export async function getDownload(id: string) {
  const m = await prisma.material.findFirst({ where: { id, isActive: true, book: { isActive: true } } });
  if (!m || !m.fileKey) throw notFound('הקובץ לא נמצא / File not found', 'FILE_NOT_FOUND');
  const file = await readFile('private', m.fileKey);
  const ext = m.fileKey.includes('.') ? m.fileKey.slice(m.fileKey.lastIndexOf('.')) : '';
  const base = m.titleEn.replace(/[^A-Za-z0-9 _-]+/g, '').trim().replace(/\s+/g, '-') || 'material';
  return { ...file, filename: `${base}${ext}` };
}

/* ---------------- ניהול ---------------- */
export async function adminList(opts: { page: number; pageSize: number; q?: string; bookId?: string; type?: MaterialType; includeInactive?: boolean }) {
  const where: Prisma.MaterialWhereInput = { ...(opts.bookId ? { bookId: opts.bookId } : {}), ...(opts.type ? { type: opts.type } : {}), ...searchWhere(opts.q) };
  const [total, rows] = await Promise.all([
    prisma.material.count({ where }),
    prisma.material.findMany({ where, orderBy: [{ bookId: 'asc' }, { type: 'asc' }, { sortOrder: 'asc' }], skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize }),
  ]);
  return paginate(rows.map((m) => serializeMaterial(m, true)), total, opts.page, opts.pageSize);
}

export async function adminGet(id: string) {
  const m = await prisma.material.findUnique({ where: { id } });
  if (!m) throw notFound('החומר לא נמצא / Material not found', 'MATERIAL_NOT_FOUND');
  return serializeMaterial(m, true);
}

export async function create(data: Prisma.MaterialUncheckedCreateInput) {
  const book = await prisma.book.findUnique({ where: { id: data.bookId } });
  if (!book) throw notFound('הספר לא נמצא / Book not found', 'BOOK_NOT_FOUND');
  return serializeMaterial(await prisma.material.create({ data }), true);
}

export async function update(id: string, data: Prisma.MaterialUncheckedUpdateInput) {
  return serializeMaterial(await prisma.material.update({ where: { id }, data }), true);
}

export async function remove(id: string): Promise<void> {
  const m = await prisma.material.delete({ where: { id } });
  await deleteFile('private', m.fileKey);
}
