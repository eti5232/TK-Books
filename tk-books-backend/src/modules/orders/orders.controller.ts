import type { Request, Response } from 'express';
import type { z } from 'zod';
import * as orderService from './orders.service';
import type { adminOrderListQuery } from './orders.schemas';

const id = (req: Request): string => req.params['id'] as string;

/* ---------- ציבורי ---------- */
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

/* ---------- ניהול ---------- */
export async function adminListOrders(req: Request, res: Response): Promise<void> {
  res.json(await orderService.adminList(req.query as unknown as z.infer<typeof adminOrderListQuery>));
}
export async function adminGetOrder(req: Request, res: Response): Promise<void> {
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
