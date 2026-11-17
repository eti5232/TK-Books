import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { address, adminToken, api, auth, makeProduct, resetDb, validOrder } from './helpers';

let token: string;
let digital: { id: string; slug: string };
let physical: { id: string; slug: string };
let hidden: { id: string };

beforeAll(async () => {
  await resetDb();
  token = await adminToken();
  digital = await makeProduct({ slug: 'digi', kind: 'DIGITAL', price: 2500 });
  physical = await makeProduct({ slug: 'phys', kind: 'PHYSICAL', price: 1500 });
  hidden = await makeProduct({ slug: 'hid', kind: 'PHYSICAL', isActive: false });
});

beforeEach(async () => {
  await prisma.emailLog.deleteMany();
});

async function placeOrder(items: { productId: string; quantity: number }[], extra: Record<string, unknown> = {}) {
  const res = await api().post('/api/orders').send(validOrder(items, extra));
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as { code: string; status: string; totalAgorot: number };
}
async function pay(code: string, email = 'dana@example.com') {
  return api().post('/api/orders/pay-demo').send({ code, email });
}
const orderId = async (code: string): Promise<string> => (await prisma.order.findUniqueOrThrow({ where: { code } })).id;

describe('יצירת הזמנה (אורחת)', () => {
  it('יוצרת הזמנה PENDING (ממתינה לתשלום), מחשבת מחיר בשרת, לא שולחת מיילים עד התשלום', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 2 }]);
    expect(o.code).toMatch(/^TK-[A-Z0-9]{6}$/);
    expect(o.status).toBe('PENDING');
    expect(o.totalAgorot).toBe(5000);
    const logs = await prisma.emailLog.findMany();
    expect(logs).toHaveLength(0);
    const row = await prisma.order.findUniqueOrThrow({ where: { code: o.code } });
    expect(row.customerEmail).toBe('dana@example.com'); // נשמר באותיות קטנות
  });

  it('מתעלמת ממחיר שנשלח מהלקוח', async () => {
    const res = await api().post('/api/orders').send(validOrder([{ productId: digital.id, quantity: 1, unitPriceAgorot: 1 } as never]));
    expect(res.status).toBe(201);
    expect(res.body.totalAgorot).toBe(2500);
  });

  it('כמות מעל 10 => 400 עם מייל התמיכה', async () => {
    const res = await api().post('/api/orders').send(validOrder([{ productId: digital.id, quantity: 11 }]));
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('support@tkbooks.test');
  });

  it('איחוד פריטים כפולים שעוברים 10 => 400', async () => {
    const res = await api().post('/api/orders').send(validOrder([{ productId: digital.id, quantity: 6 }, { productId: digital.id, quantity: 6 }]));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('QUANTITY_TOO_HIGH');
  });

  it('כמות 0 / שלילית / עשרונית => 400', async () => {
    for (const quantity of [0, -1, 1.5]) {
      expect((await api().post('/api/orders').send(validOrder([{ productId: digital.id, quantity }]))).status, String(quantity)).toBe(400);
    }
  });

  it('כמות 10 בדיוק מותרת', async () => {
    expect((await api().post('/api/orders').send(validOrder([{ productId: digital.id, quantity: 10 }]))).status).toBe(201);
  });

  it('מוצר פיזי בלי כתובת => 400; עם כתובת => 201', async () => {
    const no = await api().post('/api/orders').send(validOrder([{ productId: physical.id, quantity: 1 }]));
    expect(no.status).toBe(400);
    expect(no.body.error.code).toBe('SHIPPING_ADDRESS_REQUIRED');
    const yes = await api().post('/api/orders').send(validOrder([{ productId: physical.id, quantity: 1 }], { shippingAddress: address }));
    expect(yes.status).toBe(201);
    expect(yes.body.requiresShipping).toBe(true);
  });

  it('מוצר מוסתר / לא קיים / הזמנה ריקה / מייל לא תקין => 400', async () => {
    expect((await api().post('/api/orders').send(validOrder([{ productId: hidden.id, quantity: 1 }], { shippingAddress: address }))).body.error.code).toBe('PRODUCT_UNAVAILABLE');
    expect((await api().post('/api/orders').send(validOrder([{ productId: '3b241101-e2bb-4255-8caf-4136c566a962', quantity: 1 }]))).status).toBe(400);
    expect((await api().post('/api/orders').send(validOrder([]))).status).toBe(400);
    expect((await api().post('/api/orders').send(validOrder([{ productId: digital.id, quantity: 1 }], { customerEmail: 'bad' }))).status).toBe(400);
  });
});

