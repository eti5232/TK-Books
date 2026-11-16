/* מפרט OpenAPI 3 – מוצג ב-/api-docs ונשמר גם ב-/openapi.json */

type Obj = Record<string, unknown>;

const ref = (n: string): Obj => ({ $ref: `#/components/schemas/${n}` });
const json = (schema: Obj, example?: unknown): Obj => ({ 'application/json': { schema, ...(example !== undefined ? { example } : {}) } });
const errRes = (description: string): Obj => ({ description, content: json(ref('Error')) });
const ok = (description: string, schema: Obj, example?: unknown): Obj => ({ description, content: json(schema, example) });
const paged = (item: string): Obj => ({
  type: 'object',
  properties: {
    items: { type: 'array', items: ref(item) },
    page: { type: 'integer', example: 1 },
    pageSize: { type: 'integer', example: 20 },
    total: { type: 'integer', example: 57 },
    totalPages: { type: 'integer', example: 3 },
  },
});
const listOf = (item: string): Obj => ({ type: 'object', properties: { items: { type: 'array', items: ref(item) } } });

const bearer = [{ bearerAuth: [] }];
const uuidParam = (name = 'id', description = 'מזהה (UUID)'): Obj => ({ name, in: 'path', required: true, description, schema: { type: 'string', format: 'uuid' } });
const slugParam = (): Obj => ({ name: 'slug', in: 'path', required: true, description: 'מזהה ספר/מוצר ב-URL, למשל book-1', schema: { type: 'string', example: 'book-1' } });
const q = (name: string, description: string, schema: Obj = { type: 'string' }): Obj => ({ name, in: 'query', required: false, description, schema });
const pageQs = (size = 20): Obj[] => [q('page', 'מספר עמוד (מתחיל ב-1)', { type: 'integer', default: 1 }), q('pageSize', 'כמות בעמוד (עד 200)', { type: 'integer', default: size })];

const adminErrors = { '401': errRes('אין Token / Token לא תקין או שפג תוקפו'), '403': errRes('אין הרשאת מנהלת') };
const validation = { '400': errRes('נתונים לא תקינים (VALIDATION_ERROR)') };

interface OpArgs {
  tag: string;
  summary: string;
  description?: string;
  admin?: boolean;
  parameters?: Obj[];
  body?: Obj;
  bodyExample?: unknown;
  multipart?: Obj;
  responses: Obj;
  extra?: string[];
}

function op(a: OpArgs): Obj {
  return {
    tags: [a.tag],
    summary: a.summary,
    description: [a.description, a.admin ? '🔒 דורש Bearer Token של מנהלת (אחרת 401/403).' : '🌐 פתוח לכולן (בלי התחברות).'].filter(Boolean).join('\n\n'),
    ...(a.admin ? { security: bearer } : {}),
    ...(a.parameters ? { parameters: a.parameters } : {}),
    ...(a.body ? { requestBody: { required: true, content: json(a.body, a.bodyExample) } } : {}),
    ...(a.multipart ? { requestBody: { required: true, content: { 'multipart/form-data': { schema: a.multipart } } } } : {}),
    responses: { ...a.responses, ...(a.admin ? adminErrors : {}), ...(a.body || a.parameters ? validation : {}) },
  };
}

const noContent = { '204': { description: 'נמחק בהצלחה (בלי תוכן)' }, '404': errRes('לא נמצא') };
const fileResponse = (description: string): Obj => ({ description, content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } });

const sampleBook = { id: '0b9f6d2e-1111-4a5b-9c3d-123456789abc', slug: 'book-1', titleHe: 'ספר ראשון', titleEn: 'Book One', descriptionHe: 'תיאור', descriptionEn: 'Description', coverImageUrl: 'http://localhost:3000/files/covers/book-1.png', sortOrder: 1, pageCount: 6 };
const sampleProduct = { id: '7a1c0e55-2222-4b6c-8d4e-123456789abc', slug: 'flashcards-book-1', bookId: sampleBook.id, book: { slug: 'book-1', titleHe: 'ספר ראשון', titleEn: 'Book One' }, kind: 'DIGITAL', category: 'FLASHCARDS', nameHe: 'כרטיסי תמונות – ספר 1', nameEn: 'Picture Flashcards – Book 1', descriptionHe: '...', descriptionEn: '...', priceAgorot: 2500, currency: 'ILS', images: [{ url: 'http://localhost:3000/files/products/x.png', altHe: '', altEn: '' }] };

