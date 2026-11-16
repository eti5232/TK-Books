# TK Books — תוכנית מלאה (אפיון + ארכיטקטורה + מפת דרכים)

> מסמך זה הוא האפיון לאישור (שלב 2 בפרומפט). אחרי שתכתבי "מאשרת" ונענה על שאלות הפתוחות בסוף (פרק 16) – אפשר לבנות.
> חלוקת עבודה: **את** כותבת את כל ה-React. **אני** בונה Backend, מסד נתונים, אימות, Swagger, בדיקות, ZIP והוראות פריסה.

---

## 0. השפות והטכנולוגיות — מה כדאי לכתוב ב-

**המלצה: TypeScript בכל מקום.** שפה אחת לכל הפרויקט = פחות בלבול למתחילה.

| חלק | טכנולוגיה | למה |
|---|---|---|
| Frontend (את כותבת) | **React + TypeScript + Vite** | הדרישה של הקורס |
| ניתוב | React Router | מעבר בין מסכים |
| טפסים | React Hook Form + Zod | ולידציה אחידה עם השרת |
| נתונים מהשרת | React Query (TanStack) | מטמון, טעינה, שגיאות |
| סל קניות | Context (או Redux Toolkit) | הסל נשמר גם ברענון (localStorage) |
| שפות | **react-i18next** (i18n) | עברית/אנגלית, החלפת שפה |
| RTL/LTR | `dir="rtl"` על `<html>` לפי שפה + CSS logical properties (`margin-inline-start`) | תמיכה אמיתית בעברית |
| עיצוב | CSS Modules או Tailwind (ורוד/תכלת), גופנים: Fredoka / Varela Round / Rubik | ילדותי וקריא בעברית |
| Backend (אני בונה) | **Node.js LTS + Express + TypeScript strict** | |
| מסד נתונים | **PostgreSQL + Prisma ORM** | |
| ולידציה | Zod | |
| אימות | JWT (מנהלת בלבד) + bcrypt | |
| תיעוד API | Swagger / OpenAPI 3 ב-`/api-docs` | |
| בדיקות | Vitest + Supertest | |
| אחסון קבצים | **Supabase Storage** (חינמי, buckets פרטיים + Signed URLs) | הדיסק של Render החינמי נמחק בכל deploy — אי אפשר לשמור שם קבצים |
| מיילים | **Resend** או **Brevo** (שכבה חינמית) דרך Nodemailer | Gmail אישי לא יציב לייצור |
| פריסה | GitHub → Render (שרת) + Supabase (DB+Storage) + Netlify/Vercel/Render Static (React) | הכול חינמי בהתחלה |

**למה לא PHP/Python/WordPress?** אפשר, אבל הפרומפט שלך מחייב Node+Express+Prisma, והעבודה על שפה אחת (TS) חוסכת לך ללמוד שתיים.

---

## 1. תיאור הפרויקט

