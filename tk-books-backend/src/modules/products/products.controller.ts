import type { Request, Response } from 'express';
import type { z } from 'zod';
import * as productService from './products.service';
import type { adminProductListQuery, productListQuery } from './products.schemas';

const id = (req: Request): string => req.params['id'] as string;

/* ---------- ציבורי ---------- */
export async function listProducts(req: Request, res: Response): Promise<void> {
  res.json(await productService.listPublic(req.query as unknown as z.infer<typeof productListQuery>));
}
export async function getProduct(req: Request, res: Response): Promise<void> {
  res.json(await productService.getPublic(req.params['slug'] as string));
}

/* ---------- ניהול ---------- */
export async function adminListProducts(req: Request, res: Response): Promise<void> {
  res.json(await productService.adminList(req.query as unknown as z.infer<typeof adminProductListQuery>));
}
export async function adminGetProduct(req: Request, res: Response): Promise<void> {
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
