import type { Request, Response } from 'express';
import type { z } from 'zod';
import { badRequest } from '../../utils/app-error';
import * as bookService from './books.service';
import type { addPagesBody, adminBookListQuery } from './books.schemas';

/* ---------- ציבורי ---------- */
export async function listBooks(_req: Request, res: Response): Promise<void> {
  res.json(await bookService.listBooks());
}
export async function getBook(req: Request, res: Response): Promise<void> {
  res.json(await bookService.getBookBySlug(req.params['slug'] as string));
}
export async function getBookPage(req: Request, res: Response): Promise<void> {
  const { slug, n } = req.params as unknown as { slug: string; n: number };
  const image = await bookService.getPageImage(slug, n);
  res.set({
    'Content-Type': 'image/webp',
    'Content-Disposition': 'inline; filename="page.webp"',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(image);
}

/* ---------- ניהול ---------- */
const id = (req: Request): string => req.params['id'] as string;

export async function adminListBooks(req: Request, res: Response): Promise<void> {
  res.json(await bookService.adminListBooks(req.query as unknown as z.infer<typeof adminBookListQuery>));
}
export async function adminGetBook(req: Request, res: Response): Promise<void> {
  res.json(await bookService.adminGetBook(id(req)));
}
export async function createBook(req: Request, res: Response): Promise<void> {
  res.status(201).json(await bookService.createBook(req.body as Parameters<typeof bookService.createBook>[0]));
}
export async function updateBook(req: Request, res: Response): Promise<void> {
  res.json(await bookService.updateBook(id(req), req.body as Parameters<typeof bookService.updateBook>[1]));
}
export async function deleteBook(req: Request, res: Response): Promise<void> {
  await bookService.deleteBook(id(req));
  res.status(204).end();
}
export async function addPages(req: Request, res: Response): Promise<void> {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!Array.isArray(req.files)) throw badRequest('NO_FILES', 'לא נשלחו קבצים');
  const { replace } = req.body as z.infer<typeof addPagesBody>;
  res.status(201).json(await bookService.addPages(id(req), files, replace));
}
export async function deletePage(req: Request, res: Response): Promise<void> {
  const { id: bookId, n } = req.params as unknown as { id: string; n: number };
  await bookService.deletePage(bookId, n);
  res.status(204).end();
}
