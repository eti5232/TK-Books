import type { Request, Response } from 'express';
import type { z } from 'zod';
import * as contactService from './contact.service';
import type { contactListQuery } from './contact.schemas';

const id = (req: Request): string => req.params['id'] as string;

/* ---------- ציבורי ---------- */
export async function createMessage(req: Request, res: Response): Promise<void> {
  res.status(201).json(await contactService.createMessage(req.body as Parameters<typeof contactService.createMessage>[0]));
}

/* ---------- ניהול ---------- */
export async function listMessages(req: Request, res: Response): Promise<void> {
  res.json(await contactService.adminList(req.query as unknown as z.infer<typeof contactListQuery>));
}
export async function updateMessage(req: Request, res: Response): Promise<void> {
  res.json(await contactService.setStatus(id(req), (req.body as { status: 'NEW' | 'HANDLED' }).status));
}
export async function deleteMessage(req: Request, res: Response): Promise<void> {
  await contactService.remove(id(req));
  res.status(204).end();
}
