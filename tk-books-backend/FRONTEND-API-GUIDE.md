# מדריך חיבור ה-React לשרת (TK Books)

> המסמך מיועד לך, כדי שתכתבי בעצמך את צד ה-React. אין בו קוד React.
> המקור המלא והמעודכן של כל ה-API הוא Swagger בכתובת `/api-docs` (ובקובץ `docs/openapi.json`).

## 1. כתובות

| סביבה | Base URL |
|---|---|
| פיתוח מקומי | `http://localhost:3000` |
| ענן (Render) | הכתובת ש-Render נותן, למשל `https://tk-books-api.onrender.com` |

כל ה-Endpoints מתחילים ב-`/api`. מומלץ לשמור את ה-Base URL במשתנה סביבה של Vite (`VITE_API_URL`) כדי להחליף בין פיתוח לענן.
העלייה הראשונה בענן החינמי יכולה לקחת עד דקה (השרת "מתעורר"); כדאי להציג "טוען…" ולא שגיאה.

**CORS:** השרת מאשר רק כתובות שמופיעות ב-`CORS_ORIGIN`. בפיתוח זה `http://localhost:5173` (ברירת המחדל של Vite). כשתעלי את האתר לענן – הוסיפי את כתובתו ל-`CORS_ORIGIN` ב-Render.

## 2. סוגי משתמשים והתחברות

- **אורחת** – כל מי שנכנסת לאתר. בלי הרשמה ובלי התחברות. כל ה-Endpoints הציבוריים פתוחים לה.
- **מנהלת** – מתחברת ב-`POST /api/auth/login`.

### התחברות
```
POST /api/auth/login
{ "email": "admin@tkbooks.test", "password": "Admin123!" }   ← פרטי פיתוח בלבד
```
תשובה 200:
```json
{
  "token": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "admin": { "id": "…", "email": "admin@tkbooks.test", "name": "TK Admin", "role": "ADMIN" }
}
```
- שגיאות: `401 INVALID_CREDENTIALS` (פרטים שגויים), `429` (יותר מ-5 ניסיונות בדקה), `400 VALIDATION_ERROR`.
- התוקף של ה-Token הוא 8 שעות. כשהשרת מחזיר `401` על קריאה של מנהלת – להעביר למסך ההתחברות ולנקות את ה-Token.

### שליחת ה-Token
בכל קריאה ל-`/api/admin/...` ול-`/api/auth/me` מוסיפים Header:
```
Authorization: Bearer <token>
```
- בלי Token / Token לא תקין / פג תוקף → **401**.
- Token תקין בלי הרשאת מנהלת → **403**.
- איפה לשמור את ה-Token? `localStorage` או `sessionStorage` זה פשוט ומספיק לפרויקט לימודי (שימי לב: זו לא ההגנה הכי חזקה שיש).

`GET /api/auth/me` – מחזיר את המנהלת המחוברת (שימושי לבדוק בעת טעינת האתר אם ה-Token עדיין תקף).

## 3. כללים כלליים

### פורמט שגיאה (תמיד אותו מבנה)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "הנתונים שנשלחו אינם תקינים / Invalid input",
             "details": [ { "field": "customerEmail", "message": "Invalid email" } ] } }
