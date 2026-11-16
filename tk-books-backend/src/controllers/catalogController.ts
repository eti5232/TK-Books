import type { Request, Response } from 'express';
import type { z } from 'zod';
import * as bookService from '../services/bookService';
import * as faqService from '../services/faqService';
import * as materialService from '../services/materialService';
import * as productService from '../services/productService';
import type { faqListQuery, materialListQuery, productListQuery } from '../validation/catalog';

/* ספרים */
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

/* חומרי למידה */
export async function listMaterials(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as z.infer<typeof materialListQuery>;
  res.json(await materialService.listForBook(req.params['slug'] as string, q));
}
export async function downloadMaterial(req: Request, res: Response): Promise<void> {
  const file = await materialService.getDownload(req.params['id'] as string);
  res.set({ 'Content-Type': file.contentType, 'Cache-Control': 'no-store' });
  res.attachment(file.filename);
  res.send(file.buffer);
}

/* שאלות נפוצות */
export async function listFaqs(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as z.infer<typeof faqListQuery>;
  res.json(await faqService.listPublic(q));
}

/* מוצרים */
export async function listProducts(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as z.infer<typeof productListQuery>;
  res.json(await productService.listPublic(q));
}
export async function getProduct(req: Request, res: Response): Promise<void> {
  res.json(await productService.getPublic(req.params['slug'] as string));
}
