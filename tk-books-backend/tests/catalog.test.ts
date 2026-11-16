import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { samplePdf } from '../src/seed/placeholders';
import { saveFile } from '../src/services/storageService';
import { adminToken, api, auth, makeBook, makeProduct, pngBuffer, resetDb } from './helpers';

let token: string;
let book1Id: string;

beforeAll(async () => {
  await resetDb();
  token = await adminToken();
  const b1 = await makeBook('book-1');
  book1Id = b1.id;
  await makeBook('book-2');
  await makeBook('hidden-book', { isActive: false });

  const mk = async (type: 'SONG' | 'TEST' | 'REVIEW_SHEET', n: number, extra: Record<string, unknown> = {}) => {
    const fileKey = `materials/${type}-${n}.pdf`;
    await saveFile('private', fileKey, samplePdf(`${type} ${n}`), 'application/pdf');
    return prisma.material.create({ data: { bookId: b1.id, type, titleHe: `חומר ${type} ${n}`, titleEn: `${type} ${n} Apples`, unit: n, sortOrder: n, fileKey, ...extra } });
  };
  await mk('SONG', 1);
  await mk('SONG', 2);
  await mk('TEST', 1, { titleEn: 'Final Test Bananas' });
  await mk('REVIEW_SHEET', 1);
  await mk('TEST', 2, { isActive: false });

  await prisma.faq.create({ data: { bookId: null, questionHe: 'כללית?', questionEn: 'General question', answerHe: 'כן', answerEn: 'Yes' } });
  await prisma.faq.create({ data: { bookId: b1.id, questionHe: 'של ספר?', questionEn: 'Book question', answerHe: 'כן', answerEn: 'Yes' } });

  await makeProduct({ slug: 'cards-1', kind: 'DIGITAL', price: 2500, category: 'FLASHCARDS', bookId: b1.id, nameEn: 'Zebra Cards' });
  await makeProduct({ slug: 'stickers-1', kind: 'PHYSICAL', price: 1500, category: 'STICKERS', nameEn: 'Alpha Stickers' });
  await makeProduct({ slug: 'secret', kind: 'PHYSICAL', isActive: false });
});

describe('ציבורי: ספרים', () => {
  it('רשימת ספרים מחזירה רק פעילים, ממוינים', async () => {
    const res = await api().get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.items.map((b: { slug: string }) => b.slug)).toEqual(['book-1', 'book-2']);
  });

  it('ספר בודד כולל ספירות חומרים, וספר מוסתר => 404', async () => {
    const res = await api().get('/api/books/book-1');
    expect(res.status).toBe(200);
    expect(res.body.materialCounts).toEqual({ SONG: 2, TEST: 1, REVIEW_SHEET: 1, TEACHER_GUIDE: 0 }); // מבחן לא פעיל לא נספר
    expect(res.body.faqCount).toBe(1);
    expect(res.body.productCount).toBe(1);
    expect((await api().get('/api/books/hidden-book')).status).toBe(404);
    expect((await api().get('/api/books/nope')).status).toBe(404);
  });

  it('ספר לא חושף שדות פנימיים', async () => {
    const res = await api().get('/api/books/book-1');
    expect(res.body).not.toHaveProperty('isActive');
    expect(res.body).not.toHaveProperty('coverImageKey');
  });
});

describe('ציבורי: חומרי למידה', () => {
  it('סינון לפי סוג', async () => {
    const res = await api().get('/api/books/book-1/materials?type=SONG');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items.every((m: { type: string }) => m.type === 'SONG')).toBe(true);
  });

  it('חיפוש חופשי (לא תלוי רישיות)', async () => {
    const res = await api().get('/api/books/book-1/materials?q=banana');
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].type).toBe('TEST');
  });

  it('מיון לפי שם', async () => {
    const res = await api().get('/api/books/book-1/materials?sort=title');
    const titles = res.body.items.map((m: { titleEn: string }) => m.titleEn);
    expect(titles).toEqual([...titles].sort());
  });

  it('לא מציג חומר לא פעיל ולא חושף fileKey', async () => {
    const res = await api().get('/api/books/book-1/materials?type=TEST');
    expect(res.body.total).toBe(1);
    expect(res.body.items[0]).not.toHaveProperty('fileKey');
    expect(res.body.items[0].hasFile).toBe(true);
  });

  it('סוג לא חוקי => 400', async () => {
    expect((await api().get('/api/books/book-1/materials?type=BOOK')).status).toBe(400);
  });

  it('הורדת חומר חינמי עובדת ומחזירה PDF', async () => {
    const list = await api().get('/api/books/book-1/materials?type=SONG');
    const res = await api().get(`/api/materials/${list.body.items[0].id}/download`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
  });
});