describe('מעקב הזמנה', () => {
  it('קוד + מייל נכונים => סטטוס; בלי נתונים פרטיים', async () => {
    const o = await placeOrder([{ productId: physical.id, quantity: 1 }], { shippingAddress: address, notes: 'פרטי' });
    const res = await api().post('/api/orders/track').send({ code: o.code.toLowerCase(), email: 'DANA@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.contactPath).toBe(`/contact?order=${o.code}`);
    const text = JSON.stringify(res.body);
    expect(text).not.toContain('הרצל');
    expect(text).not.toContain('050-1234567');
    expect(text).not.toContain('פרטי');
  });

  it('מייל שגוי או קוד שגוי => 404 זהה (מניעת גישה להזמנות של אחרות)', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }]);
    const wrongEmail = await api().post('/api/orders/track').send({ code: o.code, email: 'other@example.com' });
    const wrongCode = await api().post('/api/orders/track').send({ code: 'TK-ZZZZZZ', email: 'dana@example.com' });
    expect(wrongEmail.status).toBe(404);
    expect(wrongCode.status).toBe(404);
    expect(wrongEmail.body).toEqual(wrongCode.body);
  });

  it('פורמט קוד שגוי => 400', async () => {
    expect((await api().post('/api/orders/track').send({ code: 'hello', email: 'a@b.co' })).status).toBe(400);
  });

  it('הזמנה שלא שולמה: אין קישורי הורדה, canPay=true', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }]);
    const res = await api().post('/api/orders/track').send({ code: o.code, email: 'dana@example.com' });
    expect(res.body.items[0].download).toBeNull();
    expect(res.body.canPay).toBe(true);
  });
});

describe('ניהול הזמנות – הרשאות', () => {
  it('אורחת לא רואה/לא מנהלת הזמנות (401)', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }]);
    const id = await orderId(o.code);
    expect((await api().get('/api/admin/orders')).status).toBe(401);
    expect((await api().get(`/api/admin/orders/${id}`)).status).toBe(401);
    expect((await api().patch(`/api/admin/orders/${id}/ship`)).status).toBe(401);
    expect((await api().patch(`/api/admin/orders/${id}/refund`)).status).toBe(401);
  });

  it('מנהלת רואה, מסננת ומחפשת הזמנות', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }], { customerName: 'שם ייחודי לחיפוש' });
    const list = await api().get('/api/admin/orders?status=PENDING&q=ייחודי').set(auth(token));
    expect(list.status).toBe(200);
    expect(list.body.items.some((x: { code: string }) => x.code === o.code)).toBe(true);
    expect((await api().get(`/api/admin/orders?q=${o.code}`).set(auth(token))).body.total).toBe(1);
  });
});