- **שם:** TK Books
- **מטרה:** אתר שמרכז חומרי לימוד באנגלית סביב 3 ספרים של הבעלים. במקום לשלוח ספר במייל – שולחים קישור לאתר. המורות צופות בספר (ללא הורדה), מורידות חומרי עזר חינמיים (מבחנים, דפי חזרה...), וקונות מוצרים נלווים (כרטיסי תמונות, מדריך למורה, מדבקות, חותמות) דרך הזמנה שהמנהלת מאשרת.
- **קהל יעד:** מורות לאנגלית (חלקן מעדיפות עברית). **בראש כל עמוד תמיד:** "לתשומת לב: החומרים באתר זה למורות בלבד" / "Please note: the materials on this site are for teachers only".
- **משתמשים:** (1) **אורחת** – בלי הרשמה ובלי התחברות. (2) **מנהלת** – מתחברת עם מייל וסיסמה.
- **דמות:** ליזי (Lizzy) – ילדה, מסקוטה של האתר (לוגו, מצבי טעינה, 404, "הוספת לעגלה" וכו'). **את** מספקת איורים; אני לא מייצרת איורים.
- **עיצוב:** ורוד + תכלת, פינות מעוגלות, אייקונים גדולים.

---

## 2. מפת האתר (מסכים) — לפיתוח React

### אזור ציבורי (אורחת)
| # | מסך | נתיב | מה מוצג / פעולות |
|---|---|---|---|
| 1 | דף בית | `/` | באנר "למורות בלבד", ליזי, 3 הספרים ככרטיסים, קישורים לקטלוג ולשאלות נפוצות |
| 2 | כל הספרים | `/books` | 3 כרטיסי ספר |
| 3 | עמוד ספר | `/books/:slug` | כותרת ספר + **תתי-לשוניות**: צפייה בספר · שירים · מבחנים · דפי חזרה · שאלות נפוצות · מוצרים לספר |
| 3א | צפייה בספר | `/books/:slug/read` | קורא עמודים ללא הורדה (ראו פרק 8) |
| 4 | קטלוג מוצרים | `/shop` | רשת מוצרים, תמונה, מחיר, סינון לפי סוג (דיגיטלי/פיזי) וספר, חיפוש |
| 5 | עמוד מוצר | `/shop/:slug` | גלריה, תיאור, מחיר, כמות (1–10), "הוסיפי לעגלה" |
| 6 | עגלה | `/cart` | פריטים, כמות (מקס' 10), הערה בולטת + מייל לכמויות גדולות, סה"כ |
| 7 | סיום הזמנה | `/checkout` | שם, מייל, טלפון, כתובת (אם יש פיזי), הערות → "שלחי בקשת הזמנה" |
| 8 | אישור שליחה | `/order/success` | קוד הזמנה + הסבר "ממתין לאישור" |
| 9 | מעקב הזמנה | `/track` | קוד הזמנה + מייל → סטטוס + צפי הגעה + קישורי הורדה (אם אושר ובתוקף) |
| 10 | שאלות נפוצות | `/faq` | כלליות + לפי ספר, אקורדיון |
| 11 | צור קשר | `/contact` | טופס פנייה |
| 12 | 404 | `*` | ליזי מבולבלת |

### אזור מנהלת (`/admin`, מוגן)
| מסך | פעולות |
|---|---|
| התחברות `/admin/login` | מייל + סיסמה |
| לוח בקרה | הזמנות ממתינות, פניות חדשות, מספרים |
| ספרים | עריכת פרטי ספר (שם, תיאור, תמונת כריכה), העלאת עמודי הספר לצפייה, **הוספה/עריכה/מחיקה** |
| חומרי למידה | שירים / מבחנים / דפי חזרה: הוספה, עריכה, מחיקה, שיוך לספר, העלאת קובץ |
| שאלות נפוצות | CRUD, שיוך לספר או "כללי" |
| מוצרים | CRUD, תמונות, מחיר, סוג, קובץ להורדה (לדיגיטלי), פעיל/מוסתר |
| הזמנות | רשימה + סינון סטטוס, פרטי הזמנה, **אישור / דחייה / סימון נשלח / סימון הגיע**, שליחת מייל אוטומטית |
| פניות | רשימת הודעות מטופס יצירת קשר, סימון "טופל", מחיקה |
| "משתמשים" | ראו שאלה פתוחה 16.1 — אין משתמשים רשומים; המסך יציג **לקוחות לפי הזמנות** (שם+מייל+מס' הזמנות) |

---

## 3. הרשאות

| פעולה | אורחת | מנהלת |
|---|---|---|
| צפייה בספרים (ללא הורדה) | ✅ | ✅ |
| צפייה/הורדה של שירים, מבחנים, דפי חזרה, FAQ (חינמי) | ✅ | ✅ |
| צפייה בקטלוג ובתמונות מוצרים | ✅ | ✅ |
| שליחת בקשת הזמנה | ✅ | ✅ |
| מעקב הזמנה (קוד + מייל) | ✅ (רק שלה) | ✅ (הכול) |
| הורדת קובץ מוצר דיגיטלי | רק אחרי אישור, 3 ימים, קישור חתום | ✅ |
| טופס פנייה | ✅ | ✅ |
| CRUD ספרים/חומרים/FAQ/מוצרים | ❌ (403/401) | ✅ |
| אישור/דחיית הזמנות | ❌ | ✅ |
| צפייה בפניות ולקוחות | ❌ | ✅ |

**מעקב הזמנה לאורחת בלי חשבון:** קוד הזמנה אקראי (למשל `TK-7F3K9Q`) + מייל חייבים להתאים. אין חשיפת הזמנות של אחרות.

---

## 4. תכנון מסד הנתונים (PostgreSQL / Prisma)

שפה כפולה: שדות טקסט נשמרים כ-`...He` ו-`...En` (פשוט ובטוח למתחילה).

### 4.1 `Admin`
| שדה | טיפוס | הערות |
|---|---|---|
| id | uuid PK | |
| email | string unique, חובה | |
| passwordHash | string, חובה | bcrypt |
| name | string | |
| createdAt | datetime | |

### 4.2 `Book`
| שדה | טיפוס | הערות |
|---|---|---|
| id | uuid PK | |
| slug | string unique | `book-1` |
| titleHe / titleEn | string, חובה | |
| descriptionHe / descriptionEn | text | |
| coverImageUrl | string | |
| sortOrder | int | |
| isActive | bool default true | |
קשרים: 1—N עם BookPage, Material, Faq, Product.

### 4.3 `BookPage` (עמודי הצפייה בספר)
id PK · bookId FK→Book (onDelete Cascade) · pageNumber int (unique עם bookId) · storagePath string (בדלי **פרטי**).

### 4.4 `Material` (שירים / מבחנים / דפי חזרה)
| שדה | טיפוס |
|---|---|
| id | uuid PK |
| bookId | FK→Book (חובה) |
| type | enum `SONG` \| `TEST` \| `REVIEW_SHEET` |
| titleHe / titleEn | string חובה |
| descriptionHe / descriptionEn | text |
| unit / sortOrder | int |
| fileStoragePath | string (קובץ להורדה, למשל PDF/MP3) |
| mediaUrl | string? (קישור YouTube לשיר, אופציונלי) |
| lyricsHe/lyricsEn | text? (מילות שיר) |
| isActive | bool |
| createdAt | datetime |

### 4.5 `Faq`
id PK · bookId FK? (**null = שאלה כללית**) · questionHe/En · answerHe/En · sortOrder · isActive.

### 4.6 `Product`
| שדה | טיפוס |
|---|---|
| id, slug unique | |
| bookId | FK? (null = מוצר כללי) |
| kind | enum `DIGITAL` \| `PHYSICAL` |
| category | enum `FLASHCARDS`, `TEACHER_GUIDE`, `PRINTABLES`, `STICKERS`, `STAMPS`, `OTHER` |
| nameHe/nameEn, descriptionHe/En | |
| priceAgorot | int ≥ 0 (שומרים אגורות, לא float) |
| currency | string default `ILS` |
| images | `ProductImage[]` |
| digitalFilePath | string? (חובה אם DIGITAL) |
| isActive | bool |
**אילוץ:** `kind = DIGITAL` ⇒ `digitalFilePath` קיים. `priceAgorot >= 0`.

### 4.7 `ProductImage`
id · productId FK (Cascade) · url · altHe/En · sortOrder.

### 4.8 `Order`
| שדה | טיפוס |
|---|---|
| id | uuid PK |
| code | string unique (`TK-XXXXXX`) |
| customerName, customerEmail, customerPhone | חובה (טלפון אופציונלי) |
| shippingAddress | json? (חובה אם יש מוצר פיזי) |
| notes | text? |
| status | enum `PENDING` → `APPROVED` → `SHIPPED` → `DELIVERED`; או `REJECTED` / `CANCELLED` |
| totalAgorot | int |
| approvedAt, shippedAt, deliveredAt | datetime? |
| estimatedDeliveryAt | date? (= אישור + 7 ימי עסקים, רק פיזי) |
| adminNote | text? |
| preferredLanguage | `he`\|`en` (בשפה זו יישלחו המיילים) |
| createdAt | |

### 4.9 `OrderItem`
id · orderId FK (Cascade) · productId FK→Product (**Restrict** – לא מוחקים מוצר שהוזמן; משתמשים ב-isActive=false) · quantity int **1..10** · unitPriceAgorot (צילום מחיר ברגע ההזמנה) · productNameSnapshot.

### 4.10 `DownloadGrant` (הרשאת הורדה)
id · orderItemId FK · token string unique (אקראי 32 בתים) · expiresAt (**approvedAt + 3 ימים**) · downloadCount int · maxDownloads int (למשל 10) · revokedAt?.
נוצר **רק** באישור הזמנה ורק לפריט DIGITAL.

### 4.11 `ContactMessage`
id · name · email · subject · message · status `NEW`/`HANDLED` · createdAt.

### 4.12 `EmailLog` (מומלץ)
id · orderId? · to · type · status `SENT`/`FAILED` · error? · createdAt. (עוזר לדעת שמייל לא יצא.)

**אינדקסים:** Order(code), Order(customerEmail), Order(status), Material(bookId,type), Product(isActive,kind), DownloadGrant(token).

---

## 5. זרימות עסקיות עיקריות

### 5.1 הזמנה (ללא תשלום בשלב זה)
1. אורחת מוסיפה לעגלה (localStorage), כמות 1–10 לפריט.
2. `POST /api/orders` → סטטוס `PENDING`, נוצר `code`.
3. מייל ללקוחה: "קיבלנו את בקשתך, קוד X, ממתין לאישור". מייל למנהלת: "הזמנה חדשה".
4. מנהלת מאשרת (`PATCH /api/admin/orders/:id/approve`):
   - כל פריט DIGITAL ← נוצר DownloadGrant (3 ימים).
   - אם יש PHYSICAL ← `estimatedDeliveryAt` = 7 ימי עסקים.
   - נשלח מייל אישור: קישורי הורדה (דיגיטלי) + צפי הגעה (פיזי).
5. מנהלת מסמנת `SHIPPED` → `DELIVERED`.
6. אם לא הגיע אחרי 7 ימי עסקים: בעמוד המעקב מופיע כפתור/קישור "לא הגיע? פני אלינו" → `/contact?order=TK-XXXX` (ממלא קוד אוטומטית) + מייל ישיר.

### 5.2 "אפשרות הורדה — באתר, במייל או שניהם"
**המלצה: שניהם.** (א) המייל כולל קישורים; (ב) בעמוד המעקב מוצג "ניתן להוריד ל-3 ימים בלבד" + ספירה לאחור. אחרי פקיעה: "הקישור פג, פני אלינו" (המנהלת יכולה "להאריך 3 ימים" – פעולה אדמין).

### 5.3 תשלום עתידי באשראי
העיצוב מראש מאפשר: הוספת שדה `paymentStatus` + ספק (Stripe/PayPlus/Tranzila) מאוחר יותר. **לא נבנה עכשיו.**

---

## 6. Endpoints (REST, קידומת `/api`)

פורמט שגיאה אחיד: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`

### Auth (מנהלת)
| Method | URL | הרשאה | תיאור |
|---|---|---|---|
| POST | `/api/auth/login` | ציבורי | `{email,password}` → `{token, admin}` |
| GET | `/api/auth/me` | Bearer (Admin) | פרטי המנהלת |

### ציבורי — קריאה
| Method | URL | תיאור |
|---|---|---|
| GET | `/api/health` | בדיקת בריאות |
| GET | `/api/books` | רשימת ספרים |
| GET | `/api/books/:slug` | ספר + ספירות |
| GET | `/api/books/:slug/pages/:n` | **תמונת עמוד** (ראו פרק 8) |
| GET | `/api/books/:slug/materials?type=SONG\|TEST\|REVIEW_SHEET&q=` | חומרים (חיפוש/סינון/מיון) |
| GET | `/api/materials/:id/download` | הורדה חינמית (redirect לקישור חתום קצר) |
| GET | `/api/faqs?bookId=&q=` | שאלות נפוצות (כלליות או לפי ספר) |
| GET | `/api/products?kind=&category=&bookId=&q=&sort=price_asc\|price_desc\|new&page=` | קטלוג |
| GET | `/api/products/:slug` | מוצר |
| GET | `/api/search?q=` | חיפוש גלובלי (אופציונלי) |

### ציבורי — כתיבה
| Method | URL | תיאור |
|---|---|---|
| POST | `/api/orders` | יצירת בקשת הזמנה |
| POST | `/api/orders/track` | `{code,email}` → סטטוס + קישורי הורדה פעילים (POST כדי שמייל לא יופיע ב-URL) |
| GET | `/api/downloads/:token` | הורדת מוצר דיגיטלי מורשה (בדיקת תוקף/ביטול/מונה) |
| POST | `/api/contact` | טופס פנייה (+ rate limit) |

### מנהלת (`Bearer`, role=ADMIN)
| Method | URL | תיאור |
|---|---|---|
| GET/POST | `/api/admin/books` · PUT/DELETE `/api/admin/books/:id` | CRUD ספרים |
| POST | `/api/admin/books/:id/pages` | העלאת עמודי ספר |
| DELETE | `/api/admin/books/:id/pages/:n` | מחיקת עמוד |
| GET/POST | `/api/admin/materials` · PUT/DELETE `/:id` | CRUD חומרים |
| GET/POST | `/api/admin/faqs` · PUT/DELETE `/:id` | CRUD FAQ |
| GET/POST | `/api/admin/products` · PUT/DELETE `/:id` | CRUD מוצרים |
| POST | `/api/admin/uploads` | העלאת קובץ/תמונה (multer → Supabase) |
| GET | `/api/admin/orders?status=&q=&page=` | רשימת הזמנות |
| GET | `/api/admin/orders/:id` | פרטי הזמנה |
| PATCH | `/api/admin/orders/:id/approve` | אישור + מיילים + הרשאות הורדה |
| PATCH | `/api/admin/orders/:id/reject` | דחייה + מייל |
| PATCH | `/api/admin/orders/:id/ship` / `deliver` | עדכון סטטוס |
| POST | `/api/admin/orders/:id/extend-download` | הארכת הורדה 3 ימים |
| GET | `/api/admin/customers` | לקוחות (נגזר מהזמנות) |
| GET | `/api/admin/contact-messages` · PATCH `/:id` · DELETE `/:id` | פניות |
| GET | `/api/admin/stats` | מספרים ללוח בקרה |

לכל endpoint אכתוב ב-Swagger: בקשה, תגובה, דוגמאות JSON, קודי שגיאה, והרשאות.

**מבנה תגובת רשימה:** `{ "items": [...], "page": 1, "pageSize": 20, "total": 57 }`.

### דוגמת בקשת הזמנה
```json
POST /api/orders
{
  "customerName": "דנה כהן",
  "customerEmail": "dana@example.com",
  "customerPhone": "050-0000000",
  "preferredLanguage": "he",
  "shippingAddress": { "street": "הרצל 1", "city": "חיפה", "zip": "3300000" },
  "notes": "",
  "items": [
    { "productId": "…", "quantity": 2 },
    { "productId": "…", "quantity": 1 }
  ]
}
```
תגובה 201: `{ "code": "TK-7F3K9Q", "status": "PENDING", "totalAgorot": 7800 }`

---

## 7. כללי ולידציה

- כמות פריט: מספר שלם 1–10 (שרת **ו**לקוח). מעל 10 → 400 עם הודעה "לכמויות גדולות פני אל <מייל>".
- הזמנה חייבת לפחות פריט אחד; כתובת חובה אם יש פריט PHYSICAL.
- מוצרים לא פעילים לא ניתנים להזמנה.
- מחיר נלקח **מהשרת**, לא מהלקוח.
- מייל תקין, אורכי שדות מוגבלים, ניקוי HTML ממיילים/הודעות.
- Rate limit: login (5/דקה), contact (3/שעה לכל IP), orders (10/שעה), track (10/דקה).

---

## 8. אבטחת הספרים — ישירות ובכנות

**דרישה:** הספרים לצפייה בלבד, חסומים להורדה.
**המציאות:** אין אפשרות לחסום ב-100% צילום מסך או צילום בטלפון. אפשר להקשות מאוד על הורדה "נוחה":
1. הספר לא נשמר כ-PDF אלא כ**תמונות עמודים** (WebP/JPG) בדלי פרטי. אין קובץ PDF בשום מקום ציבורי.
2. כל עמוד מוגש דרך `GET /api/books/:slug/pages/:n` עם `Cache-Control: no-store`, `Content-Disposition: inline`.
3. סימן מים עדין חוזר על העמוד ("TK Books – למורות בלבד") – נחתך בשרת בזמן ההגשה (sharp).
4. Rate limit על בקשות עמודים (מונע גריפה אוטומטית של כל הספר).
5. בצד React (את): חסימת קליק ימני, גרירה, בחירה, הדפסה (`@media print {display:none}`) – מכשול אבל לא הגנה אמיתית.
6. אין URL ישיר לתמונה שאפשר להעתיק לתמיד (שרת מסנכרן; בלי listing).
7. חשוב: להגיד לבעלת האתר שזו "הגנה סבירה", לא הגנה מוחלטת.

**חומרים חינמיים** (מבחנים/שירים/דפי חזרה): קישור חתום ל-60 שניות.
**מוצרים בתשלום:** קבצים בדלי פרטי נפרד; הורדה רק דרך `DownloadGrant` תקף.

---

## 9. אבטחה כללית

- bcrypt (cost 12), JWT עם תוקף 8 שעות, `JWT_SECRET` ממשתנה סביבה.
- Helmet, CORS מוגדר ל-origin של האתר בלבד (`CORS_ORIGIN`).
- Prisma (מונע SQL injection), Zod על כל קלט.
- הרשאות רק בשרת (middleware `requireAdmin`).
- 401 בלי Token תקין, 403 בלי הרשאה.
- אין חשיפת hash/סודות; `.env` לא ב-ZIP.
- Seed ל-Production: מנהלת נוצרת מ-`ADMIN_EMAIL` / `ADMIN_PASSWORD` במשתני סביבה בלבד.
- העלאות: בדיקת סוג וגודל קובץ (PDF/MP3/JPG/PNG/WebP, עד 25MB).

---

## 10. שני שפות (i18n) — חלוקת אחריות

| נושא | אחראית |
|---|---|
| תוכן דינמי (שמות ספרים, מוצרים, FAQ...) | נשמר בשני שפות במסד; ה-API מחזיר את שני השדות, **React בוחרת** לפי השפה |
| טקסטי ממשק (כפתורים, תוויות) | קבצי `he.json` / `en.json` ב-React (את) |
| מיילים | השרת בונה לפי `preferredLanguage` של ההזמנה |
| RTL/LTR | React: `document.documentElement.dir` ו-`lang` |
| שמירת בחירת שפה | `localStorage` |
| באנר "למורות בלבד" | קבוע בראש האתר בשתי השפות |

---

## 11. מיילים (תבניות בעברית + אנגלית)
1. בקשת הזמנה התקבלה (ללקוחה)
2. הזמנה חדשה (למנהלת)
3. הזמנה אושרה — דיגיטלי: קישורים + "ניתן להוריד ל-3 ימים בלבד"; פיזי: "צפי הגעה 7 ימי עסקים"
4. הזמנה נדחתה
5. הזמנה נשלחה
6. פנייה חדשה (למנהלת) + אישור קבלה ללקוחה

אין צורך בכתובת מייל אישית של בעלת האתר בקוד: `ADMIN_NOTIFY_EMAIL` ו-`SUPPORT_EMAIL` במשתני סביבה.

---

## 12. מבנה תיקיות Backend

```
backend-project/
├─ prisma/ (schema.prisma, migrations/, seed.ts)
├─ src/
│  ├─ app.ts  server.ts
│  ├─ config/ (env.ts, swagger.ts)
│  ├─ routes/ (auth, books, materials, faqs, products, orders, downloads, contact, admin/*)
│  ├─ controllers/
│  ├─ services/ (orderService, downloadService, emailService, storageService, ...)
│  ├─ validation/ (zod schemas)
│  ├─ middleware/ (auth, requireAdmin, errorHandler, rateLimit, upload, validate)
│  ├─ lib/ (prisma.ts, jwt.ts, businessDays.ts, orderCode.ts)
│  └─ docs/ (openapi.ts)
├─ tests/
├─ docs/ (FRONTEND-API-GUIDE.md, openapi.json)
├─ package.json  tsconfig.json  .env.example  .gitignore
├─ render.yaml  README.md  START-HERE.md
```

---

## 13. נתוני Seed (מומצאים)
- מנהלת בדיקה (פיתוח בלבד): `admin@tkbooks.test`.
- 3 ספרים: "Book One / ספר ראשון" וכו' — תבנית.
- לכל ספר: 3 שירים, 2 מבחנים, 2 דפי חזרה, 3 שאלות; + 4 שאלות כלליות.
- 8 מוצרים: כרטיסי תמונות (דיגיטלי), מדריך למורה (דיגיטלי), מדבקות/חותמות (פיזי) וכו'.
- 3 הזמנות לדוגמה (ממתינה/מאושרת/נשלחה) לבדיקת מעקב.
- קבצי דמו קטנים (PDF/PNG ריקים עם טקסט "Sample").

---

## 14. תוכנית בדיקות (Vitest + Supertest)
Login תקין/שגוי · Token חסר/פגום/פג · אורחת לא יכולה CRUD (401/403) · CRUD ספרים/חומרים/מוצרים · ולידציית כמות >10 · הזמנה בלי כתובת עם פיזי · חישוב מחיר בשרת · מעקב עם קוד+מייל שגויים · הורדה אחרי פקיעת 3 ימים (חסומה) · הורדה לפני אישור (חסומה) · חישוב 7 ימי עסקים (דילוג שישי-שבת) · חיפוש/סינון/מיון · Swagger JSON תקין · typecheck + build.

---

## 15. מפת דרכים (סדר עבודה)

**שלב A – אפיון (עכשיו).** אישור המסמך + תשובות לשאלות.
**שלב B – Backend (אני).**
1. אתחול פרויקט, TS strict, Prisma, חיבור PostgreSQL
2. סכמה + Migrations + Seed
3. Auth + JWT + middleware הרשאות
4. Endpoints ציבוריים (ספרים, חומרים, FAQ, מוצרים)
5. הזמנות + מעקב + אישור + DownloadGrant
6. העלאות + Storage + הגשת עמודי ספר מוגנת
7. מיילים
8. Swagger + openapi.json
9. בדיקות + תיקונים
10. render.yaml + START-HERE.md + FRONTEND-API-GUIDE.md + ZIP
**שלב C – Frontend (את, לאורך ה-Swagger):**
1. Vite+TS, i18n, RTL, ערכת צבעים, Layout+באנר
2. דף בית, ספרים, עמוד ספר + לשוניות
3. קורא ספר (תמונות, חסימות)
4. קטלוג + עגלה (Context) + Checkout
5. מעקב + צור קשר + FAQ
6. אזור מנהלת: login, טבלאות, טפסי CRUD, הזמנות
**שלב D – פריסה:** GitHub → Supabase → Render → React ל-Netlify/Vercel → בדיקות קצה.

---

## 16. שאלות פתוחות (תענו על מה שאפשר — השאר אקבע ברירת מחדל)

1. **"המנהלת יכולה לראות את המשתמשים"** — אין משתמשים רשומים. מספיק רשימת לקוחות לפי הזמנות? *(ברירת מחדל: כן)*
2. **"זירון"** — למה התכוונת? (זיכרון/משחק זיכרון? זיפר?)
3. **מה בתשלום ומה חינמי בדיוק?** הבנתי: צפייה בלבד = חינם; מבחנים/שירים/דפי חזרה = חינם להורדה; מדריך למורה, כרטיסי תמונות, תכנים להדפסה = בתשלום (בהזמנה); פיזי = בתשלום. נכון?
4. **מייל התמיכה** לכמויות גדולות ולפניות? (אשים placeholder `support@...`)
5. **ליזי** — יש לך איורים, או נשתמש בתחליף זמני?
6. **מטבע** — ₪?
7. **האם הקישור שנשלח למורות פתוח לכל מי שיש לה קישור, או שתרצי "קוד גישה" פשוט?** *(ברירת מחדל: פתוח, בלי קוד)*
8. **מיילים** — יש לך כבר שירות מייל? *(ברירת מחדל: Resend/Brevo חינמי; אדריך אותך)*
9. **ספרים** — יש לך את הספרים כקובצי PDF כדי להעלות כתמונות עמודים?

---

## 17. התאמה לדרישות החובה של הקורס

| דרישה | מימוש |
|---|---|
| התחברות | מנהלת: login + JWT |
| שני סוגי משתמשים | אורחת / מנהלת |
| אובייקט מרכזי עם 5+ שדות | Product (slug, שם×2, תיאור×2, מחיר, סוג, קטגוריה, תמונות, ספר...) ו-Material |
| רשימה / הוספה / עריכה | קטלוג + אדמין CRUD |
| קטגוריה/סטטוס | kind, category, type, status הזמנה |
| חיפוש/סינון/מיון | `q`, `kind`, `category`, `bookId`, `sort` |
| מסד נתונים אמיתי | PostgreSQL + Prisma |

---

## 18. סיכונים והגבלות כנות
- הגנה על הספרים — חלקית בלבד (פרק 8).
- Render חינמי "נרדם" אחרי חוסר פעילות (פתיחה ראשונה איטית ~30-60 שניות) ומגבלות נוספות משתנות — אאמת בזמן הפריסה.
- Supabase חינמי מושהה אחרי חוסר פעילות ארוכה, ובעל מכסת אחסון.
- ללא תשלום אשראי בשלב זה — כוונה מכוונת; יתווסף בגרסה הבאה.
