import type { DownloadGrant, Order, OrderItem, OrderStatus, Prisma } from '@prisma/client';
import { env } from '../config/env';
import { addBusinessDays, addDays } from '../lib/businessDays';
import { badRequest, conflict, notFound } from '../lib/errors';
import { generateDownloadToken, generateOrderCode } from '../lib/orderCode';
import { prisma } from '../lib/prisma';
import { paginate } from '../validation/common';
import { sendMail } from './emailService';
import * as tpl from './emailTemplates';
import * as payment from './paymentService';

type ItemWithGrants = OrderItem & { grants: DownloadGrant[]; product: { kind: 'DIGITAL' | 'PHYSICAL'; slug: string } };
type OrderFull = Order & { items: ItemWithGrants[] };

const fullInclude = { items: { include: { grants: true, product: { select: { kind: true, slug: true } } } } } as const;

export const downloadUrl = (token: string): string => `${env.publicBaseUrl}/api/downloads/${token}`;

/** סטטוסים שבהם הלקוחה כבר שילמה (ומותר להוריד קבצים) */
export const PAID_STATUSES: OrderStatus[] = ['PAID', 'ORDERED', 'SHIPPED', 'DELIVERED'];

function serializeItem(i: ItemWithGrants, now: Date) {
  const grant = i.grants.find((g) => !g.revokedAt) ?? null;
  return {
    id: i.id,
    productId: i.productId,
    productSlug: i.product.slug,
    nameHe: i.productNameHe,
    nameEn: i.productNameEn,
    kind: i.product.kind,
    quantity: i.quantity,
    unitPriceAgorot: i.unitPriceAgorot,
    lineTotalAgorot: i.unitPriceAgorot * i.quantity,
    download: grant
      ? {
          url: downloadUrl(grant.token),
          expiresAt: grant.expiresAt,
          expired: grant.expiresAt <= now,
          downloadsLeft: Math.max(0, grant.maxDownloads - grant.downloadCount),
        }
      : null,
  };
}

/** תצוגת הזמנה למנהלת */
export function serializeAdminOrder(o: OrderFull) {
  const now = new Date();
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    shippingAddress: o.shippingAddress,
    notes: o.notes,
    adminNote: o.adminNote,
    preferredLanguage: o.preferredLanguage,
    totalAgorot: o.totalAgorot,
    currency: 'ILS',
    paymentRef: o.paymentRef,
    trackingNumber: o.trackingNumber,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    orderedAt: o.orderedAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    estimatedDeliveryAt: o.estimatedDeliveryAt,
    items: o.items.map((i) => serializeItem(i, now)),
  };
}

/** תצוגת הזמנה ללקוחה (מעקב). לא כוללת טלפון/כתובת/הערות פנימיות. */
export function serializeTrackedOrder(o: OrderFull) {
  const now = new Date();
  const hasPhysical = o.items.some((i) => i.product.kind === 'PHYSICAL');
  const late = hasPhysical && !!o.estimatedDeliveryAt && o.estimatedDeliveryAt < now && (o.status === 'PAID' || o.status === 'ORDERED' || o.status === 'SHIPPED');
  return {
    code: o.code,
    status: o.status,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    orderedAt: o.orderedAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    estimatedDeliveryAt: o.estimatedDeliveryAt,
    trackingNumber: o.trackingNumber,
    hasPhysicalItems: hasPhysical,
    deliveryLate: late,
    canPay: o.status === 'PENDING',
    statusNote: o.status === 'CANCELLED' || o.status === 'REFUNDED' ? o.adminNote : null,
    contactPath: `/contact?order=${o.code}`,
    supportEmail: env.SUPPORT_EMAIL,
    totalAgorot: o.totalAgorot,
    currency: 'ILS',
    items: o.items.map((i) => serializeItem(i, now)),
  };
}

