import { forbidden, gone, notFound } from '../../utils/app-error';
import { prisma } from '../../db/prisma';
import { PAID_STATUSES } from '../orders/orders.service';
import { readFile } from '../../services/storage.service';

/** הורדת מוצר דיגיטלי ששולם/אושר. בודק: קיום, ביטול, תוקף (3 ימים), סטטוס הזמנה ומכסת הורדות. */
export async function consumeDownload(token: string) {
  const grant = await prisma.downloadGrant.findUnique({
    where: { token },
    include: { orderItem: { include: { product: true, order: true } } },
  });
  if (!grant) throw notFound('קישור ההורדה לא נמצא / Download link not found', 'DOWNLOAD_NOT_FOUND');

  const { order, product } = grant.orderItem;
  if (grant.revokedAt || !PAID_STATUSES.includes(order.status)) {
    throw forbidden('DOWNLOAD_REVOKED', 'ההרשאה להורדה בוטלה / Download access was revoked');
  }
  if (grant.expiresAt <= new Date()) {
    throw gone('DOWNLOAD_EXPIRED', 'תוקף ההורדה (3 ימים) הסתיים. אפשר לפנות אלינו להארכה / Download link expired');
  }
  if (grant.downloadCount >= grant.maxDownloads) {
    throw forbidden('DOWNLOAD_LIMIT_REACHED', 'הגעת למספר ההורדות המקסימלי / Download limit reached');
  }
  if (!product.digitalFileKey) throw notFound('הקובץ לא נמצא / File not found', 'FILE_NOT_FOUND');

  const file = await readFile('private', product.digitalFileKey);
  await prisma.downloadGrant.update({ where: { id: grant.id }, data: { downloadCount: { increment: 1 } } });

  const ext = product.digitalFileKey.includes('.') ? product.digitalFileKey.slice(product.digitalFileKey.lastIndexOf('.')) : '';
  return { ...file, filename: `${product.slug}${ext}` };
}