```
להצגת שגיאת שדה ליד שדה בטופס – להשתמש ב-`details[].field`. להתנהגות לפי סוג שגיאה – ב-`code` (לא בטקסט ההודעה).

| קוד HTTP | משמעות |
|---|---|
| 200 / 201 / 204 | הצלחה / נוצר / נמחק (בלי תוכן) |
| 400 | קלט לא תקין (`VALIDATION_ERROR` ועוד) |
| 401 | חסר Token או לא תקין / פג תוקף |
| 403 | אין הרשאה |
| 404 | לא נמצא |
| 409 | התנגשות (slug קיים, סטטוס לא מתאים, מוצר שכבר הוזמן) |
| 410 | קישור הורדה פג תוקף |
| 413 | קובץ גדול מדי (מעל 25MB) |
| 429 | יותר מדי בקשות |
| 500 | שגיאת שרת |

### רשימות עם עמודים
פרמטרים: `page` (מ-1) ו-`pageSize`. תשובה:
```json
{ "items": [ ... ], "page": 1, "pageSize": 20, "total": 57, "totalPages": 3 }
```
(רשימות הספרים והשאלות הנפוצות מחזירות רק `{ "items": [...] }`.)

### שתי שפות
השרת מחזיר תמיד את שני השדות (`titleHe` ו-`titleEn`, `nameHe` ו-`nameEn`…). **את** בוחרת מה להציג לפי השפה הנוכחית ב-i18n. מיילים נשלחים בשפה שבחרה הלקוחה בהזמנה (`preferredLanguage`: `"he"` או `"en"`).
טקסטי הממשק (כפתורים, תוויות) הם קבצי התרגום שלך ב-React.
הבאנר "החומרים באתר זה למורות בלבד" הוא חלק מה-React.

### כסף
כל המחירים הם **באגורות** (שלם). `2500` = ₪25.00. להציג: `(priceAgorot / 100).toFixed(2)`. המטבע `ILS`.

### תמונות
שדות כמו `coverImageUrl` ו-`images[].url` הם כתובות מלאות – אפשר לשים ישירות ב-`<img src>`.

### הגדרות ציבוריות
`GET /api/config` → `{ "supportEmail": "support@example.com", "maxItemQuantity": 10, "downloadValidDays": 3, "deliveryBusinessDays": 7, "currency": "ILS" }`. כדאי לקרוא פעם אחת בעת טעינת האתר – משם לוקחים את מייל התמיכה להערה בעגלה.

## 4. אילו Endpoints לכל מסך

### אזור ציבורי

| מסך | Endpoints |
|---|---|
| דף בית | `GET /api/books` (3 הספרים), `GET /api/faqs?scope=general` (אופציונלי) |
| כל הספרים | `GET /api/books` |
| עמוד ספר (כותרת ותתי-לשוניות) | `GET /api/books/{slug}` – כולל `materialCounts`, `faqCount`, `productCount`, `pageCount` |
| לשונית: צפייה בספר | `GET /api/books/{slug}/pages/{n}` ל-n = 1…`pageCount` |
| לשונית: שירים / מבחנים / דפי חזרה / מדריך למורה | `GET /api/books/{slug}/materials?type=SONG` (או `TEST`, `REVIEW_SHEET`, `TEACHER_GUIDE`) |
| הורדת חומר חינמי | קישור/כפתור אל `downloadUrl` שמגיע בכל חומר (או `GET /api/materials/{id}/download`) |
| לשונית: שאלות נפוצות של ספר | `GET /api/faqs?bookSlug={slug}&includeGeneral=true` |
| לשונית: מוצרים של ספר | `GET /api/products?bookSlug={slug}` |
| שאלות נפוצות (כלליות) | `GET /api/faqs?scope=general` או `GET /api/faqs` (הכול) |
| קטלוג מוצרים | `GET /api/products?kind=&category=&q=&sort=&page=` |
| עמוד מוצר | `GET /api/products/{slug}` |
| עגלה | **מנוהלת אצלך ב-React בלבד** (ראי סעיף 6) |
| סיום הזמנה | `POST /api/orders` |
| מעקב הזמנה | `POST /api/orders/track` |
| צור קשר | `POST /api/contact` |

### אזור מנהלת (כולם עם Bearer Token)

| מסך | Endpoints |
|---|---|
| התחברות | `POST /api/auth/login` |
| לוח בקרה | `GET /api/admin/stats` |
| ספרים | `GET/POST /api/admin/books`, `GET/PUT/DELETE /api/admin/books/{id}` |
| עמודי ספר (העלאה/מחיקה) | `POST /api/admin/books/{id}/pages`, `DELETE /api/admin/books/{id}/pages/{n}` |
| חומרי למידה | `GET/POST /api/admin/materials`, `GET/PUT/DELETE /api/admin/materials/{id}` |
| שאלות נפוצות | `GET/POST /api/admin/faqs`, `PUT/DELETE /api/admin/faqs/{id}` |
| מוצרים | `GET/POST /api/admin/products`, `GET/PUT/DELETE /api/admin/products/{id}` |
| העלאת קבצים ותמונות | `POST /api/admin/uploads` |
| הזמנות | `GET /api/admin/orders`, `GET /api/admin/orders/{id}`, `PATCH …/mark-ordered`, `…/ship` (גוף: `trackingNumber` אופציונלי), `…/deliver`, `…/cancel` (רק הזמנה שלא שולמה), `…/refund` (ביטול + החזר), `POST …/extend-download` |
| "משתמשים" (לקוחות) | `GET /api/admin/customers` |
| פניות | `GET /api/admin/contact-messages`, `PATCH/DELETE /api/admin/contact-messages/{id}` |

## 5. מבני נתונים ודוגמאות

### ספר (Book)
```json
{ "id": "uuid", "slug": "book-1", "titleHe": "ספר ראשון", "titleEn": "Book One",
  "descriptionHe": "…", "descriptionEn": "…", "coverImageUrl": "https://…/covers/book-1.png",
  "sortOrder": 1, "pageCount": 6 }