const mailItems = (o: OrderFull) => o.items.map((i) => ({ productNameHe: i.productNameHe, productNameEn: i.productNameEn, quantity: i.quantity, unitPriceAgorot: i.unitPriceAgorot }));
const mailOrder = (o: OrderFull) => ({
  code: o.code,
  customerName: o.customerName,
  preferredLanguage: o.preferredLanguage,
  totalAgorot: o.totalAgorot,
  estimatedDeliveryAt: o.estimatedDeliveryAt,
  trackingNumber: o.trackingNumber,
  adminNote: o.adminNote,
  items: mailItems(o),
});

/* ---------------- יצירת הזמנה (אורחת) ---------------- */
export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  preferredLanguage: 'he' | 'en';
  shippingAddress?: { street: string; city: string; zip?: string };
  notes?: string;
  items: { productId: string; quantity: number }[];
}

/** יוצרת הזמנה בסטטוס PENDING (ממתינה לתשלום). מייל ללקוחה ולמנהלת נשלח רק אחרי תשלום. */
export async function createOrder(input: CreateOrderInput) {
  // איחוד פריטים כפולים
  const merged = new Map<string, number>();
  for (const it of input.items) merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.quantity);
  for (const [productId, qty] of merged) {
    if (qty > env.MAX_ITEM_QUANTITY) {
      throw badRequest('QUANTITY_TOO_HIGH', `מקסימום ${env.MAX_ITEM_QUANTITY} יחידות לפריט. לכמויות גדולות פני אל ${env.SUPPORT_EMAIL}`, { productId, supportEmail: env.SUPPORT_EMAIL });
    }
  }

  const products = await prisma.product.findMany({ where: { id: { in: [...merged.keys()] }, isActive: true } });
  if (products.length !== merged.size) {
    const found = new Set(products.map((p) => p.id));
    throw badRequest('PRODUCT_UNAVAILABLE', 'אחד המוצרים אינו קיים או אינו זמין להזמנה', { missing: [...merged.keys()].filter((id) => !found.has(id)) });
  }
  const hasPhysical = products.some((p) => p.kind === 'PHYSICAL');
  if (hasPhysical && !input.shippingAddress) {
    throw badRequest('SHIPPING_ADDRESS_REQUIRED', 'בהזמנה יש מוצר פיזי – חובה למלא כתובת למשלוח');
  }

  const itemsData = products.map((p) => ({
    productId: p.id,
    quantity: merged.get(p.id) ?? 1,
    unitPriceAgorot: p.priceAgorot, // המחיר נלקח מהשרת בלבד
    productNameHe: p.nameHe,
    productNameEn: p.nameEn,
  }));
  const total = itemsData.reduce((s, i) => s + i.unitPriceAgorot * i.quantity, 0);

  let order: OrderFull | null = null;
  for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
    try {
      order = await prisma.order.create({
        data: {
          code: generateOrderCode(),
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone || null,
          preferredLanguage: input.preferredLanguage,
          shippingAddress: hasPhysical ? (input.shippingAddress as Prisma.InputJsonValue) : undefined,
          notes: input.notes || null,
          totalAgorot: total,
          items: { create: itemsData },
        },
        include: fullInclude,
      });
    } catch (e) {
      if (!(e instanceof Error && 'code' in e && (e as { code: string }).code === 'P2002')) throw e; // התנגשות קוד – מנסים שוב
    }
  }
  if (!order) throw conflict('CODE_GENERATION_FAILED', 'לא הצלחנו ליצור קוד הזמנה, נסי שוב');

  return {
    code: order.code,
    status: order.status,
    totalAgorot: order.totalAgorot,
    currency: 'ILS',
    requiresShipping: hasPhysical,
    paymentMode: payment.mode(),
  };
}

/* ---------------- תשלום ---------------- */

/**
 * סימון הזמנה כשולמה. זו הפונקציה היחידה ש"פותחת" את ההזמנה:
 * חברת סליקה אמיתית תקרא לה מה-webhook שלה. בטוחה לקריאה חוזרת (idempotent).
 */
