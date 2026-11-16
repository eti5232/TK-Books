import type { Request, Response } from 'express';
import { unauthorized } from '../lib/errors';
import * as authService from '../services/authService';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  res.json(await authService.login(email, password));
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw unauthorized('UNAUTHORIZED', 'Missing token');
  res.json(await authService.me(req.user.id));
}