describe('תשלום (דמה) והורדות', () => {
  it('הורדה לפני תשלום אסורה (אין Token בכלל)', async () => {
    expect((await api().get(`/api/downloads/${'a'.repeat(64)}`)).status).toBe(404);
    expect((await api().get('/api/downloads/short')).status).toBe(400);
  });

  it('תשלום הזמנה דיגיטלית: נוצר קישור ל-3 ימים, ההורדה עובדת, סטטוס DELIVERED, נשלחים מיילים ללקוחה ולמנהלת', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }]);
    const id = await orderId(o.code);

    const paid = await pay(o.code);
    expect(paid.status, JSON.stringify(paid.body)).toBe(200);
    expect(paid.body.status).toBe('DELIVERED');
    expect(paid.body.canPay).toBe(false);
    const dl = paid.body.items[0].download as { url: string; expiresAt: string };
    expect(dl.url).toContain('/api/downloads/');
    const days = (new Date(dl.expiresAt).getTime() - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(2.9);
    expect(days).toBeLessThanOrEqual(3.01);
    expect((await prisma.emailLog.findMany({ where: { orderId: id } })).map((l) => l.type).sort()).toEqual(['ADMIN_ORDER_PAID', 'ORDER_PAID']);

    const file = await api().get(new URL(dl.url).pathname);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toContain('application/pdf');
    expect(file.headers['content-disposition']).toContain('digi.pdf');

    const tracked = await api().post('/api/orders/track').send({ code: o.code, email: 'dana@example.com' });
    expect(tracked.body.items[0].download.url).toBe(dl.url);
    expect(tracked.body.items[0].download.downloadsLeft).toBe(9);
    const admin = await api().get(`/api/admin/orders/${id}`).set(auth(token));
    expect(admin.body.paymentRef).toMatch(/^DEMO-/);
    expect(admin.body.paidAt).toBeTruthy();
  });

  it('תשלום הזמנה עם מוצר פיזי: סטטוס PAID, צפי הגעה 7 ימי עסקים (בלי שישי/שבת)', async () => {
    const o = await placeOrder([{ productId: physical.id, quantity: 2 }, { productId: digital.id, quantity: 1 }], { shippingAddress: address });
    const paid = await pay(o.code);
    expect(paid.body.status).toBe('PAID');
    const eta = new Date(paid.body.estimatedDeliveryAt as string);
    expect([5, 6]).not.toContain(eta.getUTCDay());
    const diffDays = (eta.getTime() - Date.now()) / 86400000;
    expect(diffDays).toBeGreaterThanOrEqual(7);
    expect(diffDays).toBeLessThanOrEqual(10.1);
    expect(paid.body.items.find((i: { kind: string }) => i.kind === 'PHYSICAL').download).toBeNull();
    expect(paid.body.items.find((i: { kind: string }) => i.kind === 'DIGITAL').download).not.toBeNull();
  });

  it('תשלום עם מייל שגוי => 404; כשל בתשלום => 400 וההזמנה נשארת PENDING', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }]);
    expect((await pay(o.code, 'other@example.com')).status).toBe(404);
    const failed = await api().post('/api/orders/pay-demo').send({ code: o.code, email: 'dana@example.com', outcome: 'fail' });
    expect(failed.status).toBe(400);
    expect(failed.body.error.code).toBe('PAYMENT_FAILED');
    expect((await prisma.order.findUniqueOrThrow({ where: { code: o.code } })).status).toBe('PENDING');
    expect(await prisma.emailLog.findMany()).toHaveLength(0);
    expect((await pay(o.code)).status).toBe(200); // ניסיון חוזר מצליח
  });

  it('תשלום כפול לא יוצר קישורים/מיילים כפולים (idempotent)', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }]);
    const id = await orderId(o.code);
    await Promise.all([pay(o.code), pay(o.code)]);
    await pay(o.code);
    expect(await prisma.downloadGrant.count({ where: { orderItem: { orderId: id } } })).toBe(1);
    expect(await prisma.emailLog.count({ where: { orderId: id, type: 'ORDER_PAID' } })).toBe(1);
  });

  it('קישור שפג תוקפו => 410, אחרי הארכה עובד שוב', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }]);
    const id = await orderId(o.code);
    const paid = await pay(o.code);
    const path = new URL(paid.body.items[0].download.url).pathname;

    await prisma.downloadGrant.updateMany({ where: { orderItem: { orderId: id } }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const expired = await api().get(path);
    expect(expired.status).toBe(410);
    expect(expired.body.error.code).toBe('DOWNLOAD_EXPIRED');

    const ext = await api().post(`/api/admin/orders/${id}/extend-download`).set(auth(token));
    expect(ext.status).toBe(200);
    expect((await api().get(path)).status).toBe(200);
  });

  it('מכסת הורדות => 403', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }]);
    const id = await orderId(o.code);
    const paid = await pay(o.code);
    const path = new URL(paid.body.items[0].download.url).pathname;
    await prisma.downloadGrant.updateMany({ where: { orderItem: { orderId: id } }, data: { downloadCount: 10 } });
    const res = await api().get(path);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('DOWNLOAD_LIMIT_REACHED');
  });

  it('החזר כספי מבטל את הקישורים (403) ושולח מייל', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }, { productId: physical.id, quantity: 1 }], { shippingAddress: address });
    const id = await orderId(o.code);
    const paid = await pay(o.code);
    const path = new URL(paid.body.items.find((i: { kind: string }) => i.kind === 'DIGITAL').download.url).pathname;
    expect((await api().patch(`/api/admin/orders/${id}/refund`).set(auth(token)).send({ reason: 'הספק לא יכול לספק' })).body.status).toBe('REFUNDED');
    const res = await api().get(path);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('DOWNLOAD_REVOKED');
    expect((await prisma.emailLog.findMany({ where: { orderId: id } })).map((l) => l.type)).toContain('ORDER_REFUNDED');
    const tracked = await api().post('/api/orders/track').send({ code: o.code, email: 'dana@example.com' });
    expect(tracked.body.statusNote).toBe('הספק לא יכול לספק');
    expect((await pay(o.code)).status).toBe(409); // הזמנה שהוחזרה אי אפשר "לשלם" שוב
    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).status).toBe('REFUNDED');
  });

  it('החזר על הזמנה שלא שולמה נחסם (409); ביטול הזמנה שלא שולמה מותר ואז אי אפשר לשלם', async () => {
    const o = await placeOrder([{ productId: digital.id, quantity: 1 }]);
    const id = await orderId(o.code);
    expect((await api().patch(`/api/admin/orders/${id}/refund`).set(auth(token))).status).toBe(409);
    const cancelled = await api().patch(`/api/admin/orders/${id}/cancel`).set(auth(token)).send({ reason: 'בטעות' });
    expect(cancelled.body.status).toBe('CANCELLED');
    const late = await pay(o.code);
    expect(late.status).toBe(409);
    expect(late.body.error.code).toBe('INVALID_STATUS');
    expect((await api().patch(`/api/admin/orders/${id}/cancel`).set(auth(token))).status).toBe(409); // ביטול כפול
  });

  it('משלוח: PAID → ORDERED → SHIPPED (+מספר מעקב) → DELIVERED; מעברים לא חוקיים נחסמים', async () => {
    const o = await placeOrder([{ productId: physical.id, quantity: 1 }], { shippingAddress: address });
    const id = await orderId(o.code);
    expect((await api().patch(`/api/admin/orders/${id}/ship`).set(auth(token))).status).toBe(409); // עוד לא שולמה
    expect((await api().patch(`/api/admin/orders/${id}/mark-ordered`).set(auth(token))).status).toBe(409);
    await pay(o.code);
    expect((await api().patch(`/api/admin/orders/${id}/deliver`).set(auth(token))).status).toBe(409); // לא נשלחה
    const ordered = await api().patch(`/api/admin/orders/${id}/mark-ordered`).set(auth(token));
    expect(ordered.body.status).toBe('ORDERED');
    expect(ordered.body.orderedAt).toBeTruthy();
    expect((await api().patch(`/api/admin/orders/${id}/mark-ordered`).set(auth(token))).status).toBe(409);
    const shipped = await api().patch(`/api/admin/orders/${id}/ship`).set(auth(token)).send({ trackingNumber: ' RR123456789IL ' });
    expect(shipped.body.status).toBe('SHIPPED');
    expect(shipped.body.trackingNumber).toBe('RR123456789IL');
    const tracked = await api().post('/api/orders/track').send({ code: o.code, email: 'dana@example.com' });
    expect(tracked.body.trackingNumber).toBe('RR123456789IL');
    expect((await api().patch(`/api/admin/orders/${id}/deliver`).set(auth(token))).body.status).toBe('DELIVERED');
    expect((await prisma.emailLog.findMany({ where: { orderId: id } })).map((l) => l.type)).toContain('ORDER_SHIPPED');
  });

  it('אפשר לשלוח ישר מ-PAID (בלי "הוזמנה מהספק")', async () => {
    const o = await placeOrder([{ productId: physical.id, quantity: 1 }], { shippingAddress: address });
    const id = await orderId(o.code);
    await pay(o.code);
    expect((await api().patch(`/api/admin/orders/${id}/ship`).set(auth(token))).body.status).toBe('SHIPPED');
  });

  it('איחור במשלוח: deliveryLate=true אחרי צפי ההגעה', async () => {
    const o = await placeOrder([{ productId: physical.id, quantity: 1 }], { shippingAddress: address });
    const id = await orderId(o.code);
    await pay(o.code);
    const before = await api().post('/api/orders/track').send({ code: o.code, email: 'dana@example.com' });
    expect(before.body.deliveryLate).toBe(false);
    await prisma.order.update({ where: { id }, data: { estimatedDeliveryAt: new Date(Date.now() - 86400000) } });
    const after = await api().post('/api/orders/track').send({ code: o.code, email: 'dana@example.com' });
    expect(after.body.deliveryLate).toBe(true);
  });

  it('הלוח של המנהלת סופר הזמנות ששולמו וממתינות לטיפול', async () => {
    const before = (await api().get('/api/admin/stats').set(auth(token))).body.pendingOrders as number;
    const o = await placeOrder([{ productId: physical.id, quantity: 1 }], { shippingAddress: address });
    expect((await api().get('/api/admin/stats').set(auth(token))).body.pendingOrders).toBe(before); // לא שולמה – לא נספרת
    await pay(o.code);
    expect((await api().get('/api/admin/stats').set(auth(token))).body.pendingOrders).toBe(before + 1);
  });

  it('רשימת לקוחות לפי הזמנות', async () => {
    const res = await api().get('/api/admin/customers').set(auth(token));
    expect(res.status).toBe(200);
    const dana = res.body.items.find((c: { email: string }) => c.email === 'dana@example.com');
    expect(dana.ordersCount).toBeGreaterThan(3);
  });
});