describe('ציבורי: שאלות נפוצות', () => {
  it('כל השאלות / כלליות בלבד / של ספר / ספר + כלליות', async () => {
    expect((await api().get('/api/faqs')).body.items).toHaveLength(2);
    expect((await api().get('/api/faqs?scope=general')).body.items).toHaveLength(1);
    expect((await api().get('/api/faqs?bookSlug=book-1')).body.items).toHaveLength(1);
    expect((await api().get('/api/faqs?bookSlug=book-1&includeGeneral=true')).body.items).toHaveLength(2);
    expect((await api().get('/api/faqs?q=general')).body.items).toHaveLength(1);
  });
});

describe('ציבורי: מוצרים', () => {
  it('מציג רק פעילים ולא חושף קובץ הורדה', async () => {
    const res = await api().get('/api/products');
    expect(res.body.total).toBe(2);
    expect(JSON.stringify(res.body)).not.toContain('digitalFileKey');
    expect(res.body.items.find((p: { slug: string }) => p.slug === 'secret')).toBeUndefined();
  });

  it('סינון לפי kind/category/book, חיפוש ומיון', async () => {
    expect((await api().get('/api/products?kind=PHYSICAL')).body.total).toBe(1);
    expect((await api().get('/api/products?category=SONGBOOK')).status).toBe(200); // שירון הוא קטגוריית מוצר
    expect((await api().get('/api/products?category=FLASHCARDS')).body.items[0].slug).toBe('cards-1');
    expect((await api().get('/api/products?bookSlug=book-1')).body.total).toBe(1);
    expect((await api().get('/api/products?q=zebra')).body.total).toBe(1);
    const asc = await api().get('/api/products?sort=price_asc');
    expect(asc.body.items.map((p: { priceAgorot: number }) => p.priceAgorot)).toEqual([1500, 2500]);
    const desc = await api().get('/api/products?sort=price_desc');
    expect(desc.body.items[0].priceAgorot).toBe(2500);
  });

  it('מוצר בודד / מוסתר / לא קיים', async () => {
    expect((await api().get('/api/products/cards-1')).status).toBe(200);
    expect((await api().get('/api/products/secret')).status).toBe(404);
    expect((await api().get('/api/products/zzz')).status).toBe(404);
  });
});