```
`GET /api/books/{slug}` מוסיף: `"materialCounts": { "SONG": 3, "TEST": 2, "REVIEW_SHEET": 2, "TEACHER_GUIDE": 1 }, "faqCount": 6, "productCount": 3`.
בניהול (`/api/admin/books`) יש גם `isActive`, `coverImageKey`, `counts`.

### חומר למידה (Material)
```json
{ "id": "uuid", "bookId": "uuid", "type": "SONG", "titleHe": "שיר 1", "titleEn": "Song 1",
  "descriptionHe": "", "descriptionEn": "", "unit": 1, "sortOrder": 1,
  "mediaUrl": null, "lyricsHe": null, "lyricsEn": "…", "hasFile": true,
  "downloadUrl": "https://…/api/materials/uuid/download" }
```
`type` הוא אחד מ: `SONG` שיר · `TEST` מבחן · `REVIEW_SHEET` דף חזרה · `TEACHER_GUIDE` מדריך למורה. **כולם חינמיים.**
`mediaUrl` – קישור לסרטון (למשל YouTube) אם יש. `hasFile=false` → אין קובץ להורדה, להסתיר כפתור הורדה.

### שאלה נפוצה (Faq)
`{ "id", "bookId": null | "uuid", "questionHe", "questionEn", "answerHe", "answerEn", "sortOrder" }` — `bookId: null` = שאלה כללית.

### מוצר (Product)
```json
{ "id": "uuid", "slug": "flashcards-book-1", "bookId": "uuid", "book": { "slug": "book-1", "titleHe": "…", "titleEn": "…" },
  "kind": "DIGITAL", "category": "FLASHCARDS",
  "nameHe": "כרטיסי תמונות – ספר 1", "nameEn": "Picture Flashcards - Book 1",
  "descriptionHe": "…", "descriptionEn": "…", "priceAgorot": 2500, "currency": "ILS",
  "images": [ { "url": "https://…/products/x.png", "altHe": "", "altEn": "" } ] }