describe('טופס פנייה', () => {
  it('פנייה תקינה נשמרת, נשלחים מיילים, והמנהלת רואה ומעדכנת', async () => {
    const res = await api().post('/api/contact').send({ name: 'דנה', email: 'dana@example.com', subject: 'החבילה לא הגיעה', message: 'עברו 7 ימי עסקים', orderCode: 'tk-abc234' });
    expect(res.status).toBe(201);
    const logs = (await prisma.emailLog.findMany()).map((l) => l.type);
    expect(logs).toEqual(expect.arrayContaining(['ADMIN_NEW_CONTACT', 'CONTACT_ACK']));

    const list = await api().get('/api/admin/contact-messages?status=NEW').set(auth(token));
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].orderCode).toBe('TK-ABC234');
    const id = list.body.items[0].id as string;
    expect((await api().patch(`/api/admin/contact-messages/${id}`).set(auth(token)).send({ status: 'HANDLED' })).body.status).toBe('HANDLED');
    expect((await api().delete(`/api/admin/contact-messages/${id}`).set(auth(token))).status).toBe(204);
  });

  it('ולידציה: הודעה קצרה / מייל שגוי => 400; בלי Token לא רואים פניות', async () => {
    expect((await api().post('/api/contact').send({ name: 'ד', email: 'bad', subject: 'x', message: 'y' })).status).toBe(400);
    expect((await api().get('/api/admin/contact-messages')).status).toBe(401);
  });
});
