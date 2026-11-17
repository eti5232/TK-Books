import type { Request, Response } from 'express';
import type { z } from 'zod';
import * as faqService from './faqs.service';
import type { adminFaqListQuery, faqListQuery } from './faqs.schemas';

const id = (req: Request): string => req.params['id'] as string;

/* ---------- ציבורי ---------- */
export async function listFaqs(req: Request, res: Response): Promise<void> {
  res.json(await faqService.listPublic(req.query as unknown as z.infer<typeof faqListQuery>));
}

/* ---------- ניהול ---------- */
export async function adminListFaqs(req: Request, res: Response): Promise<void> {
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
