import type { Request, Response } from 'express';
import type { z } from 'zod';
import * as materialService from './materials.service';
import type { adminMaterialListQuery, materialListQuery } from './materials.schemas';

const id = (req: Request): string => req.params['id'] as string;

/* ---------- ציבורי ---------- */
export async function listMaterials(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as z.infer<typeof materialListQuery>;
  res.json(await materialService.listForBook(req.params['slug'] as string, q));
}
export async function downloadMaterial(req: Request, res: Response): Promise<void> {
  const file = await materialService.getDownload(id(req));
  res.set({ 'Content-Type': file.contentType, 'Cache-Control': 'no-store' });
  res.attachment(file.filename);
  res.send(file.buffer);
}

/* ---------- ניהול ---------- */
export async function adminListMaterials(req: Request, res: Response): Promise<void> {
  res.json(await materialService.adminList(req.query as unknown as z.infer<typeof adminMaterialListQuery>));
}
export async function adminGetMaterial(req: Request, res: Response): Promise<void> {
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
