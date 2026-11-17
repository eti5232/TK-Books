import type { Request, Response } from 'express';
import * as downloadService from './downloads.service';

export async function download(req: Request, res: Response): Promise<void> {
  const file = await downloadService.consumeDownload(req.params['token'] as string);
  res.set({ 'Content-Type': file.contentType, 'Cache-Control': 'no-store' });
  res.attachment(file.filename);
  res.send(file.buffer);
}