const schemas: Record<string, Obj> = {
  Error: {
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'הנתונים שנשלחו אינם תקינים / Invalid input' },
          details: { description: 'פרטים נוספים (למשל רשימת שדות שגויים)' },
        },
      },
    },
  },
  LoginRequest: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email', example: 'admin@tkbooks.test' }, password: { type: 'string', example: 'Admin123!' } } },
  AdminUser: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string', enum: ['ADMIN'] } } },
  LoginResponse: { type: 'object', properties: { token: { type: 'string', description: 'JWT – יש לשלוח ב-Authorization: Bearer <token>' }, tokenType: { type: 'string', example: 'Bearer' }, admin: ref('AdminUser') } },
  Book: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' }, slug: { type: 'string' }, titleHe: { type: 'string' }, titleEn: { type: 'string' }, descriptionHe: { type: 'string' }, descriptionEn: { type: 'string' }, coverImageUrl: { type: 'string', nullable: true }, sortOrder: { type: 'integer' }, pageCount: { type: 'integer', description: 'כמה עמודים יש בקורא הספר' }, isActive: { type: 'boolean', description: '(מנהלת בלבד)' }, coverImageKey: { type: 'string', nullable: true, description: '(מנהלת בלבד)' } },
  },
  BookDetail: {
    allOf: [ref('Book'), { type: 'object', properties: { materialCounts: { type: 'object', properties: { SONG: { type: 'integer' }, TEST: { type: 'integer' }, REVIEW_SHEET: { type: 'integer' }, TEACHER_GUIDE: { type: 'integer' } } }, faqCount: { type: 'integer' }, productCount: { type: 'integer' } } }],
  },
  BookInput: { type: 'object', required: ['titleHe', 'titleEn'], properties: { slug: { type: 'string', example: 'book-4', description: 'אופציונלי; נוצר אוטומטית מהכותרת באנגלית' }, titleHe: { type: 'string' }, titleEn: { type: 'string' }, descriptionHe: { type: 'string' }, descriptionEn: { type: 'string' }, coverImageKey: { type: 'string', nullable: true, description: 'key שהוחזר מ-POST /api/admin/uploads עם area=public' }, sortOrder: { type: 'integer' }, isActive: { type: 'boolean' } } },
  Material: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' }, bookId: { type: 'string', format: 'uuid' }, type: { type: 'string', enum: ['SONG', 'TEST', 'REVIEW_SHEET', 'TEACHER_GUIDE'] }, titleHe: { type: 'string' }, titleEn: { type: 'string' }, descriptionHe: { type: 'string' }, descriptionEn: { type: 'string' }, unit: { type: 'integer', nullable: true }, sortOrder: { type: 'integer' }, mediaUrl: { type: 'string', nullable: true, description: 'קישור לסרטון/שיר (YouTube וכד׳)' }, lyricsHe: { type: 'string', nullable: true }, lyricsEn: { type: 'string', nullable: true }, hasFile: { type: 'boolean' }, downloadUrl: { type: 'string', nullable: true }, fileKey: { type: 'string', nullable: true, description: '(מנהלת בלבד)' }, isActive: { type: 'boolean', description: '(מנהלת בלבד)' } },
  },
  MaterialInput: { type: 'object', required: ['bookId', 'type', 'titleHe', 'titleEn'], properties: { bookId: { type: 'string', format: 'uuid' }, type: { type: 'string', enum: ['SONG', 'TEST', 'REVIEW_SHEET', 'TEACHER_GUIDE'] }, titleHe: { type: 'string' }, titleEn: { type: 'string' }, descriptionHe: { type: 'string' }, descriptionEn: { type: 'string' }, unit: { type: 'integer', nullable: true }, sortOrder: { type: 'integer' }, fileKey: { type: 'string', nullable: true, description: 'key מהעלאה עם area=private' }, mediaUrl: { type: 'string', nullable: true }, lyricsHe: { type: 'string', nullable: true }, lyricsEn: { type: 'string', nullable: true }, isActive: { type: 'boolean' } } },
  Faq: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, bookId: { type: 'string', format: 'uuid', nullable: true, description: 'null = שאלה כללית' }, questionHe: { type: 'string' }, questionEn: { type: 'string' }, answerHe: { type: 'string' }, answerEn: { type: 'string' }, sortOrder: { type: 'integer' }, isActive: { type: 'boolean', description: '(מנהלת בלבד)' } } },
  FaqInput: { type: 'object', required: ['questionHe', 'questionEn', 'answerHe', 'answerEn'], properties: { bookId: { type: 'string', format: 'uuid', nullable: true }, questionHe: { type: 'string' }, questionEn: { type: 'string' }, answerHe: { type: 'string' }, answerEn: { type: 'string' }, sortOrder: { type: 'integer' }, isActive: { type: 'boolean' } } },
  ProductImage: { type: 'object', properties: { url: { type: 'string', nullable: true }, altHe: { type: 'string' }, altEn: { type: 'string' } } },
  Product: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' }, slug: { type: 'string' }, bookId: { type: 'string', format: 'uuid', nullable: true }, book: { type: 'object', nullable: true, properties: { slug: { type: 'string' }, titleHe: { type: 'string' }, titleEn: { type: 'string' } } }, kind: { type: 'string', enum: ['DIGITAL', 'PHYSICAL'] }, category: { type: 'string', enum: ['FLASHCARDS', 'SONGBOOK', 'PRINTABLES', 'STICKERS', 'STAMPS', 'OTHER'] }, nameHe: { type: 'string' }, nameEn: { type: 'string' }, descriptionHe: { type: 'string' }, descriptionEn: { type: 'string' }, priceAgorot: { type: 'integer', description: 'מחיר באגורות (2500 = ₪25.00)' }, currency: { type: 'string', example: 'ILS' }, images: { type: 'array', items: ref('ProductImage') }, isActive: { type: 'boolean', description: '(מנהלת בלבד)' }, digitalFileKey: { type: 'string', nullable: true, description: '(מנהלת בלבד)' }, imageKeys: { type: 'array', items: { type: 'string' }, description: '(מנהלת בלבד)' } },
  },
  ProductInput: {
    type: 'object',
    required: ['kind', 'nameHe', 'nameEn', 'priceAgorot'],
    properties: { slug: { type: 'string' }, bookId: { type: 'string', format: 'uuid', nullable: true }, kind: { type: 'string', enum: ['DIGITAL', 'PHYSICAL'] }, category: { type: 'string', enum: ['FLASHCARDS', 'SONGBOOK', 'PRINTABLES', 'STICKERS', 'STAMPS', 'OTHER'] }, nameHe: { type: 'string' }, nameEn: { type: 'string' }, descriptionHe: { type: 'string' }, descriptionEn: { type: 'string' }, priceAgorot: { type: 'integer', minimum: 0 }, digitalFileKey: { type: 'string', nullable: true, description: 'חובה כש-kind=DIGITAL' }, images: { type: 'array', items: { type: 'object', required: ['key'], properties: { key: { type: 'string' }, altHe: { type: 'string' }, altEn: { type: 'string' } } } }, isActive: { type: 'boolean' } },
  },
  OrderCreate: {
    type: 'object',
    required: ['customerName', 'customerEmail', 'items'],
    properties: {
      customerName: { type: 'string', example: 'דנה כהן' },
      customerEmail: { type: 'string', format: 'email', example: 'dana@example.com' },
      customerPhone: { type: 'string', example: '050-0000000' },
      preferredLanguage: { type: 'string', enum: ['he', 'en'], default: 'he' },
      shippingAddress: { type: 'object', description: 'חובה אם יש מוצר פיזי', properties: { street: { type: 'string' }, city: { type: 'string' }, zip: { type: 'string' } } },
      notes: { type: 'string' },
      items: { type: 'array', minItems: 1, items: { type: 'object', required: ['productId', 'quantity'], properties: { productId: { type: 'string', format: 'uuid' }, quantity: { type: 'integer', minimum: 1, maximum: 10 } } } },
    },
  },
  OrderCreated: { type: 'object', properties: { code: { type: 'string', example: 'TK-7F3K9Q' }, status: { type: 'string', example: 'PENDING' }, totalAgorot: { type: 'integer' }, currency: { type: 'string' }, requiresShipping: { type: 'boolean' }, paymentMode: { type: 'string', enum: ['fake'], description: 'fake = תשלום דמה (לא גובה כסף)' } } },
  TrackRequest: { type: 'object', required: ['code', 'email'], properties: { code: { type: 'string', example: 'TK-DEMO01' }, email: { type: 'string', format: 'email', example: 'demo.pending@example.com' } } },
  OrderItem: {
    type: 'object',
    properties: { id: { type: 'string' }, productId: { type: 'string' }, productSlug: { type: 'string' }, nameHe: { type: 'string' }, nameEn: { type: 'string' }, kind: { type: 'string', enum: ['DIGITAL', 'PHYSICAL'] }, quantity: { type: 'integer' }, unitPriceAgorot: { type: 'integer' }, lineTotalAgorot: { type: 'integer' }, download: { type: 'object', nullable: true, properties: { url: { type: 'string' }, expiresAt: { type: 'string', format: 'date-time' }, expired: { type: 'boolean' }, downloadsLeft: { type: 'integer' } } } },
  },
  TrackedOrder: {
    type: 'object',
    properties: { code: { type: 'string' }, status: { type: 'string', enum: ['PENDING', 'PAID', 'ORDERED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'], description: 'PENDING = ממתינה לתשלום' }, createdAt: { type: 'string', format: 'date-time' }, paidAt: { type: 'string', format: 'date-time', nullable: true }, orderedAt: { type: 'string', format: 'date-time', nullable: true }, trackingNumber: { type: 'string', nullable: true }, canPay: { type: 'boolean', description: 'true = עוד לא שולמה; להציג כפתור תשלום' }, shippedAt: { type: 'string', format: 'date-time', nullable: true }, deliveredAt: { type: 'string', format: 'date-time', nullable: true }, estimatedDeliveryAt: { type: 'string', format: 'date-time', nullable: true, description: 'צפי הגעה: 7 ימי עסקים מרגע התשלום (מוצרים פיזיים)' }, hasPhysicalItems: { type: 'boolean' }, deliveryLate: { type: 'boolean', description: 'true = עבר צפי ההגעה; להציג קישור לטופס פנייה' }, statusNote: { type: 'string', nullable: true, description: 'סיבת ביטול/החזר' }, contactPath: { type: 'string', example: '/contact?order=TK-7F3K9Q' }, supportEmail: { type: 'string' }, totalAgorot: { type: 'integer' }, currency: { type: 'string' }, items: { type: 'array', items: ref('OrderItem') } },
  },
  AdminOrder: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' }, code: { type: 'string' }, status: { type: 'string' }, customerName: { type: 'string' }, customerEmail: { type: 'string' }, customerPhone: { type: 'string', nullable: true }, shippingAddress: { type: 'object', nullable: true }, notes: { type: 'string', nullable: true }, adminNote: { type: 'string', nullable: true }, preferredLanguage: { type: 'string', enum: ['he', 'en'] }, totalAgorot: { type: 'integer' }, currency: { type: 'string' }, paymentRef: { type: 'string', nullable: true }, trackingNumber: { type: 'string', nullable: true }, createdAt: { type: 'string', format: 'date-time' }, paidAt: { type: 'string', format: 'date-time', nullable: true }, orderedAt: { type: 'string', format: 'date-time', nullable: true }, shippedAt: { type: 'string', format: 'date-time', nullable: true }, deliveredAt: { type: 'string', format: 'date-time', nullable: true }, estimatedDeliveryAt: { type: 'string', format: 'date-time', nullable: true }, items: { type: 'array', items: ref('OrderItem') } },
  },
  ContactInput: { type: 'object', required: ['name', 'email', 'subject', 'message'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, subject: { type: 'string' }, message: { type: 'string' }, orderCode: { type: 'string', example: 'TK-7F3K9Q', description: 'אופציונלי – למשל כשהחבילה לא הגיעה' } } },
  ContactMessage: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, email: { type: 'string' }, subject: { type: 'string' }, message: { type: 'string' }, orderCode: { type: 'string', nullable: true }, status: { type: 'string', enum: ['NEW', 'HANDLED'] }, createdAt: { type: 'string', format: 'date-time' } } },
  Customer: { type: 'object', properties: { email: { type: 'string' }, name: { type: 'string' }, phone: { type: 'string', nullable: true }, ordersCount: { type: 'integer' }, totalAgorot: { type: 'integer' }, lastOrderAt: { type: 'string', format: 'date-time' } } },
  Stats: { type: 'object', properties: { pendingOrders: { type: 'integer' }, totalOrders: { type: 'integer' }, newMessages: { type: 'integer' }, books: { type: 'integer' }, materials: { type: 'integer' }, products: { type: 'integer' }, faqs: { type: 'integer' } } },
  UploadResult: { type: 'object', properties: { area: { type: 'string', enum: ['public', 'private'] }, key: { type: 'string', example: 'covers/3f2a.png' }, url: { type: 'string', nullable: true, description: 'רק ב-public' }, size: { type: 'integer' }, contentType: { type: 'string' } } },
};

