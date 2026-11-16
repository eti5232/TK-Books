import type { Request, Response } from 'express';
import * as contactService from '../services/contactService';
import * as downloadService from '../services/downloadService';
import * as orderService from '../services/orderService';

export async function createOrder(req: Request, res: Response): Promise<void> {
  res.status(201).json(await orderService.createOrder(req.body as orderService.CreateOrderInput));
}

export async function trackOrder(req: Request, res: Response): Promise<void> {
  const { code, email } = req.body as { code: string; email: string };
  res.json(await orderService.trackOrder(code, email));
}

export async function payDemo(req: Request, res: Response): Promise<void> {
  const { code, email, outcome } = req.body as { code: string; email: string; outcome: 'success' | 'fail' };
  res.json(await orderService.payDemo(code, email, outcome));
}

export async function download(req: Request, res: Response): Promise<void> {
  const file = await downloadService.consumeDownload(req.params['token'] as string);
  res.set({ 'Content-Type': file.contentType, 'Cache-Control': 'no-store' });
  res.attachment(file.filename);
  res.send(file.buffer);
}

export async function contact(req: Request, res: Response): Promise<void> {
  res.status(201).json(await contactService.createMessage(req.body as Parameters<typeof contactService.createMessage>[0]));
}
