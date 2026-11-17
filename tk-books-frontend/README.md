# TK Books – אתר (Frontend)

אתר React + TypeScript (Vite) שמתחבר לשרת `tk-books-backend`.
עברית (RTL) ואנגלית (LTR), עיצוב ורוד-תכלת עם ליזי, אזור מנהלת מלא.

> ראי גם: `DESIGN-PLAN.md` בתיקיית השרת (העיצוב) ו-`FRONTEND-API-GUIDE.md` (ה-API).

## הרצה מקומית

צריך להפעיל **שני** דברים: את השרת ואת האתר.

**1. השרת** (בתיקיית `tk-books-backend`), בשני חלונות טרמינל:
```bash
npm run db:dev          # מסד הנתונים (להשאיר פתוח)
```
```bash
npm run migrate:deploy
npm run seed
npm run dev             # השרת על http://localhost:3000
```

**2. האתר** (בתיקייה הזאת):
```bash
npm install
npm run dev
```
פותחים את **http://localhost:5173**

בפיתוח, Vite מעביר את הקריאות `/api` ו-`/files` לשרת (פורט 3000) לבד, אז אין צורך בהגדרות.

## כניסה לדמו
| | |
|---|---|
| אזור מנהלת | http://localhost:5173/admin → `admin@tkbooks.test` / `Admin123!` (פיתוח בלבד) |
| מעקב הזמנה לדוגמה | `TK-DEMO02` + `demo.approved@example.com` |

## מה יש באתר
**ציבורי:** דף בית · הספרים · עמוד ספר עם לשוניות (צפייה בספר, שירים, מבחנים, דפי חזרה, מדריך למורה, שאלות נפוצות, מוצרים) · קורא ספר (צפייה בלבד, בלי הורדה) · קטלוג עם חיפוש/סינון/מיון · עמוד מוצר · עגלה (עד 10 לפריט + הערת כמויות גדולות) · סיום הזמנה · תשלום (דמה, לא גובה כסף) · מעקב הזמנה (ציר זמן, צפי הגעה, הורדה ל-3 ימים) · שאלות נפוצות · צור קשר · 404 · החלפת שפה עב/EN · באנר "למורות בלבד".

**מנהלת (`/admin`):** התחברות · לוח בקרה · הזמנות (הוזמנה מהספק / נשלחה + מספר מעקב / נמסרה / הארכת הורדה / ביטול / ביטול והחזר) · ספרים (כולל העלאת עמודי הספר) · חומרי למידה · מוצרים (כולל תמונות וקובץ דיגיטלי) · שאלות נפוצות · פניות · לקוחות. הוספה, עריכה ומחיקה לכל דבר.

## מבנה
```
src/
  main.tsx, App.tsx
  api/         client.ts (fetch + Token) + קריאות לשרת: booksApi, productsApi, faqsApi, configApi
  hooks/       React Query: useBooks, useProducts, useFaqs, useConfig
  context/     Cart (localStorage), Auth (JWT), Toast
  routes/      Routes.tsx (כל הנתיבים), ProtectedRoute.tsx (שומר על אזור המנהלת)
  pages/       הדפים הציבוריים
  pages/admin/ דפי המנהלת (התחברות, לוח בקרה, הזמנות, משאבים)
  components/  Layout, AdminLayout, Lizzy, BookCard, ProductCard, MaterialItem
  components/ui/     רכיבי UI קטנים (Modal, Tag, Field, Pagination...) + index.ts
  components/admin/  ResourceManager (CRUD גנרי) ורכיבי ניהול
  types/       api, book, product, order, admin (+ index.ts)
  utils/       format.ts (מחירים, תאריכים, בחירת שפה)
  i18n/        he.json, en.json
  styles/      tokens.css + global.css
public/lizzy/ דמות ליזי (SVG זמני)
```

## פריסה לענן (Netlify / Vercel)
1. מעלים את התיקייה ל-GitHub (בלי `node_modules`).
2. ב-Netlify/Vercel: Build command `npm run build`, Publish/Output directory `dist`.
3. משתנה סביבה: `VITE_API_URL` = כתובת השרת ב-Render (למשל `https://tk-books-api.onrender.com`, בלי `/` בסוף).
4. בשרת (Render): להוסיף את כתובת האתר ל-`CORS_ORIGIN` ול-`FRONTEND_URL`, ו-Deploy מחדש.
5. הקובץ `public/_redirects` דואג שכתובות כמו `/books/book-1` יעבדו גם ברענון (Netlify). ב-Vercel הוסיפי `vercel.json` עם rewrite ל-`/index.html`.

## הערות
- הגנת הספר היא הקשיה בלבד (אין כפתור הורדה, חסימת קליק ימני/גרירה/הדפסה, סימן מים מהשרת). אי אפשר למנוע צילום מסך.
- ה-Token של המנהלת נשמר ב-`localStorage` (מספיק לפרויקט לימודי).
- הגופנים נטענים מ-Google Fonts (Rubik, Assistant).