const orderBodyExample = { customerName: 'דנה כהן', customerEmail: 'dana@example.com', customerPhone: '050-0000000', preferredLanguage: 'he', shippingAddress: { street: 'הרצל 1', city: 'חיפה', zip: '3300000' }, notes: '', items: [{ productId: sampleProduct.id, quantity: 2 }] };

export const openApiSpec: Obj = {
  openapi: '3.0.3',
  info: {
    title: 'TK Books API',
    version: '1.0.0',
    description:
      'Backend לאתר TK Books – חומרי לימוד באנגלית למורות.\n\n' +
      '**איך מתחברים ב-Swagger:** 1) `POST /api/auth/login` → מעתיקים את ה-`token`. 2) לוחצים **Authorize** למעלה, מדביקים את ה-Token (בלי המילה Bearer) ולוחצים Authorize. 3) עכשיו אפשר להפעיל את ה-Endpoints המסומנים 🔒.\n\n' +
      '**קודי שגיאה:** 400 קלט לא תקין · 401 אין/פג Token · 403 אין הרשאה · 404 לא נמצא · 409 התנגשות · 410 קישור פג · 429 יותר מדי בקשות.\n\n' +
      'אין הרשמה באתר: משתמשות אורחות (ללא התחברות) ומנהלת אחת עם JWT.',
  },
  servers: [{ url: '/', description: 'אותו שרת' }],
  tags: [
    { name: 'System', description: 'בדיקת בריאות' },
    { name: 'Auth', description: 'התחברות מנהלת' },
    { name: 'Books', description: 'ספרים וקורא הספר (צפייה בלבד, ללא הורדה)' },
    { name: 'Materials', description: 'שירים, מבחנים, דפי חזרה ומדריך למורה (הכול חינמי להורדה)' },
    { name: 'FAQ', description: 'שאלות נפוצות' },
    { name: 'Products', description: 'קטלוג מוצרים' },
    { name: 'Orders', description: 'בקשות הזמנה, מעקב והורדות' },
    { name: 'Contact', description: 'טופס פנייה' },
    { name: 'Admin – Books', description: 'ניהול ספרים' },
    { name: 'Admin – Materials', description: 'ניהול חומרי למידה' },
    { name: 'Admin – FAQ', description: 'ניהול שאלות נפוצות' },
    { name: 'Admin – Products', description: 'ניהול מוצרים' },
    { name: 'Admin – Orders', description: 'ניהול הזמנות' },
    { name: 'Admin – Other', description: 'לוח בקרה, לקוחות, פניות, העלאות' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'ה-token מ-/api/auth/login' } },
    schemas,
  },
  paths: {
    '/api/health': { get: op({ tag: 'System', summary: 'בדיקת בריאות שרת', responses: { '200': ok('השרת פעיל', { type: 'object', properties: { status: { type: 'string' }, time: { type: 'string' } } }, { status: 'ok', time: '2026-01-01T10:00:00.000Z' }) } }) },

    '/api/config': {
      get: op({
        tag: 'System',
        summary: 'הגדרות ציבוריות לאתר',
        description: 'מייל התמיכה (להערת "לכמויות גדולות"), מקסימום כמות לפריט, ימי תוקף הורדה וימי עסקים למשלוח.',
        responses: { '200': ok('הגדרות', { type: 'object', properties: { supportEmail: { type: 'string' }, maxItemQuantity: { type: 'integer', example: 10 }, downloadValidDays: { type: 'integer', example: 3 }, deliveryBusinessDays: { type: 'integer', example: 7 }, currency: { type: 'string', example: 'ILS' } } }) },
      }),
    },

    '/api/auth/login': {
      post: op({ tag: 'Auth', summary: 'התחברות מנהלת', description: 'מחזיר JWT עם תוקף מוגבל. מוגבל ל-5 ניסיונות בדקה.', body: ref('LoginRequest'), bodyExample: { email: 'admin@tkbooks.test', password: 'Admin123!' }, responses: { '200': ok('התחברות הצליחה', ref('LoginResponse')), '401': errRes('מייל או סיסמה שגויים (INVALID_CREDENTIALS)'), '429': errRes('יותר מדי ניסיונות') } }),
    },
    '/api/auth/me': { get: op({ tag: 'Auth', summary: 'פרטי המשתמשת המחוברת', admin: true, responses: { '200': ok('פרטי המנהלת', ref('AdminUser')) } }) },

    '/api/books': { get: op({ tag: 'Books', summary: 'רשימת הספרים', responses: { '200': ok('רשימת ספרים פעילים', listOf('Book'), { items: [sampleBook] }) } }) },
    '/api/books/{slug}': { get: op({ tag: 'Books', summary: 'פרטי ספר + ספירת חומרים', parameters: [slugParam()], responses: { '200': ok('הספר', ref('BookDetail')), '404': errRes('BOOK_NOT_FOUND') } }) },
    '/api/books/{slug}/pages/{n}': {
      get: op({
        tag: 'Books',
        summary: 'תמונת עמוד מהספר (צפייה בלבד)',
        description: 'מחזיר תמונת WebP עם סימן מים, ללא מטמון. אין קובץ PDF להורדה. מוגבל ל-120 בקשות בדקה. מספר העמודים נמצא ב-`pageCount` של הספר.',
        parameters: [slugParam(), { name: 'n', in: 'path', required: true, description: 'מספר עמוד (מתחיל ב-1)', schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'תמונת העמוד', content: { 'image/webp': { schema: { type: 'string', format: 'binary' } } } }, '404': errRes('BOOK_NOT_FOUND / PAGE_NOT_FOUND'), '429': errRes('יותר מדי בקשות') },
      }),
    },
    '/api/books/{slug}/materials': {
      get: op({ tag: 'Materials', summary: 'חומרי למידה של ספר (חיפוש/סינון/מיון)', description: 'סינון לפי `type` (SONG, TEST, REVIEW_SHEET), חיפוש חופשי `q`, מיון `sort`.', parameters: [slugParam(), q('type', 'סוג חומר', { type: 'string', enum: ['SONG', 'TEST', 'REVIEW_SHEET', 'TEACHER_GUIDE'] }), q('q', 'חיפוש בכותרת/תיאור'), q('sort', 'מיון', { type: 'string', enum: ['order', 'title', 'new'], default: 'order' }), ...pageQs(100)], responses: { '200': ok('רשימה מדורגת', paged('Material')), '404': errRes('BOOK_NOT_FOUND') } }),
    },
    '/api/materials/{id}/download': {
      get: op({ tag: 'Materials', summary: 'הורדת חומר חינמי (מבחן / דף חזרה / שיר)', parameters: [uuidParam()], responses: { '200': fileResponse('הקובץ (הורדה)'), '404': errRes('FILE_NOT_FOUND') } }),
    },

    '/api/faqs': {
      get: op({ tag: 'FAQ', summary: 'שאלות נפוצות', description: 'בלי פרמטרים: כל השאלות. `scope=general`: רק כלליות. `bookSlug`: של ספר מסוים (עם `includeGeneral=true` גם הכלליות).', parameters: [q('bookSlug', 'סינון לפי ספר'), q('scope', 'all / general', { type: 'string', enum: ['all', 'general'] }), q('includeGeneral', 'לכלול גם כלליות', { type: 'boolean' }), q('q', 'חיפוש')], responses: { '200': ok('רשימה', listOf('Faq')), '404': errRes('BOOK_NOT_FOUND') } }),
    },

    '/api/products': {
      get: op({ tag: 'Products', summary: 'קטלוג מוצרים (חיפוש/סינון/מיון)', parameters: [q('kind', 'DIGITAL או PHYSICAL', { type: 'string', enum: ['DIGITAL', 'PHYSICAL'] }), q('category', 'קטגוריה', { type: 'string', enum: ['FLASHCARDS', 'SONGBOOK', 'PRINTABLES', 'STICKERS', 'STAMPS', 'OTHER'] }), q('bookSlug', 'מוצרים של ספר'), q('q', 'חיפוש'), q('sort', 'מיון', { type: 'string', enum: ['new', 'price_asc', 'price_desc', 'name'], default: 'new' }), ...pageQs(20)], responses: { '200': ok('רשימה מדורגת', paged('Product'), { items: [sampleProduct], page: 1, pageSize: 20, total: 1, totalPages: 1 }) } }),
    },
    '/api/products/{slug}': { get: op({ tag: 'Products', summary: 'מוצר בודד', parameters: [slugParam()], responses: { '200': ok('המוצר', ref('Product')), '404': errRes('PRODUCT_NOT_FOUND') } }) },

    '/api/orders': {
      post: op({
        tag: 'Orders',
        summary: 'שליחת בקשת הזמנה (ללא תשלום)',
        description: 'ההזמנה נוצרת בסטטוס PENDING (ממתינה לתשלום) – אחר כך הלקוחה משלמת (כרגע: POST /api/orders/pay-demo). כמות לפריט: 1–10 (לכמויות גדולות יש לפנות למייל התמיכה). המחיר נקבע בשרת. אם יש מוצר פיזי – כתובת חובה. מיילים נשלחים רק אחרי תשלום. מוגבל ל-20 בשעה.',
        body: ref('OrderCreate'),
        bodyExample: orderBodyExample,
        responses: { '201': ok('ההזמנה נוצרה', ref('OrderCreated'), { code: 'TK-7F3K9Q', status: 'PENDING', totalAgorot: 5000, currency: 'ILS', requiresShipping: false }), '429': errRes('יותר מדי בקשות') },
      }),
    },
    '/api/orders/pay-demo': {
      post: op({ tag: 'Orders', summary: 'תשלום דמה (לא גובה כסף)', description: 'זמין רק כש-PAYMENT_DRIVER=fake, אחרת 404. מסמן את ההזמנה כשולמה: מוצר דיגיטלי → DELIVERED + קישורי הורדה ל-3 ימים; מוצר פיזי → PAID + צפי הגעה (7 ימי עסקים). נשלח מייל ללקוחה ולמנהלת. `outcome: "fail"` מדמה כשל בתשלום (400 PAYMENT_FAILED, ההזמנה נשארת PENDING). בעתיד יוחלף בדף תשלום של חברת סליקה + webhook.', body: ref('TrackRequest'), bodyExample: { code: 'TK-DEMO01', email: 'demo.pending@example.com' }, responses: { '200': ok('ההזמנה אחרי תשלום', ref('TrackedOrder')), '400': errRes('PAYMENT_FAILED'), '404': errRes('ORDER_NOT_FOUND') } }),
    },
    '/api/orders/track': {
      post: op({ tag: 'Orders', summary: 'מעקב הזמנה לפי קוד + מייל', description: 'דורש גם את הקוד וגם את המייל שבהזמנה. אחרת 404 (בלי לחשוף אם הקוד קיים). מוגבל ל-10 בדקה.', body: ref('TrackRequest'), bodyExample: { code: 'TK-DEMO01', email: 'demo.pending@example.com' }, responses: { '200': ok('סטטוס ההזמנה', ref('TrackedOrder')), '404': errRes('ORDER_NOT_FOUND'), '429': errRes('יותר מדי בקשות') } }),
    },
    '/api/downloads/{token}': {
      get: op({ tag: 'Orders', summary: 'הורדת מוצר דיגיטלי שהזמנתן ואושר', description: 'הקישור מגיע במייל האישור ובמעקב ההזמנה. תקף 3 ימים. 410 = פג תוקף, 403 = בוטל/הגעת למכסת הורדות.', parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' }, description: '64 תווים הקסדצימליים' }], responses: { '200': fileResponse('הקובץ (הורדה)'), '403': errRes('DOWNLOAD_REVOKED / DOWNLOAD_LIMIT_REACHED'), '404': errRes('DOWNLOAD_NOT_FOUND'), '410': errRes('DOWNLOAD_EXPIRED') } }),
    },
    '/api/contact': {
      post: op({ tag: 'Contact', summary: 'טופס פנייה', description: 'נשלח מייל למנהלת ואישור קבלה ללקוחה. מוגבל ל-5 בשעה.', body: ref('ContactInput'), bodyExample: { name: 'דנה כהן', email: 'dana@example.com', subject: 'החבילה לא הגיעה', message: 'שלום, עברו 7 ימי עסקים והחבילה עדיין לא הגיעה.', orderCode: 'TK-7F3K9Q' }, responses: { '201': ok('הפנייה התקבלה', { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string', example: 'NEW' } } }), '429': errRes('יותר מדי בקשות') } }),
    },

    /* ---------- ניהול ---------- */
    '/api/admin/stats': { get: op({ tag: 'Admin – Other', summary: 'מספרים ללוח הבקרה', admin: true, responses: { '200': ok('סטטיסטיקות', ref('Stats')) } }) },
    '/api/admin/customers': { get: op({ tag: 'Admin – Other', summary: 'לקוחות (לפי הזמנות)', description: 'אין הרשמה באתר, לכן "משתמשים" = מי שהזמינו, מקובצים לפי מייל.', admin: true, parameters: [...pageQs(20), q('q', 'חיפוש בשם/מייל')], responses: { '200': ok('רשימה', paged('Customer')) } }) },
    '/api/admin/uploads': {
      post: op({
        tag: 'Admin – Other',
        summary: 'העלאת קובץ',
        description: '`area=public` לתמונות שמוצגות באתר (כריכה, תמונת מוצר). `area=private` לקבצי הורדה (PDF/MP3/ZIP). ה-`key` שחוזר מוכנס בשדות `coverImageKey`, `fileKey`, `digitalFileKey` או `images[].key`. עד 25MB.',
        admin: true,
        multipart: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' }, area: { type: 'string', enum: ['public', 'private'], default: 'private' }, folder: { type: 'string', example: 'covers' } } },
        responses: { '201': ok('הקובץ נשמר', ref('UploadResult')), '413': errRes('הקובץ גדול מדי') },
      }),
    },

    '/api/admin/books': {
      get: op({ tag: 'Admin – Books', summary: 'רשימת ספרים (כולל מוסתרים)', admin: true, parameters: [...pageQs(20), q('q', 'חיפוש')], responses: { '200': ok('רשימה', paged('Book')) } }),
      post: op({ tag: 'Admin – Books', summary: 'הוספת ספר', admin: true, body: ref('BookInput'), bodyExample: { titleHe: 'ספר רביעי', titleEn: 'Book Four', descriptionHe: '', descriptionEn: '' }, responses: { '201': ok('נוצר', ref('Book')), '409': errRes('SLUG_TAKEN') } }),
    },
    '/api/admin/books/{id}': {
      get: op({ tag: 'Admin – Books', summary: 'ספר + רשימת מספרי עמודים', admin: true, parameters: [uuidParam()], responses: { '200': ok('הספר', ref('Book')), '404': errRes('BOOK_NOT_FOUND') } }),
      put: op({ tag: 'Admin – Books', summary: 'עריכת ספר (שדות חלקיים)', admin: true, parameters: [uuidParam()], body: ref('BookInput'), responses: { '200': ok('עודכן', ref('Book')), '404': errRes('BOOK_NOT_FOUND'), '409': errRes('SLUG_TAKEN') } }),
      delete: op({ tag: 'Admin – Books', summary: 'מחיקת ספר', description: 'מוחק גם את עמודי הספר, החומרים והשאלות שלו. מוצרים של הספר נשארים ללא שיוך.', admin: true, parameters: [uuidParam()], responses: noContent }),
    },
    '/api/admin/books/{id}/pages': {
      post: op({ tag: 'Admin – Books', summary: 'העלאת עמודי ספר (תמונות)', description: 'שדה `pages` – קובץ אחד או יותר (PNG/JPG/WEBP). העמודים נוספים בסוף. `replace=true` מוחק קודם את כל העמודים הקיימים (שימושי להחלפת דמו בספר האמיתי).', admin: true, parameters: [uuidParam()], multipart: { type: 'object', required: ['pages'], properties: { pages: { type: 'array', items: { type: 'string', format: 'binary' } }, replace: { type: 'string', enum: ['true', 'false'] } } }, responses: { '201': ok('נוספו', { type: 'object', properties: { added: { type: 'integer' }, pageNumbers: { type: 'array', items: { type: 'integer' } } } }), '404': errRes('BOOK_NOT_FOUND') } }),
    },
    '/api/admin/books/{id}/pages/{n}': {
      delete: op({ tag: 'Admin – Books', summary: 'מחיקת עמוד', admin: true, parameters: [uuidParam(), { name: 'n', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }], responses: noContent }),
    },

    '/api/admin/materials': {
      get: op({ tag: 'Admin – Materials', summary: 'רשימת חומרים (כולל מוסתרים)', admin: true, parameters: [...pageQs(20), q('q', 'חיפוש'), q('bookId', 'סינון לפי ספר', { type: 'string', format: 'uuid' }), q('type', 'סוג', { type: 'string', enum: ['SONG', 'TEST', 'REVIEW_SHEET', 'TEACHER_GUIDE'] })], responses: { '200': ok('רשימה', paged('Material')) } }),
      post: op({ tag: 'Admin – Materials', summary: 'הוספת שיר / מבחן / דף חזרה', admin: true, body: ref('MaterialInput'), bodyExample: { bookId: sampleBook.id, type: 'SONG', titleHe: 'שיר חדש', titleEn: 'New Song', unit: 1, mediaUrl: 'https://www.youtube.com/watch?v=example' }, responses: { '201': ok('נוצר', ref('Material')), '404': errRes('BOOK_NOT_FOUND') } }),
    },
    '/api/admin/materials/{id}': {
      get: op({ tag: 'Admin – Materials', summary: 'חומר בודד', admin: true, parameters: [uuidParam()], responses: { '200': ok('החומר', ref('Material')), '404': errRes('MATERIAL_NOT_FOUND') } }),
      put: op({ tag: 'Admin – Materials', summary: 'עריכת חומר', admin: true, parameters: [uuidParam()], body: ref('MaterialInput'), responses: { '200': ok('עודכן', ref('Material')), '404': errRes('לא נמצא') } }),
      delete: op({ tag: 'Admin – Materials', summary: 'מחיקת חומר', admin: true, parameters: [uuidParam()], responses: noContent }),
    },

    '/api/admin/faqs': {
      get: op({ tag: 'Admin – FAQ', summary: 'רשימת שאלות נפוצות (כולל מוסתרות)', admin: true, parameters: [...pageQs(20), q('q', 'חיפוש'), q('bookId', 'סינון לפי ספר', { type: 'string', format: 'uuid' })], responses: { '200': ok('רשימה', paged('Faq')) } }),
      post: op({ tag: 'Admin – FAQ', summary: 'הוספת שאלה', description: '`bookId` ריק/null = שאלה כללית.', admin: true, body: ref('FaqInput'), bodyExample: { bookId: null, questionHe: 'איך מזמינים?', questionEn: 'How do I order?', answerHe: 'מוסיפים לעגלה ושולחים בקשה.', answerEn: 'Add to cart and send a request.' }, responses: { '201': ok('נוצר', ref('Faq')) } }),
    },
    '/api/admin/faqs/{id}': {
      put: op({ tag: 'Admin – FAQ', summary: 'עריכת שאלה', admin: true, parameters: [uuidParam()], body: ref('FaqInput'), responses: { '200': ok('עודכן', ref('Faq')), '404': errRes('לא נמצא') } }),
      delete: op({ tag: 'Admin – FAQ', summary: 'מחיקת שאלה', admin: true, parameters: [uuidParam()], responses: noContent }),
    },

    '/api/admin/products': {
      get: op({ tag: 'Admin – Products', summary: 'רשימת מוצרים (כולל מוסתרים)', admin: true, parameters: [...pageQs(20), q('q', 'חיפוש'), q('kind', 'סוג', { type: 'string', enum: ['DIGITAL', 'PHYSICAL'] }), q('category', 'קטגוריה')], responses: { '200': ok('רשימה', paged('Product')) } }),
      post: op({ tag: 'Admin – Products', summary: 'הוספת מוצר', admin: true, body: ref('ProductInput'), bodyExample: { kind: 'PHYSICAL', category: 'STICKERS', nameHe: 'מדבקות', nameEn: 'Stickers', priceAgorot: 1500, images: [] }, responses: { '201': ok('נוצר', ref('Product')), '409': errRes('SLUG_TAKEN') } }),
    },
    '/api/admin/products/{id}': {
      get: op({ tag: 'Admin – Products', summary: 'מוצר בודד', admin: true, parameters: [uuidParam()], responses: { '200': ok('המוצר', ref('Product')), '404': errRes('PRODUCT_NOT_FOUND') } }),
      put: op({ tag: 'Admin – Products', summary: 'עריכת מוצר', description: 'אם שולחים `images` – הרשימה מחליפה את כל התמונות הקיימות.', admin: true, parameters: [uuidParam()], body: ref('ProductInput'), responses: { '200': ok('עודכן', ref('Product')), '404': errRes('PRODUCT_NOT_FOUND') } }),
      delete: op({ tag: 'Admin – Products', summary: 'מחיקת מוצר', description: 'מוצר שכבר הוזמן לא נמחק (409 PRODUCT_IN_USE) – יש להסתיר אותו עם isActive=false.', admin: true, parameters: [uuidParam()], responses: { ...noContent, '409': errRes('PRODUCT_IN_USE') } }),
    },

    '/api/admin/orders': {
      get: op({ tag: 'Admin – Orders', summary: 'רשימת הזמנות', admin: true, parameters: [...pageQs(20), q('status', 'סטטוס', { type: 'string', enum: ['PENDING', 'PAID', 'ORDERED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] }), q('q', 'חיפוש לפי קוד/שם/מייל')], responses: { '200': ok('רשימה', paged('AdminOrder')) } }),
    },
    '/api/admin/orders/{id}': { get: op({ tag: 'Admin – Orders', summary: 'פרטי הזמנה', admin: true, parameters: [uuidParam()], responses: { '200': ok('ההזמנה', ref('AdminOrder')), '404': errRes('ORDER_NOT_FOUND') } }) },
    '/api/admin/orders/{id}/mark-ordered': {
      patch: op({ tag: 'Admin – Orders', summary: 'סימון כהוזמנה מהספק', description: 'PAID → ORDERED.', admin: true, parameters: [uuidParam()], responses: { '200': ok('עודכן', ref('AdminOrder')), '409': errRes('INVALID_STATUS') } }),
    },
    '/api/admin/orders/{id}/ship': { patch: op({ tag: 'Admin – Orders', summary: 'סימון כנשלח', description: 'PAID / ORDERED → SHIPPED + מייל ללקוחה (עם מספר מעקב אם הוזן).', admin: true, parameters: [uuidParam()], body: { type: 'object', properties: { trackingNumber: { type: 'string' } } }, bodyExample: { trackingNumber: 'RR123456789IL' }, responses: { '200': ok('עודכן', ref('AdminOrder')), '409': errRes('INVALID_STATUS') } }) },
    '/api/admin/orders/{id}/cancel': {
      patch: op({ tag: 'Admin – Orders', summary: 'ביטול הזמנה שלא שולמה', description: 'PENDING → CANCELLED.', admin: true, parameters: [uuidParam()], body: { type: 'object', properties: { reason: { type: 'string' } } }, responses: { '200': ok('בוטלה', ref('AdminOrder')), '409': errRes('INVALID_STATUS') } }),
    },
    '/api/admin/orders/{id}/refund': {
      patch: op({ tag: 'Admin – Orders', summary: 'ביטול + החזר כספי', description: 'PAID / ORDERED / SHIPPED / DELIVERED → REFUNDED. מבטל את קישורי ההורדה ושולח מייל ללקוחה. בדמה אין כסף להחזיר; עם חברת סליקה אמיתית תתווסף כאן קריאת החזר.', admin: true, parameters: [uuidParam()], body: { type: 'object', properties: { reason: { type: 'string' } } }, bodyExample: { reason: 'הספק לא יכול לספק' }, responses: { '200': ok('הוחזר', ref('AdminOrder')), '409': errRes('INVALID_STATUS') } }),
    },
    '/api/admin/orders/{id}/deliver': { patch: op({ tag: 'Admin – Orders', summary: 'סימון כנמסר', admin: true, parameters: [uuidParam()], responses: { '200': ok('עודכן', ref('AdminOrder')), '409': errRes('INVALID_STATUS') } }) },
    '/api/admin/orders/{id}/extend-download': { post: op({ tag: 'Admin – Orders', summary: 'הארכת הורדה ב-3 ימים', admin: true, parameters: [uuidParam()], responses: { '200': ok('עודכן', ref('AdminOrder')), '409': errRes('INVALID_STATUS') } }) },

    '/api/admin/contact-messages': { get: op({ tag: 'Admin – Other', summary: 'פניות מטופס יצירת קשר', admin: true, parameters: [...pageQs(20), q('status', 'NEW / HANDLED', { type: 'string', enum: ['NEW', 'HANDLED'] })], responses: { '200': ok('רשימה', paged('ContactMessage')) } }) },
    '/api/admin/contact-messages/{id}': {
      patch: op({ tag: 'Admin – Other', summary: 'עדכון סטטוס פנייה', admin: true, parameters: [uuidParam()], body: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['NEW', 'HANDLED'] } } }, bodyExample: { status: 'HANDLED' }, responses: { '200': ok('עודכן', ref('ContactMessage')), '404': errRes('לא נמצא') } }),
      delete: op({ tag: 'Admin – Other', summary: 'מחיקת פנייה', admin: true, parameters: [uuidParam()], responses: noContent }),
    },
  },
};
