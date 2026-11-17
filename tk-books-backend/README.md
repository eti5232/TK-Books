# TK Books – Backend

שרת (API) לאתר **TK Books**: חומרי לימוד באנגלית למורות. ספרים לצפייה בלבד, חומרים חינמיים להורדה (שירים, מבחנים, דפי חזרה, מדריך למורה), קטלוג מוצרים והזמנות שהמנהלת מאשרת.

**טכנולוגיות:** Node.js 22 · Express · TypeScript (strict) · PostgreSQL · Prisma · Zod · JWT · bcrypt · Swagger/OpenAPI 3 · Vitest.

> 👉 אם את מתחילה ורוצה להעלות לאינטרנט: פתחי את **[START-HERE.md](START-HERE.md)**.
> 👉 לכתיבת ה-React: **[FRONTEND-API-GUIDE.md](FRONTEND-API-GUIDE.md)**.
> 👉 להחלפת תוכן הדמו בתוכן האמיתי: **[docs/REPLACE-DEMO-CONTENT.md](docs/REPLACE-DEMO-CONTENT.md)**.

## מה בפנים

```
src/
  app.ts, server.ts   הרכבת האפליקציה והפעלה
  config/        הגדרות סביבה (env.ts)
  db/            חיבור ל-Prisma
  auth/          JWT
  middleware/    authenticate, authorize, validate, error-handler, rate-limit, upload
  modules/       כל נושא בתיקייה משלו, ובה 4 קבצים:
                   x.routes.ts      הנתיבים (ציבורי + ניהול)
                   x.controller.ts  קבלת בקשה → קריאה ל-service → תשובה
                   x.service.ts     הלוגיקה העסקית
                   x.schemas.ts     סכמות Zod לבדיקת קלט
                 auth · books · materials · faqs · products · orders · downloads · contact · admin · health
  services/      שירותים משותפים: storage, email, email-templates, payment
  utils/         app-error, async-handler, business-days, order-code, validation
  docs/          מפרט OpenAPI (Swagger)
  seed/          נתוני הדגמה + יצירת מנהלת
prisma/          schema.prisma + migrations
tests/           בדיקות אוטומטיות
docs/            openapi.json, REPLACE-DEMO-CONTENT.md
design/          tokens.css + דמות ליזי (SVG זמני) – ראי DESIGN-PLAN.md
```

## הרצה מקומית (ווינדוס / מק / לינוקס)

דרישות: **Node.js 20 ומעלה** (מומלץ 22 LTS) ו-npm.

```bash
npm install
```
העתיקי את `.env.example` לקובץ בשם `.env` (אפשר להשאיר את הערכים כמו שהם לפיתוח).

**חלון טרמינל 1 – מסד נתונים לפיתוח** (PostgreSQL אמיתי, בלי להתקין כלום; בפעם הראשונה מוריד קבצים):
```bash
npm run db:dev
```
**חלון טרמינל 2:**
```bash
npm run migrate:deploy
npm run seed
npm run dev
```
- שרת: http://localhost:3000
- Swagger: http://localhost:3000/api-docs
- בדיקת בריאות: http://localhost:3000/api/health

אם יש לך PostgreSQL אחר (או Docker) – פשוט שני את `DATABASE_URL` ב-`.env` ואת צעד `db:dev` דלגי.

### פרטי פיתוח (לא לשימוש בענן!)
| | |
|---|---|
| מנהלת | `admin@tkbooks.test` / `Admin123!` |
| קודי מעקב לדוגמה | `TK-DEMO01` + `demo.pending@example.com`, `TK-DEMO02` + `demo.approved@example.com` (דיגיטלית ששולמה), `TK-DEMO03` + `demo.shipped@example.com` |

בענן (`NODE_ENV=production`) אין סיסמה קבועה: המנהלת נוצרת רק מ-`ADMIN_EMAIL` ו-`ADMIN_PASSWORD` שמגדירים במשתני הסביבה (סיסמה של 10 תווים לפחות).