```
- `kind`: `DIGITAL` (קובץ שמורידים אחרי תשלום) או `PHYSICAL` (נשלח בדואר).
- `category`: `FLASHCARDS` כרטיסי תמונות · `SONGBOOK` שירון · `PRINTABLES` תכנים להדפסה · `STICKERS` מדבקות · `STAMPS` חותמות · `OTHER`.
- ⚠️ המדריך למורה **אינו** מוצר – הוא חומר חינמי (`TEACHER_GUIDE`).
- מוצר דיגיטלי **לא** ניתן להורדה מהקטלוג. רק אחרי הזמנה שהמנהלת אישרה.

### הזמנה – יצירה
```
POST /api/orders
```
```json
{
  "customerName": "דנה כהן",
  "customerEmail": "dana@example.com",
  "customerPhone": "050-0000000",
  "preferredLanguage": "he",
  "shippingAddress": { "street": "הרצל 1", "city": "חיפה", "zip": "3300000" },
  "notes": "",
  "items": [ { "productId": "uuid", "quantity": 2 } ]
}
```
| שדה | חובה? | כללים |
|---|---|---|
| `customerName` | ✅ | 2–100 תווים |
| `customerEmail` | ✅ | מייל תקין (נשמר באותיות קטנות) |
| `customerPhone` | ❌ | ספרות, רווחים, `+ - ( )` |
| `preferredLanguage` | ❌ | `he` (ברירת מחדל) או `en` – שפת המיילים |
| `shippingAddress` | ✅ **רק אם יש מוצר פיזי** | `street`, `city` חובה; `zip` אופציונלי |
| `notes` | ❌ | עד 1000 תווים |
| `items[]` | ✅ | לפחות פריט אחד; `quantity` שלם **1–10** |

**שימי לב:** המחיר נקבע בשרת – אל תשלחי מחיר.

תשובה **201**:
```json
{ "code": "TK-7F3K9Q", "status": "PENDING", "totalAgorot": 5000, "currency": "ILS", "requiresShipping": false, "paymentMode": "fake" }
```
ההזמנה נוצרת בסטטוס `PENDING` = **ממתינה לתשלום**. אין מייל ואין התראה למנהלת עד שהלקוחה משלמת. מעבירים אותה לעמוד התשלום (ראי למטה).

### תשלום (דמה)
```
POST /api/orders/pay-demo
{ "code": "TK-7F3K9Q", "email": "dana@example.com", "outcome": "success" }
```
- **לא גובה כסף.** זמין רק כש-`PAYMENT_DRIVER=fake` (אחרת `404`). `outcome: "fail"` מדמה כשל: `400 PAYMENT_FAILED` וההזמנה נשארת `PENDING` (אפשר לנסות שוב).
- בהצלחה מוחזר אותו מבנה כמו במעקב הזמנה (עם קישורי הורדה). מוצר דיגיטלי בלבד → `DELIVERED` מיד. עם מוצר פיזי → `PAID` + צפי הגעה (7 ימי עסקים מהתשלום).
- נשלחים מייל ללקוחה ומייל התראה למנהלת (`ADMIN_NOTIFY_EMAIL`). קריאה חוזרת לא משכפלת קישורים או מיילים.
- בהזמנה שבוטלה/הוחזרה → `409 INVALID_STATUS`.
- `GET /api/config` מחזיר `paymentMode` (כרגע תמיד `fake`).
- **בייצור** השרת מסרב לעלות עם `PAYMENT_DRIVER=fake` אלא אם הוגדר `ALLOW_FAKE_PAYMENTS_IN_PRODUCTION=true` (אחרת כל אחת הייתה מקבלת מוצרים בחינם).
- חברת סליקה אמיתית: דף תשלום מתארח + webhook שקורא ל-`orderService.markPaid` (ראי `paymentService.ts`). פרטי אשראי אף פעם לא עוברים בשרת.

שגיאות אפשריות: `400 VALIDATION_ERROR` על `items.N.quantity` (כמות מעל 10 – ההודעה כבר כוללת את מייל התמיכה), `400 QUANTITY_TOO_HIGH` (אותו מוצר פעמיים שמצטבר מעל 10), `400 SHIPPING_ADDRESS_REQUIRED`, `400 PRODUCT_UNAVAILABLE`, `400 VALIDATION_ERROR`, `429`.

### מעקב הזמנה
```
POST /api/orders/track
{ "code": "TK-7F3K9Q", "email": "dana@example.com" }
```
תשובה **200**:
```json
{
  "code": "TK-7F3K9Q",
  "status": "SHIPPED",
  "createdAt": "2026-01-04T10:00:00.000Z",
  "paidAt": "2026-01-04T10:05:00.000Z",
  "orderedAt": "2026-01-05T08:00:00.000Z",
  "shippedAt": "2026-01-06T08:00:00.000Z", "deliveredAt": null,
  "trackingNumber": "RR123456789IL",
  "canPay": false,
  "estimatedDeliveryAt": "2026-01-14T08:00:00.000Z",
  "hasPhysicalItems": true,
  "deliveryLate": false,
  "statusNote": null,
  "contactPath": "/contact?order=TK-7F3K9Q",
  "supportEmail": "support@example.com",
  "totalAgorot": 5000, "currency": "ILS",
  "items": [
    { "nameHe": "…", "nameEn": "…", "kind": "DIGITAL", "quantity": 1, "unitPriceAgorot": 2500, "lineTotalAgorot": 2500,
      "download": { "url": "https://…/api/downloads/<token>", "expiresAt": "2026-01-08T08:00:00.000Z", "expired": false, "downloadsLeft": 10 } },
    { "nameHe": "…", "kind": "PHYSICAL", "quantity": 2, "download": null }
  ]
}
```
- אם הקוד או המייל לא נכונים → `404 ORDER_NOT_FOUND` (אותה הודעה בשני המקרים, בכוונה).
- `status` – ערכים ותצוגה מוצעת:

| status | מה להציג |
|---|---|
| `PENDING` | ממתינה לתשלום (`canPay: true` – להציג כפתור מעבר לתשלום) |
| `PAID` | שולמה – בטיפול, צפי הגעה `estimatedDeliveryAt` (7 ימי עסקים) |
| `ORDERED` | הוזמנה מהספק |
| `SHIPPED` | נשלחה (+ `trackingNumber` אם הוזן) |
| `DELIVERED` | נמסרה (הזמנה דיגיטלית בלבד עוברת ישר לכאן אחרי התשלום) |
| `CANCELLED` | בוטלה לפני תשלום (+ `statusNote`) |
| `REFUNDED` | בוטלה והוחזר כסף (+ `statusNote`) |

(`APPROVED` / `REJECTED` נשארו בסכמה לתאימות בלבד ואינם בשימוש.)

- `deliveryLate: true` → החבילה עברה את הצפי: להציג הודעה וכפתור/קישור לטופס פנייה: `contactPath` (מכיל את קוד ההזמנה, אפשר למלא אותו מראש בטופס).
- `download` קיים רק בפריט דיגיטלי ששולם. להציג כפתור הורדה וליד הטקסט: **"ניתן להוריד ל-3 ימים בלבד"** + תאריך `expiresAt`. אם `expired: true` – להציג "הקישור פג, פני אלינו".

### הורדת מוצר דיגיטלי
`GET <download.url>` – אפשר פשוט להפנות את הדפדפן לכתובת (קישור `<a href>`). הקישור גם נשלח במייל אחרי התשלום.
שגיאות: `410 DOWNLOAD_EXPIRED`, `403 DOWNLOAD_REVOKED` (בוטל), `403 DOWNLOAD_LIMIT_REACHED` (מעל 10 הורדות), `404`.

### טופס פנייה
```
POST /api/contact
{ "name": "דנה", "email": "dana@example.com", "subject": "החבילה לא הגיעה",
  "message": "עברו 7 ימי עסקים…", "orderCode": "TK-7F3K9Q" }
