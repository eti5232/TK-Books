# TK Books 📚

אתר דו-לשוני (עברית / English) של חומרי לימוד באנגלית למורות: ספרים לצפייה, הורדות חינם, חנות עם עגלה ותשלום (דמה), מעקב הזמנה ואזור ניהול.

```
tk-books-backend/    שרת: Node + Express + TypeScript + Prisma + PostgreSQL
tk-books-frontend/   אתר: React + Vite + TypeScript
```

## מה צריך להתקין
- [Node.js](https://nodejs.org) גרסה 20 ומעלה (מומלץ 22)
- Git

אין צורך להתקין PostgreSQL – יש מסד נתונים מקומי מובנה לפיתוח.

## הרצה מקומית (שלושה חלונות טרמינל)

### שלב 0 – הורדה והתקנה (פעם אחת)
```bash
git clone https://github.com/eti5232/TK-Books.git
cd TK-Books

cd tk-books-backend
npm install
cp .env.example .env
cd ../tk-books-frontend
npm install
```

פתחי את `tk-books-backend/.env` והגדירי לפחות:
- `JWT_SECRET` – מחרוזת ארוכה אקראית (לפחות 32 תווים)
- `ADMIN_EMAIL` ו-`ADMIN_PASSWORD` – פרטי הכניסה של המנהלת
- `SEED_DEMO=true` – כדי לקבל ספרים, מוצרים והזמנות לדוגמה

### שלב 1 – מסד הנתונים (חלון 1, משאירים פתוח)
```bash
cd tk-books-backend
npm run db:dev
```

### שלב 2 – השרת (חלון 2)
בפעם הראשונה בלבד, ליצירת הטבלאות והנתונים:
```bash
cd tk-books-backend
npm run migrate:deploy
npm run seed
```
ואז:
```bash
npm run dev
```
השרת עולה על http://localhost:3000

### שלב 3 – האתר (חלון 3)
```bash
cd tk-books-frontend
npm run dev
```
האתר עולה על http://localhost:5173

## כתובות שימושיות
| מה | כתובת |
|---|---|
| האתר | http://localhost:5173 |
| כניסת מנהלת | http://localhost:5173/admin/login |
| תיעוד API (Swagger) | http://localhost:3000/api-docs |
| בדיקת תקינות השרת | http://localhost:3000/api/health |

## תשלום דמה
בסביבת הפיתוח התשלום הוא הדמיה ולא נגבה כסף אמיתי. כרטיסי בדיקה:
- `4242 4242 4242 4242` – מצליח
- `4000 0000 0000 0002` – נדחה

(תוקף עתידי כלשהו, למשל 12/30, ו-CVV של 3 ספרות.) **אין להקליד כרטיס אשראי אמיתי.**
פרטי הכרטיס לא נשלחים לשרת.

מיילים לא נשלחים באמת עד שמגדירים `SMTP_*` ב-`.env`; עד אז הם מודפסים בחלון של השרת.

## בדיקות
```bash
cd tk-books-backend
npm test
```

## בעיות נפוצות
- **השרת לא מתחבר למסד** – ודאי שחלון 1 (`npm run db:dev`) עדיין רץ.
- **פורט תפוס** – סגרי תהליך ישן שרץ על 3000 / 5173 / 5433.
- **האתר לא מקבל נתונים** – ודאי שהשרת רץ ושב-`tk-books-frontend/.env` השדה `VITE_API_URL` ריק.

פירוט נוסף: `tk-books-backend/README.md`, `tk-books-frontend/README.md`, ומדריך העלאה לאינטרנט ב-`tk-books-backend/START-HERE.md`.
