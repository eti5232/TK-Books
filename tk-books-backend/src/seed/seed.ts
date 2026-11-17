import bcrypt from 'bcryptjs';
import type { MaterialType, ProductCategory, ProductKind } from '@prisma/client';
import { env } from '../config/env';
import { addBusinessDays, addDays } from '../utils/business-days';
import { generateDownloadToken } from '../utils/order-code';
import { prisma } from '../db/prisma';
import { ensureBuckets, saveFile } from '../services/storage.service';
import { placeholderPageWebp, placeholderPng, samplePdf } from './placeholders';

const PAGES_PER_BOOK = 6;

async function seedAdmin(): Promise<void> {
  const email = (env.ADMIN_EMAIL ?? (env.isProd ? undefined : 'admin@tkbooks.test'))?.toLowerCase();
  const password = env.ADMIN_PASSWORD ?? (env.isProd ? undefined : 'Admin123!');
  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD לא הוגדרו – לא נוצר חשבון מנהלת (בייצור חובה להגדיר).');
    return;
  }
  if (env.isProd && password.length < 10) {
    console.warn('⚠️  סיסמת המנהלת קצרה מדי (מינימום 10 תווים) – לא נוצר חשבון.');
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name: env.ADMIN_NAME },
    create: { email, passwordHash, name: env.ADMIN_NAME },
  });
  console.log(`👩‍💼 מנהלת: ${email}${env.isProd ? '' : '  (סיסמת פיתוח – ראי README)'}`);
}