```
| שדה | חובה | כללים |
|---|---|---|
| `name` | ✅ | 2–100 |
| `email` | ✅ | מייל תקין |
| `subject` | ✅ | 2–200 |
| `message` | ✅ | 5–3000 |
| `orderCode` | ❌ | `TK-XXXXXX` |
תשובה 201: `{ "id": "…", "status": "NEW" }`. מוגבל ל-5 פניות בשעה (`429`).

### התחברות – שדות חובה בטופס
`email` (מייל תקין), `password` (לא ריק).

## 6. עגלה (בצד ה-React בלבד)

השרת לא שומר עגלה. את שומרת בעגלה (Context + `localStorage`) רק: `productId`, `quantity`, ולנוחות גם שם/מחיר/תמונה להצגה.
- כמות מקסימלית **10** לפריט; להציג **הערה בולטת**: "לכמויות גדולות פני אל <מייל התמיכה>" (את מייל התמיכה ואת המגבלה אפשר לקבל מ-`GET /api/config`).
- כשהמשתמשת שולחת – ממירים את העגלה לגוף `POST /api/orders`.
- אחרי הצלחה – מרוקנים את העגלה ומציגים את `code`.
- אם יש בעגלה מוצר `PHYSICAL` – להציג שדות כתובת (חובה).

## 7. קורא הספר (צפייה בלבד)

- מספר העמודים: `pageCount` של הספר.
- כל עמוד הוא תמונה: `GET /api/books/{slug}/pages/{n}` (n מתחיל ב-1) – אפשר לשים ב-`<img src>`.
- התמונה מגיעה עם סימן מים ובלי שמירה במטמון; השרת מגביל ל-120 בקשות בדקה (שלא יטענו הכול בבת אחת – טענו עמוד נוכחי והבא אחריו בלבד).
- אין Endpoint להורדת הספר כקובץ, ובכוונה.
- מומלץ גם ב-React: לחסום קליק ימני וגרירה על התמונות ולהסתיר אותן בהדפסה (`@media print`). זו הקשיה בלבד – אי אפשר למנוע צילום מסך.
- `404 PAGE_NOT_FOUND` = עמוד שלא קיים.

## 8. אזור מנהלת – פרטים

### רשימות
כל רשימת ניהול תומכת ב-`page`, `pageSize`, `q` (חיפוש) ובסינונים (`status`, `type`, `kind`, `bookId`…). הרשימות כוללות גם פריטים מוסתרים (`isActive: false`).

### העלאת קבצים ותמונות (2 שלבים)
1. `POST /api/admin/uploads` בפורמט `multipart/form-data` עם השדות: `file` (הקובץ), `area` (`public` לתמונות שמוצגות באתר / `private` לקבצי הורדה), `folder` (למשל `covers`, `products`, `materials`).
   תשובה: `{ "area": "public", "key": "covers/3f2a….png", "url": "https://…", "size": 12345, "contentType": "image/png" }`
2. את ה-`key` שחזר שמים בשדה המתאים ביצירה/עריכה:

| מה | שדה | area |
|---|---|---|
| כריכת ספר | `coverImageKey` (ב-Book) | public |
| תמונות מוצר | `images: [{ "key", "altHe", "altEn" }]` | public |
| קובץ להורדה של חומר חינמי | `fileKey` (ב-Material) | private |
| קובץ של מוצר דיגיטלי | `digitalFileKey` (ב-Product) | private |

סוגי קבצים מותרים: PDF, MP3, M4A, MP4, PNG, JPG, WEBP, ZIP. עד 25MB. באזור `public` – תמונות בלבד.

### עמודי ספר
`POST /api/admin/books/{id}/pages` – `multipart/form-data`, שדה `pages` (אפשר לבחור כמה תמונות יחד: PNG/JPG/WEBP), ושדה אופציונלי `replace=true` למחיקת העמודים הקיימים לפני ההעלאה. הסדר = סדר הקבצים שנשלחו.

### יצירת/עריכת ספר – שדות
`titleHe`✅ `titleEn`✅ `descriptionHe` `descriptionEn` `slug` (אופציונלי; באותיות אנגליות קטנות ומקפים) `coverImageKey` `sortOrder` `isActive`.
בעריכה (`PUT`) אפשר לשלוח רק את השדות שמשנים.

### חומר – שדות
`bookId`✅ `type`✅ (`SONG`/`TEST`/`REVIEW_SHEET`/`TEACHER_GUIDE`) `titleHe`✅ `titleEn`✅ `descriptionHe/En` `unit` `sortOrder` `fileKey` `mediaUrl` (כתובת URL תקינה) `lyricsHe/En` `isActive`.

### שאלה נפוצה – שדות
`questionHe`✅ `questionEn`✅ `answerHe`✅ `answerEn`✅ `bookId` (ריק = כללית) `sortOrder` `isActive`.

### מוצר – שדות
`kind`✅ `nameHe`✅ `nameEn`✅ `priceAgorot`✅ (מספר שלם, 0 ומעלה) `category` `descriptionHe/En` `bookId` `slug` `digitalFileKey` (**חובה כש-`kind=DIGITAL`**) `images[]` `isActive`.
- ב-`PUT`: אם שולחים `images` – הרשימה מחליפה את כל התמונות הקיימות.
- מחיקת מוצר שכבר הוזמן → `409 PRODUCT_IN_USE`. במקום זה להסתיר: `PUT` עם `"isActive": false`.

### ניהול הזמנות
זרימת סטטוסים:
```
PENDING ──(תשלום)──▶ PAID ──mark-ordered──▶ ORDERED ──ship──▶ SHIPPED ──deliver──▶ DELIVERED
   │                    └──────────ship (אפשר גם ישר)──────────▲
   └──cancel──▶ CANCELLED          PAID/ORDERED/SHIPPED/DELIVERED ──refund──▶ REFUNDED