export async function markPaid(id: string, paymentRef: string) {
  const current = await loadOrder(id);
  if (PAID_STATUSES.includes(current.status)) return serializeAdminOrder(current); // כבר שולמה – לא עושים כלום
  assertStatus(current, ['PENDING'], 'תשלום');

  const now = new Date();
  const hasPhysical = current.items.some((i) => i.product.kind === 'PHYSICAL');
  const digitalItems = await prisma.orderItem.findMany({
    where: { orderId: id, product: { kind: 'DIGITAL', digitalFileKey: { not: null } } },
    select: { id: true },
  });
  const expiresAt = addDays(now, env.DOWNLOAD_VALID_DAYS);

  // עדכון מותנה בסטטוס: אם שתי בקשות הגיעו יחד, רק אחת מהן תצליח
  const claimed = await prisma.order.updateMany({
    where: { id, status: 'PENDING' },
    data: {
      status: hasPhysical ? 'PAID' : 'DELIVERED', // הזמנה דיגיטלית בלבד נמסרת מיד
      paidAt: now,
      paymentRef,
      deliveredAt: hasPhysical ? null : now,
      estimatedDeliveryAt: hasPhysical ? addBusinessDays(now, env.DELIVERY_BUSINESS_DAYS) : null,
    },
  });
  if (claimed.count === 0) return serializeAdminOrder(await loadOrder(id));
  await prisma.downloadGrant.createMany({
    data: digitalItems.map((i) => ({ orderItemId: i.id, token: generateDownloadToken(), expiresAt })),
  });

  const updated = await loadOrder(id);
  const links = updated.items.flatMap((i) =>
    i.grants.filter((g) => !g.revokedAt).map((g) => ({ name: updated.preferredLanguage === 'he' ? i.productNameHe : i.productNameEn, url: downloadUrl(g.token), expiresAt: g.expiresAt })),
  );
  await Promise.all([
    sendMail({ to: updated.customerEmail, type: 'ORDER_PAID', mail: tpl.orderPaid(mailOrder(updated), links), orderId: id }),
    sendMail({ to: env.adminNotifyEmail, type: 'ADMIN_ORDER_PAID', mail: tpl.adminOrderPaid({ ...mailOrder(updated), customerEmail: updated.customerEmail, hasPhysical }), orderId: id }),
  ]);
  return serializeAdminOrder(updated);
}

/** תשלום דמה: לא גובה כסף. זמין רק כש-PAYMENT_DRIVER=fake. */
export async function payDemo(code: string, email: string, outcome: 'success' | 'fail') {
  if (payment.mode() !== 'fake') throw notFound('לא נמצא / Not found', 'NOT_FOUND');
  const o = await prisma.order.findFirst({ where: { code, customerEmail: email }, select: { id: true, status: true } });
  if (!o) throw notFound('לא נמצאה הזמנה עם הקוד והמייל האלה / Order not found', 'ORDER_NOT_FOUND');
  if (outcome === 'fail') throw badRequest('PAYMENT_FAILED', 'התשלום נכשל (דמה). אפשר לנסות שוב / Payment failed (demo). You can try again');
  await markPaid(o.id, payment.newDemoRef());
  return trackOrder(code, email);
}

/* ---------------- מעקב (אורחת) ---------------- */
export async function trackOrder(code: string, email: string) {
  const o = await prisma.order.findFirst({ where: { code, customerEmail: email }, include: fullInclude });
  // אותה תשובה גם כשהקוד קיים והמייל שגוי – לא חושפים אילו הזמנות קיימות
  if (!o) throw notFound('לא נמצאה הזמנה עם הקוד והמייל האלה / Order not found', 'ORDER_NOT_FOUND');
  return serializeTrackedOrder(o);
}

/* ---------------- ניהול (מנהלת) ---------------- */
export async function adminList(opts: { page: number; pageSize: number; status?: OrderStatus; q?: string }) {
  const where: Prisma.OrderWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.q
      ? {
          OR: [
            { code: { contains: opts.q.toUpperCase() } },
            { customerName: { contains: opts.q, mode: 'insensitive' } },
            { customerEmail: { contains: opts.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize, include: fullInclude }),
  ]);
  return paginate(rows.map(serializeAdminOrder), total, opts.page, opts.pageSize);
}