async function seedDemo(): Promise<void> {
  if (await prisma.book.findUnique({ where: { slug: 'book-1' } })) {
    console.log('ℹ️  נתוני הדגמה כבר קיימים – מדלגת.');
    return;
  }
  console.log('🌱 יוצרת נתוני הדגמה (תבנית – להחליף בתוכן אמיתי)...');

  /* ספרים + כריכות + עמודים */
  const bookNames = [
    { slug: 'book-1', he: 'ספר ראשון', en: 'Book One', bg: '#ffd1e6' },
    { slug: 'book-2', he: 'ספר שני', en: 'Book Two', bg: '#cdeeff' },
    { slug: 'book-3', he: 'ספר שלישי', en: 'Book Three', bg: '#ffe0f0' },
  ];
  const books = [];
  for (const [i, b] of bookNames.entries()) {
    const coverKey = `covers/${b.slug}.png`;
    await saveFile('public', coverKey, await placeholderPng({ width: 600, height: 800, title: b.en, subtitle: 'DEMO cover', bg: b.bg }), 'image/png');
    const book = await prisma.book.create({
      data: {
        slug: b.slug,
        titleHe: b.he,
        titleEn: b.en,
        descriptionHe: `זהו ${b.he} – תיאור לדוגמה. יוחלף בתיאור האמיתי של הספר.`,
        descriptionEn: `${b.en} – sample description. Replace with the real book description.`,
        coverImageKey: coverKey,
        sortOrder: i + 1,
      },
    });
    for (let p = 1; p <= PAGES_PER_BOOK; p += 1) {
      const key = `books/${b.slug}/page-${p}-demo.webp`;
      await saveFile('private', key, await placeholderPageWebp(b.en, p, PAGES_PER_BOOK), 'image/webp');
      await prisma.bookPage.create({ data: { bookId: book.id, pageNumber: p, storageKey: key } });
    }
    books.push(book);
  }

  /* חומרי למידה */
  const kinds: { type: MaterialType; he: string; en: string; count: number }[] = [
    { type: 'SONG', he: 'שיר', en: 'Song', count: 3 },
    { type: 'TEST', he: 'מבחן', en: 'Test', count: 2 },
    { type: 'REVIEW_SHEET', he: 'דף חזרה', en: 'Review Sheet', count: 2 },
    { type: 'TEACHER_GUIDE', he: 'מדריך למורה', en: 'Teacher Guide', count: 1 }, // חינמי להורדה
  ];
  for (const book of books) {
    for (const k of kinds) {
      for (let n = 1; n <= k.count; n += 1) {
        const fileKey = `materials/${book.slug}/${k.type.toLowerCase()}-${n}.pdf`;
        await saveFile('private', fileKey, samplePdf(`${book.titleEn} - ${k.en} ${n}`), 'application/pdf');
        await prisma.material.create({
          data: {
            bookId: book.id,
            type: k.type,
            titleHe: `${k.he} ${n} – ${book.titleHe}`,
            titleEn: `${k.en} ${n} - ${book.titleEn}`,
            descriptionHe: `${k.he} לדוגמה ליחידה ${n}`,
            descriptionEn: `Sample ${k.en.toLowerCase()} for unit ${n}`,
            unit: n,
            sortOrder: n,
            fileKey,
            lyricsHe: k.type === 'SONG' ? 'מילות שיר לדוגמה...' : null,
            lyricsEn: k.type === 'SONG' ? 'Sample song lyrics...\nHello, hello, how are you?' : null,
          },
        });
      }
    }
    for (let n = 1; n <= 3; n += 1) {
      await prisma.faq.create({
        data: {
          bookId: book.id,
          questionHe: `שאלה לדוגמה ${n} על ${book.titleHe}`,
          questionEn: `Sample question ${n} about ${book.titleEn}`,
          answerHe: 'תשובה לדוגמה. תוחלף בתשובה האמיתית.',
          answerEn: 'Sample answer. Replace with the real answer.',
          sortOrder: n,
        },
      });
    }
  }

  /* שאלות כלליות */
  const general = [
    ['איך אפשר לקרוא את הספר?', 'How can I read the book?', 'הספרים זמינים לצפייה באתר בלבד, ללא אפשרות הורדה.', 'Books are view-only on the site and cannot be downloaded.'],
    ['איך מזמינים מוצר?', 'How do I order a product?', 'מוסיפים לעגלה, ממלאים פרטים ומשלמים. מיד אחרי התשלום תקבלי מייל עם אישור (וקישור הורדה למוצרים דיגיטליים).', 'Add items to the cart, fill in your details and pay. Right after payment you will get a confirmation email (and a download link for digital products).'],
    ['כמה זמן ניתן להוריד מוצר דיגיטלי?', 'How long can I download a digital product?', 'ניתן להוריד ל-3 ימים בלבד אחרי התשלום.', 'Downloads are available for 3 days only after payment.'],
    ['מתי החבילה מגיעה?', 'When will my package arrive?', 'צפי ההגעה הוא עד 7 ימי עסקים. אם לא הגיעה – אפשר לפנות אלינו בטופס הפנייה.', 'Estimated delivery is up to 7 business days. If it has not arrived, use the contact form.'],
  ] as const;
  for (const [i, f] of general.entries()) {
    await prisma.faq.create({ data: { bookId: null, questionHe: f[0], questionEn: f[1], answerHe: f[2], answerEn: f[3], sortOrder: i + 1 } });
  }

  /* מוצרים */
  const book1 = books[0]!;
  const book2 = books[1]!;
  const productDefs: { slug: string; kind: ProductKind; category: ProductCategory; he: string; en: string; price: number; bookId: string | null }[] = [
    { slug: 'flashcards-book-1', kind: 'DIGITAL', category: 'FLASHCARDS', he: 'כרטיסי תמונות – ספר 1', en: 'Picture Flashcards - Book 1', price: 2500, bookId: book1.id },
    { slug: 'flashcards-book-2', kind: 'DIGITAL', category: 'FLASHCARDS', he: 'כרטיסי תמונות – ספר 2', en: 'Picture Flashcards - Book 2', price: 2500, bookId: book2.id },
    { slug: 'songbook-book-1', kind: 'DIGITAL', category: 'SONGBOOK', he: 'שירון להדפסה – ספר 1', en: 'Printable Songbook - Book 1', price: 3500, bookId: book1.id },
    { slug: 'printables-pack-book-1', kind: 'DIGITAL', category: 'PRINTABLES', he: 'חבילת תכנים להדפסה – ספר 1', en: 'Printables Pack - Book 1', price: 1500, bookId: book1.id },
    { slug: 'sticker-set-lizzy', kind: 'PHYSICAL', category: 'STICKERS', he: 'מדבקות ליזי', en: 'Lizzy Sticker Set', price: 1800, bookId: null },
    { slug: 'stamp-set-star', kind: 'PHYSICAL', category: 'STAMPS', he: 'סט חותמות כוכבים', en: 'Star Stamp Set', price: 3500, bookId: null },
    { slug: 'reward-stickers-pack', kind: 'PHYSICAL', category: 'STICKERS', he: 'מדבקות עידוד לתלמידות', en: 'Reward Stickers Pack', price: 1200, bookId: null },
  ];
  const products: Record<string, { id: string; priceAgorot: number; nameHe: string; nameEn: string }> = {};
  for (const [i, p] of productDefs.entries()) {
    const imgKey = `products/${p.slug}.png`;
    await saveFile('public', imgKey, await placeholderPng({ width: 700, height: 700, title: p.en, subtitle: p.kind === 'DIGITAL' ? 'DEMO digital product' : 'DEMO physical product', bg: i % 2 ? '#d6f0ff' : '#ffd9ea' }), 'image/png');
    let digitalFileKey: string | null = null;
    if (p.kind === 'DIGITAL') {
      digitalFileKey = `products/${p.slug}.pdf`;
      await saveFile('private', digitalFileKey, samplePdf(p.en), 'application/pdf');
    }
    const created = await prisma.product.create({
      data: {
        slug: p.slug,
        bookId: p.bookId,
        kind: p.kind,
        category: p.category,
        nameHe: p.he,
        nameEn: p.en,
        descriptionHe: `${p.he} – תיאור לדוגמה. יוחלף בתיאור האמיתי.`,
        descriptionEn: `${p.en} - sample description. Replace with the real one.`,
        priceAgorot: p.price,
        digitalFileKey,
        images: { create: [{ key: imgKey, altHe: p.he, altEn: p.en }] },
      },
    });
    products[p.slug] = created;
  }

  /* הזמנות לדוגמה */
  const now = new Date();
  const fc = products['flashcards-book-1']!;
  const sticker = products['sticker-set-lizzy']!;
  const stamp = products['stamp-set-star']!;
  const item = (p: { id: string; priceAgorot: number; nameHe: string; nameEn: string }, quantity: number) => ({
    productId: p.id,
    quantity,
    unitPriceAgorot: p.priceAgorot,
    productNameHe: p.nameHe,
    productNameEn: p.nameEn,
  });

  // 1) ממתינה לתשלום (דיגיטלי + פיזי)
  await prisma.order.create({
    data: {
      code: 'TK-DEMO01',
      customerName: 'דנה לדוגמה',
      customerEmail: 'demo.pending@example.com',
      customerPhone: '050-0000001',
      shippingAddress: { street: 'רחוב הדוגמה 1', city: 'חיפה', zip: '3300000' },
      totalAgorot: fc.priceAgorot + sticker.priceAgorot * 2,
      items: { create: [item(fc, 1), item(sticker, 2)] },
    },
  });

  // 2) שולמה – הזמנה דיגיטלית עם קישור הורדה בתוקף
  const approved = await prisma.order.create({
    data: {
      code: 'TK-DEMO02',
      customerName: 'רונית לדוגמה',
      customerEmail: 'demo.approved@example.com',
      status: 'DELIVERED',
      paidAt: now,
      paymentRef: 'DEMO-SEED02',
      deliveredAt: now,
      totalAgorot: fc.priceAgorot,
      items: { create: [item(fc, 1)] },
    },
    include: { items: true },
  });
  await prisma.downloadGrant.create({
    data: { orderItemId: approved.items[0]!.id, token: generateDownloadToken(), expiresAt: addDays(now, env.DOWNLOAD_VALID_DAYS) },
  });

  // 3) נשלחה – מוצר פיזי
  await prisma.order.create({
    data: {
      code: 'TK-DEMO03',
      customerName: 'מיכל לדוגמה',
      customerEmail: 'demo.shipped@example.com',
      customerPhone: '050-0000003',
      shippingAddress: { street: 'שדרות הדוגמה 5', city: 'תל אביב', zip: '6100000' },
      status: 'SHIPPED',
      paidAt: addDays(now, -2),
      paymentRef: 'DEMO-SEED03',
      trackingNumber: 'RR123456789IL',
      shippedAt: addDays(now, -1),
      estimatedDeliveryAt: addBusinessDays(addDays(now, -2), env.DELIVERY_BUSINESS_DAYS),
      totalAgorot: stamp.priceAgorot,
      items: { create: [item(stamp, 1)] },
    },
  });

  // 4) שולמה – מוצר פיזי שממתין שהמנהלת תזמין מהספק
  await prisma.order.create({
    data: {
      code: 'TK-DEMO04',
      customerName: 'נועה לדוגמה',
      customerEmail: 'demo.paid@example.com',
      customerPhone: '050-0000004',
      shippingAddress: { street: 'רחוב הדוגמה 9', city: 'ירושלים', zip: '9100000' },
      status: 'PAID',
      paidAt: now,
      paymentRef: 'DEMO-SEED04',
      estimatedDeliveryAt: addBusinessDays(now, env.DELIVERY_BUSINESS_DAYS),
      totalAgorot: sticker.priceAgorot,
      items: { create: [item(sticker, 1)] },
    },
  });

  await prisma.contactMessage.create({
    data: { name: 'פונה לדוגמה', email: 'demo.contact@example.com', subject: 'שאלה לדוגמה', message: 'שלום, זו פנייה לדוגמה מהטופס.' },
  });

  console.log('✅ נתוני הדגמה נוצרו. קודי הזמנה לבדיקת מעקב: TK-DEMO01 (demo.pending@example.com – ממתינה לתשלום), TK-DEMO02 (demo.approved@example.com – דיגיטלית שולמה), TK-DEMO03 (demo.shipped@example.com – נשלחה), TK-DEMO04 (demo.paid@example.com – שולמה, ממתינה להזמנה מהספק)');
}

async function main(): Promise<void> {
  await ensureBuckets();
  await seedAdmin();
  const demo = env.SEED_DEMO ?? !env.isProd;
  if (demo) await seedDemo();
  else console.log('ℹ️  SEED_DEMO כבוי – לא נוצרים נתוני הדגמה.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
