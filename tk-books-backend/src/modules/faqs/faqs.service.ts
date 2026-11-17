import type { Faq, Prisma } from '@prisma/client';
import { notFound } from '../../utils/app-error';
import { prisma } from '../../db/prisma';
import { paginate } from '../../utils/validation';

export function serializeFaq(f: Faq, admin = false) {
  return {
    id: f.id,
    bookId: f.bookId,
    questionHe: f.questionHe,
    questionEn: f.questionEn,
    answerHe: f.answerHe,
    answerEn: f.answerEn,
    sortOrder: f.sortOrder,
    ...(admin ? { isActive: f.isActive, createdAt: f.createdAt, updatedAt: f.updatedAt } : {}),
  };
}

const searchWhere = (q?: string): Prisma.FaqWhereInput =>
  q
    ? {
        OR: [
          { questionHe: { contains: q, mode: 'insensitive' } },
          { questionEn: { contains: q, mode: 'insensitive' } },
          { answerHe: { contains: q, mode: 'insensitive' } },
          { answerEn: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

export async function listPublic(opts: { bookSlug?: string; scope: 'all' | 'general'; includeGeneral?: boolean; q?: string }) {
  const filters: Prisma.FaqWhereInput[] = [{ isActive: true }, searchWhere(opts.q)];
  if (opts.scope === 'general') {
    filters.push({ bookId: null });
  } else if (opts.bookSlug) {
    const book = await prisma.book.findFirst({ where: { slug: opts.bookSlug, isActive: true }, select: { id: true } });
    if (!book) throw notFound('הספר לא נמצא / Book not found', 'BOOK_NOT_FOUND');
    filters.push(opts.includeGeneral ? { OR: [{ bookId: book.id }, { bookId: null }] } : { bookId: book.id });
  }
  const rows = await prisma.faq.findMany({ where: { AND: filters }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  return { items: rows.map((f) => serializeFaq(f)) };
}

export async function adminList(opts: { page: number; pageSize: number; q?: string; bookId?: string }) {
  const where: Prisma.FaqWhereInput = { ...(opts.bookId ? { bookId: opts.bookId } : {}), ...searchWhere(opts.q) };
  const [total, rows] = await Promise.all([
    prisma.faq.count({ where }),
    prisma.faq.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize }),
  ]);
  return paginate(rows.map((f) => serializeFaq(f, true)), total, opts.page, opts.pageSize);
}

export async function create(data: Prisma.FaqUncheckedCreateInput) {
  if (data.bookId && !(await prisma.book.findUnique({ where: { id: data.bookId } }))) {
    throw notFound('הספר לא נמצא / Book not found', 'BOOK_NOT_FOUND');
  }
  return serializeFaq(await prisma.faq.create({ data }), true);
}

export async function update(id: string, data: Prisma.FaqUncheckedUpdateInput) {
  return serializeFaq(await prisma.faq.update({ where: { id }, data }), true);
}

export async function remove(id: string): Promise<void> {
  await prisma.faq.delete({ where: { id } });
}