async function loadOrder(id: string): Promise<OrderFull> {
  const o = await prisma.order.findUnique({ where: { id }, include: fullInclude });
  if (!o) throw notFound('ההזמנה לא נמצאה / Order not found', 'ORDER_NOT_FOUND');
  return o;
}

export async function adminGet(id: string) {
  return serializeAdminOrder(await loadOrder(id));
}

function assertStatus(o: Order, allowed: OrderStatus[], action: string): void {
  if (!allowed.includes(o.status)) {
    throw conflict('INVALID_STATUS', `לא ניתן לבצע "${action}" על הזמנה בסטטוס ${o.status}`);
  }
}

/** ביטול הזמנה שעוד לא שולמה */
export async function cancel(id: string, reason?: string) {
  const current = await loadOrder(id);
  assertStatus(current, ['PENDING'], 'ביטול');
  await prisma.order.update({ where: { id }, data: { status: 'CANCELLED', adminNote: reason ?? current.adminNote } });
  return serializeAdminOrder(await loadOrder(id));
}

/** הזמנה שולמה → הוזמנה מהספק */
export async function markOrdered(id: string) {
  const current = await loadOrder(id);
  assertStatus(current, ['PAID'], 'סימון כהוזמנה מהספק');
  await prisma.order.update({ where: { id }, data: { status: 'ORDERED', orderedAt: new Date() } });
  return serializeAdminOrder(await loadOrder(id));
}

/** נשלחה ללקוחה (אפשר להוסיף מספר מעקב). מותר גם ישר מ-PAID. */
export async function ship(id: string, trackingNumber?: string) {
  const current = await loadOrder(id);
  assertStatus(current, ['PAID', 'ORDERED'], 'סימון כנשלח');
  await prisma.order.update({
    where: { id },
    data: { status: 'SHIPPED', shippedAt: new Date(), trackingNumber: trackingNumber || null },
  });
  const updated = await loadOrder(id);
  await sendMail({ to: updated.customerEmail, type: 'ORDER_SHIPPED', mail: tpl.orderShipped(mailOrder(updated)), orderId: id });
  return serializeAdminOrder(updated);
}

export async function deliver(id: string) {
  const current = await loadOrder(id);
  assertStatus(current, ['SHIPPED'], 'סימון כנמסר');
  await prisma.order.update({ where: { id }, data: { status: 'DELIVERED', deliveredAt: new Date() } });
  return serializeAdminOrder(await loadOrder(id));
}

/**
 * ביטול + החזר כספי להזמנה ששולמה. בדמה אין כסף אמיתי להחזיר;
 * עם חברת סליקה אמיתית כאן תתווסף קריאה להחזר דרך ה-API שלה.
 */
export async function refund(id: string, reason?: string) {
  const current = await loadOrder(id);
  assertStatus(current, ['PAID', 'ORDERED', 'SHIPPED', 'DELIVERED'], 'החזר כספי');
  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { status: 'REFUNDED', adminNote: reason ?? current.adminNote } }),
    prisma.downloadGrant.updateMany({ where: { orderItem: { orderId: id }, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  const updated = await loadOrder(id);
  await sendMail({ to: updated.customerEmail, type: 'ORDER_REFUNDED', mail: tpl.orderRefunded(mailOrder(updated)), orderId: id });
  return serializeAdminOrder(updated);
}

/** הארכת קישורי ההורדה ב-3 ימים נוספים (מהרגע הנוכחי / מהפקיעה, הגדול מביניהם) */
export async function extendDownloads(id: string) {
  const current = await loadOrder(id);
  assertStatus(current, PAID_STATUSES, 'הארכת הורדה');
  const now = new Date();
  for (const item of current.items) {
    for (const g of item.grants) {
      if (g.revokedAt) continue;
      const base = g.expiresAt > now ? g.expiresAt : now;
      await prisma.downloadGrant.update({ where: { id: g.id }, data: { expiresAt: addDays(base, env.DOWNLOAD_VALID_DAYS) } });
    }
  }
  return serializeAdminOrder(await loadOrder(id));
}
