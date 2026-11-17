import type { Request, Response } from 'express';
import type { z } from 'zod';
import * as adminService from './admin.service';
import type { uploadBody } from './admin.schemas';

/** לוח בקרה */
export async function stats(_req: Request, res: Response): Promise<void> {
  res.json(await adminService.stats());
}

/** "משתמשים": אין הרשמה באתר, לכן לקוחות = מי שהזמינו */
export async function customers(req: Request, res: Response): Promise<void> {
  res.json(await adminService.customers(req.query as unknown as { page: number; pageSize: number; q?: string }));
}

/** העלאת קובץ/תמונה (לשימוש בטפסי הניהול) */
export async function upload(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof uploadBody>;
  res.status(201).json(await adminService.uploadFile(req.file, body.area, body.folder));
}