```
אין יותר אישור ידני: ההזמנה נפתחת מיד כשהתשלום מתקבל. מוצר דיגיטלי בלבד עובר ישר ל-`DELIVERED`.
- **תשלום** (בצד הלקוחה): יוצר קישורי הורדה (3 ימים) למוצרים דיגיטליים, מחשב צפי הגעה (7 ימי עסקים, שישי ושבת לא נספרים) אם יש מוצר פיזי, ושולח מייל ללקוחה ומייל התראה למנהלת.
- **mark-ordered**: `PAID → ORDERED` (סימון שהוזמן מהספק).
- **ship**: `PAID/ORDERED → SHIPPED`, גוף אופציונלי `{ "trackingNumber": "…" }`, נשלח מייל ללקוחה.
- **cancel**: רק הזמנה שלא שולמה. **refund**: הזמנה ששולמה → `REFUNDED`, מבטל את קישורי ההורדה ושולח מייל. גוף אופציונלי `{ "reason": "…" }`. (בדמה אין כסף אמיתי להחזיר.)
- בלוח הבקרה `pendingOrders` = הזמנות ב-`PAID`/`ORDERED` (ממתינות לטיפול שלך).
- **extend-download**: מאריך את כל קישורי ההורדה של ההזמנה ב-3 ימים נוספים.
- פעולה שלא מתאימה לסטטוס הנוכחי → `409 INVALID_STATUS` (להציג הודעה, ולהסתיר כפתורים לא רלוונטיים לפי `status`).
- חיפוש: `GET /api/admin/orders?status=PAID&q=<קוד/שם/מייל>`.

### "משתמשים"
אין הרשמה באתר, לכן `GET /api/admin/customers` מחזיר לקוחות לפי הזמנות: `{ email, name, phone, ordersCount, totalAgorot, lastOrderAt }`.

## 9. נתוני הדגמה לבדיקה
(קיימים רק אם `SEED_DEMO` פעיל; בפיתוח – תמיד)

| מה | ערך |
|---|---|
| מנהלת (פיתוח בלבד!) | `admin@tkbooks.test` / `Admin123!` |
| ספרים | `book-1`, `book-2`, `book-3` (6 עמודי דמו לכל ספר) |
| מעקב – ממתינה | קוד `TK-DEMO01` + `demo.pending@example.com` |
| מעקב – דיגיטלית ששולמה (עם קישור הורדה) | `TK-DEMO02` + `demo.approved@example.com` |
| מעקב – נשלחה | `TK-DEMO03` + `demo.shipped@example.com` |

כל התוכן הוא דמו (תמונות ו-PDF עם הכיתוב DEMO) – יוחלף בתוכן האמיתי (ראי `docs/REPLACE-DEMO-CONTENT.md`).
