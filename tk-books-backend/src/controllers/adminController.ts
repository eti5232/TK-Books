import type { Request, Response } from 'express';
import type { z } from 'zod';
import { badRequest } from '../lib/errors';
import * as adminService from '../services/adminService';
import * as bookService from '../services/bookService';
import * as contactService from '../services/contactService';
import * as faqService from '../services/faqService';
import * as materialService from '../services/materialService';
import * as orderService from '../services/orderService';
import * as productService from '../services/productService';
import type { addPagesBody, adminFaqListQuery, adminListQuery, adminMaterialListQuery, adminProductListQuery, uploadBody } from '../validation/catalog';
import type { adminOrderListQuery, contactListQuery } from '../validation/orders';

const id = (req: Request): string => req.params['id'] as string;

/* לוח בקרה */
export async function stats(_req: Request, res: Response): Promise<void> {
  res.json(await adminService.stats());
}
export async function customers(req: Request, res: Response): Promise<void> {
  res.json(await adminService.customers(req.query as unknown as { page: number; pageSize: number; q?: string }));
}

/* העלאה */
export async function upload(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof uploadBody>;
  res.status(201).json(await adminService.uploadFile(req.file, body.area, body.folder));
}

/* ספרים */
export async function listBooks(req: Request, res: Response): Promise<void> {
  res.json(await bookService.adminListBooks(req.query as unknown as z.infer<typeof adminListQuery>));
}
export async function getBook(req: Request, res: Response): Promise<void> {
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

/* חומרים */
export async function listMaterials(req: Request, res: Response): Promise<void> {
  res.json(await materialService.adminList(req.query as unknown as z.infer<typeof adminMaterialListQuery>));
}
export async function getMaterial(req: Request, res: Response): Promise<void> {
  res.json(await materialService.adminGet(id(req)));
}
export async function createMaterial(req: Request, res: Response): Promise<void> {
  res.status(201).json(await materialService.create(req.body as Parameters<typeof materialService.create>[0]));
}
export async function updateMaterial(req: Request, res: Response): Promise<void> {
  res.json(await materialService.update(id(req), req.body as Parameters<typeof materialService.update>[1]));
}
export async function deleteMaterial(req: Request, res: Response): Promise<void> {
  await materialService.remove(id(req));
  res.status(204).end();
}

/* שאלות נפוצות */
export async function listFaqs(req: Request, res: Response): Promise<void> {
  res.json(await faqService.adminList(req.query as unknown as z.infer<typeof adminFaqListQuery>));
}
export async function createFaq(req: Request, res: Response): Promise<void> {
  res.status(201).json(await faqService.create(req.body as Parameters<typeof faqService.create>[0]));
}
export async function updateFaq(req: Request, res: Response): Promise<void> {
  res.json(await faqService.update(id(req), req.body as Parameters<typeof faqService.update>[1]));
}
export async function deleteFaq(req: Request, res: Response): Promise<void> {
  await faqService.remove(id(req));
  res.status(204).end();
}

/* מוצרים */
export async function listProducts(req: Request, res: Response): Promise<void> {
  res.json(await productService.adminList(req.query as unknown as z.infer<typeof adminProductListQuery>));
}
export async function getProduct(req: Request, res: Response): Promise<void> {
  res.json(await productService.adminGet(id(req)));
}
export async function createProduct(req: Request, res: Response): Promise<void> {
  res.status(201).json(await productService.create(req.body as Parameters<typeof productService.create>[0]));
}
export async function updateProduct(req: Request, res: Response): Promise<void> {
  res.json(await productService.update(id(req), req.body as Parameters<typeof productService.update>[1]));
}
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  await productService.remove(id(req));
  res.status(204).end();
}

/* הזמנות */
export async function listOrders(req: Request, res: Response): Promise<void> {
  res.json(await orderService.adminList(req.query as unknown as z.infer<typeof adminOrderListQuery>));
}
export async function getOrder(req: Request, res: Response): Promise<void> {
  res.json(await orderService.adminGet(id(req)));
}
export async function markOrdered(req: Request, res: Response): Promise<void> {
  res.json(await orderService.markOrdered(id(req)));
}
export async function refundOrder(req: Request, res: Response): Promise<void> {
  res.json(await orderService.refund(id(req), (req.body as { reason?: string }).reason));
}
export async function cancelOrder(req: Request, res: Response): Promise<void> {
  res.json(await orderService.cancel(id(req), (req.body as { reason?: string }).reason));
}
export async function shipOrder(req: Request, res: Response): Promise<void> {
  res.json(await orderService.ship(id(req), (req.body as { trackingNumber?: string }).trackingNumber));
}
export async function deliverOrder(req: Request, res: Response): Promise<void> {
  res.json(await orderService.deliver(id(req)));
}
export async function extendDownloads(req: Request, res: Response): Promise<void> {
  res.json(await orderService.extendDownloads(id(req)));
}

/* פניות */
export async function listContacts(req: Request, res: Response): Promise<void> {
  res.json(await contactService.adminList(req.query as unknown as z.infer<typeof contactListQuery>));
}
export async function updateContact(req: Request, res: Response): Promise<void> {
  res.json(await contactService.setStatus(id(req), (req.body as { status: 'NEW' | 'HANDLED' }).status));
}
export async function deleteContact(req: Request, res: Response): Promise<void> {
  await contactService.remove(id(req));
  res.status(204).end();
}