describe('קורא הספר – צפייה בלבד', () => {
  it('מוגש עמוד כתמונה בלי מטמון, ועמוד לא קיים => 404', async () => {
    const png = await pngBuffer();
    const up = await api().post(`/api/admin/books/${book1Id}/pages`).set(auth(token)).attach('pages', png, { filename: 'p1.png', contentType: 'image/png' }).attach('pages', png, { filename: 'p2.png', contentType: 'image/png' });
    expect(up.status).toBe(201);
    expect(up.body.pageNumbers).toEqual([1, 2]);

    const page = await api().get('/api/books/book-1/pages/1');
    expect(page.status).toBe(200);
    expect(page.headers['content-type']).toBe('image/webp');
    expect(page.headers['cache-control']).toContain('no-store');
    expect((await api().get('/api/books/book-1/pages/99')).status).toBe(404);
    expect((await api().get('/api/books/book-1/pages/abc')).status).toBe(400);
    expect((await api().get('/api/books/book-1')).body.pageCount).toBe(2);
  });

  it('אין נתיב להורדת קובץ הספר המלא', async () => {
    for (const p of ['/api/books/book-1/download', '/api/books/book-1/pdf', '/api/books/book-1/file']) {
      expect((await api().get(p)).status, p).toBe(404);
    }
  });

  it('החלפת עמודים (replace=true) ומחיקת עמוד', async () => {
    const png = await pngBuffer();
    const res = await api().post(`/api/admin/books/${book1Id}/pages`).set(auth(token)).field('replace', 'true').attach('pages', png, { filename: 'x.png', contentType: 'image/png' });
    expect(res.body.pageNumbers).toEqual([1]);
    expect((await api().delete(`/api/admin/books/${book1Id}/pages/1`).set(auth(token))).status).toBe(204);
    expect((await api().get('/api/books/book-1/pages/1')).status).toBe(404);
  });

  it('העלאת עמוד שאינו תמונה נדחית', async () => {
    const res = await api().post(`/api/admin/books/${book1Id}/pages`).set(auth(token)).attach('pages', samplePdf('x'), { filename: 'a.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });
});

describe('ניהול (CRUD) – ספרים', () => {
  it('אורחת לא יכולה (401) – הוספה/עריכה/מחיקה', async () => {
    expect((await api().post('/api/admin/books').send({ titleHe: 'א', titleEn: 'A' })).status).toBe(401);
    expect((await api().put(`/api/admin/books/${book1Id}`).send({ titleEn: 'X' })).status).toBe(401);
    expect((await api().delete(`/api/admin/books/${book1Id}`)).status).toBe(401);
  });

  it('יצירה, עריכה, מחיקה + slug אוטומטי + כפילות', async () => {
    const created = await api().post('/api/admin/books').set(auth(token)).send({ titleHe: 'ספר חדש', titleEn: 'Brand New Book' });
    expect(created.status).toBe(201);
    expect(created.body.slug).toBe('brand-new-book');
    const dup = await api().post('/api/admin/books').set(auth(token)).send({ titleHe: 'ספר חדש', titleEn: 'Brand New Book' });
    expect(dup.status).toBe(409);
    const upd = await api().put(`/api/admin/books/${created.body.id}`).set(auth(token)).send({ titleEn: 'Renamed', isActive: false });
    expect(upd.body.titleEn).toBe('Renamed');
    expect((await api().get('/api/books/brand-new-book')).status).toBe(404); // הוסתר
    expect((await api().delete(`/api/admin/books/${created.body.id}`).set(auth(token))).status).toBe(204);
    expect((await api().get(`/api/admin/books/${created.body.id}`).set(auth(token))).status).toBe(404);
  });

  it('ולידציה: חסרים שדות / slug לא תקין / uuid לא תקין', async () => {
    expect((await api().post('/api/admin/books').set(auth(token)).send({ titleHe: 'x' })).status).toBe(400);
    expect((await api().post('/api/admin/books').set(auth(token)).send({ titleHe: 'x', titleEn: 'y', slug: 'Bad Slug!' })).status).toBe(400);
    expect((await api().get('/api/admin/books/not-a-uuid').set(auth(token))).status).toBe(400);
  });

  it('מחיקת ספר מוחקת חומרים ושאלות, אבל לא מוצרים', async () => {
    const b = await makeBook('to-delete');
    await prisma.material.create({ data: { bookId: b.id, type: 'TEST', titleHe: 'א', titleEn: 'a' } });
    await prisma.faq.create({ data: { bookId: b.id, questionHe: 'א', questionEn: 'a', answerHe: 'א', answerEn: 'a' } });
    const p = await makeProduct({ slug: 'keeps-living', kind: 'PHYSICAL', bookId: b.id });
    await api().delete(`/api/admin/books/${b.id}`).set(auth(token));
    expect(await prisma.material.count({ where: { bookId: b.id } })).toBe(0);
    expect(await prisma.faq.count({ where: { bookId: b.id } })).toBe(0);
    expect((await prisma.product.findUnique({ where: { id: p.id } }))?.bookId).toBeNull();
  });
});

describe('ניהול (CRUD) – חומרים ושאלות', () => {
  it('מחזור חיים של חומר', async () => {
    const created = await api().post('/api/admin/materials').set(auth(token)).send({ bookId: book1Id, type: 'SONG', titleHe: 'שיר חדש', titleEn: 'New Song', unit: 3, mediaUrl: 'https://www.youtube.com/watch?v=abc' });
    expect(created.status).toBe(201);
    const id = created.body.id as string;
    expect((await api().put(`/api/admin/materials/${id}`).set(auth(token)).send({ titleEn: 'Edited' })).body.titleEn).toBe('Edited');
    expect((await api().get('/api/books/book-1/materials?q=Edited')).body.total).toBe(1);
    expect((await api().delete(`/api/admin/materials/${id}`).set(auth(token))).status).toBe(204);
    expect((await api().delete(`/api/admin/materials/${id}`).set(auth(token))).status).toBe(404);
  });

  it('מדריך למורה הוא חומר חינמי להורדה (לא מוצר בתשלום)', async () => {
    const created = await api().post('/api/admin/materials').set(auth(token)).send({ bookId: book1Id, type: 'TEACHER_GUIDE', titleHe: 'מדריך למורה', titleEn: 'Teacher Guide' });
    expect(created.status).toBe(201);
    expect((await api().get('/api/books/book-1/materials?type=TEACHER_GUIDE')).body.total).toBe(1);
    expect((await api().get('/api/products?category=TEACHER_GUIDE')).status).toBe(400); // אין יותר קטגוריית מוצר כזו
    await api().delete(`/api/admin/materials/${created.body.id}`).set(auth(token));
  });

  it('ולידציה: סוג שגוי, ספר שלא קיים, mediaUrl לא תקין', async () => {
    const base = { bookId: book1Id, titleHe: 'א', titleEn: 'a' };
    expect((await api().post('/api/admin/materials').set(auth(token)).send({ ...base, type: 'VIDEO' })).status).toBe(400);
    expect((await api().post('/api/admin/materials').set(auth(token)).send({ ...base, type: 'TEST', mediaUrl: 'nope' })).status).toBe(400);
    expect((await api().post('/api/admin/materials').set(auth(token)).send({ ...base, type: 'TEST', bookId: '3b241101-e2bb-4255-8caf-4136c566a962' })).status).toBe(404);
  });

  it('מחזור חיים של שאלה נפוצה (כללית ושל ספר)', async () => {
    const g = await api().post('/api/admin/faqs').set(auth(token)).send({ questionHe: 'ש', questionEn: 'Q', answerHe: 'ת', answerEn: 'A' });
    expect(g.status).toBe(201);
    expect(g.body.bookId).toBeNull();
    expect((await api().put(`/api/admin/faqs/${g.body.id}`).set(auth(token)).send({ answerEn: 'Updated' })).body.answerEn).toBe('Updated');
    expect((await api().delete(`/api/admin/faqs/${g.body.id}`).set(auth(token))).status).toBe(204);
  });
});

describe('ניהול (CRUD) – מוצרים והעלאות', () => {
  it('העלאת תמונה ציבורית ושימוש בה כתמונת מוצר', async () => {
    const png = await pngBuffer();
    const up = await api().post('/api/admin/uploads').set(auth(token)).field('area', 'public').field('folder', 'products').attach('file', png, { filename: 'a.png', contentType: 'image/png' });
    expect(up.status).toBe(201);
    expect(up.body.url).toContain('/files/products/');
    const img = await api().get(new URL(up.body.url).pathname);
    expect(img.status).toBe(200);

    const created = await api().post('/api/admin/products').set(auth(token)).send({ kind: 'PHYSICAL', category: 'STAMPS', nameHe: 'חותמת', nameEn: 'Stamp', priceAgorot: 900, images: [{ key: up.body.key, altHe: 'חותמת', altEn: 'stamp' }] });
    expect(created.status).toBe(201);
    expect(created.body.images[0].url).toBe(up.body.url);
  });

  it('קובץ פרטי לא מגיע מ-/files, ולא ניתן להעלות PDF לאזור ציבורי', async () => {
    const pdf = samplePdf('secret');
    const bad = await api().post('/api/admin/uploads').set(auth(token)).field('area', 'public').attach('file', pdf, { filename: 'a.pdf', contentType: 'application/pdf' });
    expect(bad.status).toBe(400);
    const ok = await api().post('/api/admin/uploads').set(auth(token)).field('area', 'private').field('folder', 'files').attach('file', pdf, { filename: 'a.pdf', contentType: 'application/pdf' });
    expect(ok.status).toBe(201);
    expect(ok.body.url).toBeNull();
    expect((await api().get(`/files/${ok.body.key}`)).status).toBe(404);
    expect((await api().get('/files/../files/x')).status).not.toBe(200);
  });

  it('העלאה בלי Token / סוג לא נתמך', async () => {
    const png = await pngBuffer();
    expect((await api().post('/api/admin/uploads').attach('file', png, { filename: 'a.png', contentType: 'image/png' })).status).toBe(401);
    const exe = await api().post('/api/admin/uploads').set(auth(token)).attach('file', Buffer.from('MZ'), { filename: 'a.exe', contentType: 'application/x-msdownload' });
    expect(exe.status).toBe(400);
  });

  it('מוצר דיגיטלי חייב קובץ, מחיר לא שלילי', async () => {
    const noFile = await api().post('/api/admin/products').set(auth(token)).send({ kind: 'DIGITAL', nameHe: 'א', nameEn: 'a', priceAgorot: 100 });
    expect(noFile.status).toBe(400);
    const neg = await api().post('/api/admin/products').set(auth(token)).send({ kind: 'PHYSICAL', nameHe: 'א', nameEn: 'a', priceAgorot: -5 });
    expect(neg.status).toBe(400);
  });

  it('עריכה, הסתרה ומחיקה; מוצר שהוזמן לא נמחק (409)', async () => {
    const p = await makeProduct({ slug: 'to-edit', kind: 'PHYSICAL', price: 1000 });
    const upd = await api().put(`/api/admin/products/${p.id}`).set(auth(token)).send({ priceAgorot: 1234, isActive: false });
    expect(upd.body.priceAgorot).toBe(1234);
    expect((await api().get('/api/products/to-edit')).status).toBe(404);

    const order = await prisma.order.create({ data: { code: 'TK-AAAAAA', customerName: 'x', customerEmail: 'x@x.com', totalAgorot: 1234, items: { create: [{ productId: p.id, quantity: 1, unitPriceAgorot: 1234, productNameHe: 'א', productNameEn: 'a' }] } } });
    expect(order.id).toBeTruthy();
    const del = await api().delete(`/api/admin/products/${p.id}`).set(auth(token));
    expect(del.status).toBe(409);
    expect(del.body.error.code).toBe('PRODUCT_IN_USE');

    const free = await makeProduct({ slug: 'free-to-delete', kind: 'PHYSICAL' });
    expect((await api().delete(`/api/admin/products/${free.id}`).set(auth(token))).status).toBe(204);
  });

  it('שינוי מדיגיטלי לפיזי מנקה את קובץ ההורדה', async () => {
    const p = await makeProduct({ slug: 'switch-kind', kind: 'DIGITAL' });
    const res = await api().put(`/api/admin/products/${p.id}`).set(auth(token)).send({ kind: 'PHYSICAL' });
    expect(res.status).toBe(200);
    expect(res.body.digitalFileKey).toBeNull();
  });

  it('רשימות ניהול כוללות פריטים מוסתרים ו-stats/customers עובדים', async () => {
    expect((await api().get('/api/admin/products').set(auth(token))).body.items.some((p: { isActive: boolean }) => !p.isActive)).toBe(true);
    expect((await api().get('/api/admin/stats').set(auth(token))).body).toHaveProperty('pendingOrders');
    expect((await api().get('/api/admin/customers').set(auth(token))).status).toBe(200);
  });
});