## סקריפטים

| פקודה | מה עושה |
|---|---|
| `npm run dev` | שרת פיתוח עם רענון אוטומטי |
| `npm run build` | `prisma generate` + קומפילציה ל-`dist/` |
| `npm start` | מפעיל את `dist/server.js` |
| `npm run start:prod` | Migrations + Seed + הפעלה (זה מה ש-Render מריץ) |
| `npm run typecheck` | בדיקת טיפוסים (TypeScript strict) |
| `npm test` | כל הבדיקות (מרים מסד PostgreSQL זמני לבד) |
| `npm run seed` | מנהלת + נתוני הדגמה |
| `npm run openapi` | מייצא `docs/openapi.json` |
| `npm run migrate:dev` | יצירת Migration חדש אחרי שינוי ב-`schema.prisma` |

## משתני סביבה
כולם מוסברים ב-[.env.example](.env.example). החשובים: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STORAGE_DRIVER` (+ `SUPABASE_*`), `SMTP_*`, `SUPPORT_EMAIL`.

## איך זה עובד (בקצרה)

- **אורחת** = ללא התחברות. **מנהלת** = JWT (`POST /api/auth/login`). ההרשאות נבדקות בשרת; המנהלת נקבעת לפי ה-Token בלבד.
- **ספרים** נשמרים כתמונות עמודים בדלי פרטי ומוגשים דרך `GET /api/books/{slug}/pages/{n}` עם סימן מים ובלי מטמון. אין Endpoint להורדת הספר. (אי אפשר למנוע צילום מסך – זה הקשיה, לא הגנה מוחלטת.)
- **חומרים חינמיים** (שיר/מבחן/דף חזרה/מדריך למורה) – הורדה פתוחה.
- **מוצרים** – הלקוחה מזמינה ומשלמת מיד (כרגע **תשלום דמה**: לא נגבה כסף; חברת סליקה אמיתית תתווסף בהמשך). אין אישור ידני: אחרי התשלום מוצר דיגיטלי מקבל קישור הורדה ל-**3 ימים** (במייל ובמעקב ההזמנה), מוצר פיזי מקבל צפי הגעה של **7 ימי עסקים**, והמנהלת מקבלת מייל התראה. היא מזמינה מהספק, מסמנת "נשלחה" (עם מספר מעקב) ו"נמסרה". אפשר גם לבטל ולהחזיר כסף.
- **תשלום דמה בענן:** השרת מסרב לעלות בייצור עם `PAYMENT_DRIVER=fake` (כל אחת הייתה מקבלת מוצרים בחינם). לבדיקה בענן בלבד אפשר להגדיר `ALLOW_FAKE_PAYMENTS_IN_PRODUCTION=true`.
- **מעקב הזמנה** – קוד הזמנה + מייל (בלי חשבון).
- **מיילים** – SMTP. בלי הגדרת SMTP המיילים לא נשלחים אלא נרשמים בטבלת `EmailLog` ובלוג (שימושי בפיתוח).
- **אחסון קבצים** – `local` (תיקיית `uploads/`, לפיתוח בלבד) או `supabase` (לענן).

## מגבלות ידועות
- אין תשלום באשראי (בכוונה). המבנה מאפשר להוסיף בעתיד.
- 7 ימי עסקים = ראשון–חמישי; חגים לא נספרים.
- אין המרת PDF לתמונות בשרת: את עמודי הספר מעלים כתמונות (ראי `docs/REPLACE-DEMO-CONTENT.md`).
- בדיקת מול Supabase אמיתי ושליחת מייל אמיתית לא בוצעו בפיתוח (אין חשבון); ראי START-HERE.md.
- מסד הפיתוח המקומי (`db:dev`) עלול להשתמש בקידוד שאינו UTF-8 בווינדוס בעברית, ולכן אימוג'י בתוכן לא יישמרו מקומית. מסד הענן (Supabase) הוא UTF-8 ולא מושפע.
