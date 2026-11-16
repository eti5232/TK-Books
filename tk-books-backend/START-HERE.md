# START-HERE – מהמחשב שלך לאינטרנט, צעד אחר צעד

המדריך הזה מיועד למי שמעולם לא העלתה שרת לאינטרנט. קחי אותו לאט, צעד אחרי צעד.

> ⚠️ **חשוב לדעת:** אתרי GitHub, Supabase ו-Render משנים את העיצוב ושמות הכפתורים מדי פעם. כתבתי את שמות הכפתורים כפי שהם מוכרים לי, **אבל לא יכולתי לפתוח את האתרים ולוודא שהם עדיין מדויקים היום**. אם כפתור נקרא קצת אחרת – חפשי כפתור דומה. אם משהו ממש לא מתאים, כתבי לי ואעדכן.
> ⚠️ גם מסלולים "חינמיים" משתנים. לפני שאת נרשמת, בדקי בעמוד התמחור של כל שירות מה כלול היום בחינם ומה המגבלות.

## מה אנחנו מעלים ולאן

```
 [ GitHub ]        ← שומר את הקוד שלך (ובו Render קורא)
     │
 [ Render ]        ← מריץ את השרת (ה-Backend) באינטרנט
     │
 [ Supabase ]      ← מסד הנתונים (PostgreSQL) + אחסון הקבצים (ספרים, PDF, תמונות)
```
בנוסף, בהמשך, אתר ה-React שתכתבי יעלה לשירות אחר (למשל Netlify או Vercel), ואז נחבר אותו לשרת (חלק ו').

מה שתצטרכי להכין בדרך (תרשמי בצד, במקום בטוח – לא בקובץ שמעלים ל-GitHub!):
- סיסמת מסד הנתונים (Supabase)
- כתובת החיבור למסד (`DATABASE_URL`)
- מפתח Supabase (`SUPABASE_SERVICE_KEY`) – סודי!
- מייל וסיסמה למנהלת האתר

---

## חלק א – GitHub (שמירת הקוד)

### 1. פתיחת חשבון
1. היכנסי ל-**github.com** ולחצי **Sign up**.
2. מייל → סיסמה → שם משתמש → אימות (פאזל קטן / קוד במייל).
3. אשרי את המייל שהגיע אלייך.

### 2. יצירת Repository (תיקיית פרויקט ב-GitHub)
1. בפינה למעלה: כפתור **+** → **New repository**.
2. **Repository name**: `tk-books-backend`.
3. בחרי **Private** (פרטי – רק את רואה). *(Render יכול לקרוא גם repository פרטי אחרי שתחברי אותו.)*
4. **אל** תסמני "Add a README", "Add .gitignore" או "license" – יש לנו כבר.
5. לחצי **Create repository**.

### 3. חילוץ ה-ZIP
1. מצאי את הקובץ `tk-books-backend.zip` שהורדת.
2. קליק ימני → **Extract All… / חלץ הכל** → **Extract**.
3. תיווצר תיקייה `backend-project`. תוכן התיקייה: `src`, `prisma`, `tests`, `docs`, `package.json`, `render.yaml`, `README.md`, `START-HERE.md` ועוד.

> חשוב: בווינדוס חלק מהקבצים מוסתרים (`.gitignore`, `.env.example`). ב-Explorer: **View / תצוגה** → סמני **Hidden items / פריטים מוסתרים** כדי שיופיעו ותוכלי להעלות גם אותם.

### 4. העלאת הקבצים דרך הדפדפן
1. בעמוד ה-repository הריק, לחצי על הקישור **uploading an existing file**.
2. פתחי את תיקיית `backend-project`, סמני **את כל מה שבתוכה** (Ctrl+A) וגרור לחלון הדפדפן.
   - **חשוב:** גוררים את **התוכן** של התיקייה (לא את התיקייה עצמה), כך ש-`package.json` יהיה בשורש.
3. GitHub מגביל העלאה בדפדפן לכמות קבצים מסוימת בבת אחת (כ-100). אם הוא מתלונן – העלי בכמה סבבים: קודם `src`, אחר כך `prisma`, `tests`, `docs` והקבצים הבודדים. אחרי כל סבב לחצי **Commit changes**.
4. בסוף: **Commit changes** (אפשר להשאיר את הכיתוב כמו שהוא).

### 5. בדיקה שהכל עלה
בעמוד ה-repository צריך לראות: התיקיות `src`, `prisma`, `tests`, `docs` והקבצים `package.json`, `package-lock.json`, `render.yaml`, `README.md`, `.gitignore`, `.env.example`, `tsconfig.json`.
- **אסור** שיופיעו: `.env` (עם סודות), `node_modules`, `uploads`. אם העלית בטעות `.env` – מחקי אותו מ-GitHub והחליפי את כל הסיסמאות שהיו בו.
- נכנסים ל-`src/app.ts` – אמור להיפתח קוד. מצוין.

---

## חלק ב – Supabase (מסד נתונים + אחסון קבצים)

### 1. חשבון
1. היכנסי ל-**supabase.com** → **Start your project / Sign in** → הירשמי (אפשר עם GitHub).

### 2. יצירת Project (= מסד הנתונים)
1. **New project** (אולי תצטרכי קודם ליצור Organization – שם חופשי, תוכנית Free).
2. **Name**: `tk-books`.
3. **Database Password**: לחצי **Generate a password** או בחרי חזקה, **ושמרי אותה בצד** (לא תוכלי לראות אותה שוב).
4. **Region**: בחרי אזור קרוב לרנדר (למשל **Frankfurt / Central EU**). *(כדאי שיהיה אותו אזור כמו ב-`render.yaml`: frankfurt.)*
5. **Create new project** והמתיני כמה דקות עד שהסטטוס מוכן.

### 3. קבלת Connection String (כתובת החיבור למסד)
1. בראש הפרויקט לחצי **Connect**.
2. בחרי את האפשרות **Session pooler** (חיבור דרך pooler במצב Session, פורט **5432**).
   - למה? ה-Render החינמי עובד עם IPv4, והחיבור "Direct" של Supabase לא תמיד תומך בזה. ה-Session pooler כן.
   - **אל** תבחרי "Transaction pooler" (פורט 6543) – הוא לא מתאים להרצת Migrations של Prisma.
3. תראי כתובת שנראית כך:
   `postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
4. החליפי את `[YOUR-PASSWORD]` (כולל הסוגריים המרובעים) בסיסמה שבחרת בשלב 2. אם בסיסמה יש תווים מיוחדים (`@ : / ? # %`) – צריך לקודד אותם (למשל `@` ← `%40`), או פשוט צרי סיסמה בלי תווים מיוחדים (אותיות וספרות בלבד).
5. זו ה-`DATABASE_URL` שלך. שמרי בצד.

### 4. שמירה בבטחה
- אל תשלחי את הכתובת במייל/צ'אט, ואל תכתבי אותה בקובץ בתוך הפרויקט שעולה ל-GitHub.
- היא תוזן רק במסך ההגדרות של Render (חלק ג').

### 5. קישור השרת לאחסון הקבצים
בשביל שהשרת יוכל לשמור קבצים (ספרים, תמונות, PDF) צריך שני ערכים:
1. **Project Settings** (גלגל שיניים) → **API** (או **API Keys**):
   - **Project URL** – למשל `https://abcdxyz.supabase.co` ← זה `SUPABASE_URL`.
   - המפתח הסודי: **service_role** (במסכים חדשים: **Secret key**) ← זה `SUPABASE_SERVICE_KEY`. 
   - ⚠️ זה מפתח חזק ופרטי מאוד. לעולם לא בקוד, לא ב-GitHub ולא בצד של ה-React.
2. אין צורך ליצור דליים (buckets) ידנית: השרת יוצר לבד את `tk-public` ו-`tk-private` בעלייה הראשונה. (אם משהו נכשל תראי אזהרה בלוג של Render – אז אפשר ליצור ידנית ב-**Storage → New bucket**: הראשון `tk-public` עם **Public bucket** מסומן, השני `tk-private` בלי.)

---

## חלק ג – Render (הרצת השרת)

### 1. חשבון וחיבור GitHub
1. **render.com** → **Get Started / Sign up** → הירשמי עם **GitHub** (הכי פשוט).
2. כשמבקשים הרשאות ל-GitHub – אשרי גישה ל-repository `tk-books-backend` (אפשר לבחור repository ספציפי).

### 2. יצירת Web Service
1. בלוח הבקרה: **New +** → **Web Service**.
2. בחרי את ה-repository `tk-books-backend` (אם לא מופיע – **Configure account** והוסיפי אותו).
3. מלאי:

| שדה | ערך |
|---|---|
| **Name** | `tk-books-api` |
| **Region** | Frankfurt (EU Central) |
| **Branch** | `main` |
| **Root Directory** | (להשאיר ריק) |
| **Runtime / Language** | Node |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | Free |

*אפשרות קצרה:* במקום למלא ידנית – **New + → Blueprint**, בחרי את ה-repository, ו-Render יקרא את `render.yaml` וימלא הכל לבד (ואז רק תזיני את ערכי הסביבה).

### 3. משתני סביבה (Environment Variables)
בחלק **Environment** (או **Advanced → Add Environment Variable**) הוסיפי **בדיוק** את אלה:

| Key | ערך | הערות |
|---|---|---|
| `NODE_VERSION` | `22` | |
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | הכתובת מ-Supabase (חלק ב' שלב 3) | סודי |
| `JWT_SECRET` | מחרוזת אקראית ארוכה (32+ תווים) | אם השתמשת ב-Blueprint – Render מייצר לבד. אחרת: כתבי בעצמך משהו אקראי ארוך |
| `JWT_EXPIRES_IN` | `8h` | |
| `ADMIN_EMAIL` | המייל שלך להתחברות כמנהלת | |
| `ADMIN_PASSWORD` | סיסמה חזקה (10 תווים ומעלה) | זו הסיסמה שבה תתחברי כמנהלת. סודי |
| `STORAGE_DRIVER` | `supabase` | |
| `SUPABASE_URL` | מ-חלק ב' שלב 5 | |
| `SUPABASE_SERVICE_KEY` | מ-חלק ב' שלב 5 | סודי |
| `SUPABASE_BUCKET_PUBLIC` | `tk-public` | |
| `SUPABASE_BUCKET_PRIVATE` | `tk-private` | |
| `CORS_ORIGIN` | כתובת אתר ה-React (בהתחלה: `http://localhost:5173`) | להוסיף את הכתובת האמיתית כשיהיה |
| `FRONTEND_URL` | כנ"ל (כתובת האתר – נכנסת בקישורים במיילים) | |
| `SUPPORT_EMAIL` | המייל שמוצג ללקוחות (כמויות גדולות, פניות) | |
| `ADMIN_NOTIFY_EMAIL` | המייל שמקבל התראה על הזמנות ששולמו ועל פניות חדשות | |
| `ALLOW_FAKE_PAYMENTS_IN_PRODUCTION` | `true` **רק לבדיקות** | כרגע יש רק תשלום דמה (לא גובה כסף). בלי הדגל הזה השרת בענן מסרב לעלות. **כל עוד הוא true – כל אחת יכולה לקבל מוצרים בחינם**, אז לא לפתוח את האתר ללקוחות אמיתיות עד שיש חברת סליקה |
| `SEED_DEMO` | `true` להתחלה | יוצר ספרים/מוצרים לדוגמה. לא חובה |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | פרטי שירות מייל | אופציונלי בהתחלה – ראי "מיילים" למטה |

> ⚠️ בלי `ADMIN_EMAIL` + `ADMIN_PASSWORD` לא תיווצר מנהלת, ולא תוכלי להתחבר.

### 4. Prisma Migrations
אין צעד נפרד: הפקודה `npm run start:prod` מריצה בכל עלייה, לפי הסדר:
1. `prisma migrate deploy` – יוצר/מעדכן את הטבלאות ב-Supabase.
2. יצירת המנהלת (ו-bucket-ים, ודמו אם `SEED_DEMO=true`).
3. הפעלת השרת.

### 5. Deploy
1. לחצי **Create Web Service** (או **Deploy**).
2. בלשונית **Logs** תראי את התקדמות הבנייה. בהצלחה תראי: `TK Books API פועל על פורט ...` והסטטוס **Live**.
3. בראש העמוד תופיע הכתובת שלך, למשל `https://tk-books-api.onrender.com`.

### 6. מיילים (אופציונלי, אפשר אחר כך)
בלי SMTP האתר עובד, אבל מיילים (אישור הזמנה וכד') **לא נשלחים** – רק נרשמים בטבלת EmailLog. כדי לשלוח מיילים אמיתיים צריך שירות SMTP. אפשרות נפוצה: **Brevo** (שכבה חינמית) – מגדירים שם שולח, ומקבלים `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASS`. **Resend** אפשרות נוספת. הערה: שניהם דורשים אימות כתובת שולח/דומיין. בדקי את התנאים העדכניים שלהם. אחרי הוספת הערכים ב-Render – Render יעשה Deploy מחדש. בדקי שמייל באמת מגיע (גם לתיקיית הספאם).

### 7. מה לדעת על Render החינמי
- אחרי תקופה בלי פעילות השרת "נרדם", והבקשה הראשונה אחרי זה לוקחת עד כדקה. זה תקין.
- בדקי באתר Render מה התנאים הנוכחיים של התוכנית החינמית.
- אם אין בחינם מסלול מתאים כשאת מעלה: חלופות דומות שמריצות Node מ-GitHub הן **Railway**, **Fly.io**, **Koyeb** (בדקי תנאים). ההגדרות זהות: Build `npm ci && npm run build`, Start `npm run start:prod`, ואותם משתני סביבה.

---

## חלק ד – בדיקה שהכל עובד

(החליפי `https://YOUR-SERVICE.onrender.com` בכתובת שלך)

1. **בריאות שרת:** פתחי `https://YOUR-SERVICE.onrender.com/api/health` – צריך לראות `{"status":"ok", ...}`.
2. **Swagger:** פתחי `https://YOUR-SERVICE.onrender.com/api-docs` – תראי את כל ה-Endpoints.
3. **התחברות:** ב-Swagger פתחי `POST /api/auth/login` → **Try it out** → הכניסי את `ADMIN_EMAIL` ו-`ADMIN_PASSWORD` שהגדרת → **Execute**.
4. **קבלת JWT:** בתשובה (Response body) העתיקי את הערך של `token`.
5. **Authorize:** לחצי את הכפתור **Authorize** (כפתור עם מנעול, למעלה) → הדביקי את ה-token → **Authorize** → **Close**.
6. **Endpoint מוגן:** `GET /api/admin/stats` → Try it out → Execute → צפוי **200**. נסי גם בלי Authorize (או אחרי **Logout**): צפוי **401**.
7. **הוספת רשומה:** `POST /api/admin/faqs` → Try it out. בגוף הבקשה:
   ```json
   { "questionHe": "שאלת בדיקה?", "questionEn": "Test question?", "answerHe": "תשובה", "answerEn": "Answer" }
   ```
   → Execute → צפוי **201** ו-`id` בתשובה.
8. **שליפה מהמסד:** `GET /api/faqs` → Execute → את השאלה שהוספת תראי ברשימה. (אפשר גם לבדוק ב-Supabase: **Table Editor → Faq**.)
   מחקי את השאלה: `DELETE /api/admin/faqs/{id}` (צפוי 204).
9. **מעקב הזמנה (אם `SEED_DEMO=true`):** `POST /api/orders/track` עם `{ "code": "TK-DEMO02", "email": "demo.approved@example.com" }`.

---

## חלק ה – פתרון תקלות

| תקלה | סיבה אפשרית | פתרון |
|---|---|---|
| **Build Failed** ב-Render | פקודת Build שגויה / קבצים חסרים ב-GitHub | ודאי Build Command = `npm ci && npm run build`. ודאי שב-GitHub יש `package.json` **וגם `package-lock.json`** בשורש (ושלא העלית את התיקייה בתוך תיקייה). קראי בלוג את השורה האדומה הראשונה. |
| `npm ci` נכשל על lock file | `package-lock.json` חסר או לא תואם | העלי מחדש את `package-lock.json` מהתיקייה המקורית |
| **שרת לא עולה** – "Environment variable not found: DATABASE_URL" | `DATABASE_URL` לא הוגדר | Render → Environment → הוסיפי, ואז **Manual Deploy → Deploy latest commit** |
| הלוג מציג "הגדרות סביבה לא תקינות" | חסר ערך חובה (למשל `JWT_SECRET`) | הערך שמופיע בשגיאה – תקני ב-Environment |
| **DATABASE_URL שגוי** – `Can't reach database server` / `password authentication failed` | סיסמה שגויה, `[YOUR-PASSWORD]` לא הוחלף, תו מיוחד, או חיבור לא מתאים | ודאי שהחלפת את הסיסמה (בלי הסוגריים). השתמשי ב-**Session pooler (פורט 5432)**. אם הסיסמה כוללת תווים מיוחדים – קודדי או החליפי סיסמה בלי תווים מיוחדים (Supabase: Project Settings → Database → Reset database password) |
| **בעיית Prisma** – `P1001`, `P1002` או "prepared statement does not exist" | חיבור שגוי או שימוש ב-Transaction pooler (6543) | עברי ל-Session pooler (5432) |
| `P3009` / מיגרציה נכשלה בעבר | מיגרציה שנתקעה באמצע | בעבר ריק (פרויקט חדש) – אפשר למחוק את הטבלאות ב-Supabase (SQL Editor: `drop schema public cascade; create schema public;`) ולעשות Deploy מחדש. **זה מוחק הכל!** |
| **JWT_SECRET חסר** / "JWT_SECRET חייב להיות..." | לא הוגדר או קצר מ-16 תווים | הגדירי מחרוזת אקראית של 32+ תווים |
| לא מצליחה להתחבר – 401 `INVALID_CREDENTIALS` | `ADMIN_EMAIL`/`ADMIN_PASSWORD` לא הוגדרו או שונו אחרי הפעם הראשונה | הגדירי ב-Render ועשי Deploy מחדש – הסיסמה מתעדכנת בכל עלייה |
| `401` על Endpoint של מנהלת | חסר Token / פג תוקף (8 שעות) | התחברי שוב ולחצי Authorize מחדש |
| `403 FORBIDDEN` | Token תקין אבל בלי תפקיד מנהלת | התחברי עם חשבון המנהלת |
| **שגיאת CORS** בדפדפן (באתר ה-React) | כתובת האתר לא ב-`CORS_ORIGIN` | הוסיפי אותה (עם `https://`, בלי `/` בסוף; כמה כתובות מופרדות בפסיק) ועשי Deploy מחדש |
| **Swagger לא נפתח** (`/api-docs`) | השרת "ישן" או לא עלה | חכי דקה (התעוררות), בדקי `/api/health` ובדקי בלוגים. הכתובת היא `/api-docs` (עם מקף) |
| Swagger → Try it out נכשל | נפתח מכתובת אחרת/Mixed content | פתחי את Swagger דרך כתובת ה-`https` של Render |
| **`STORAGE_ERROR`** / שמירת קובץ נכשלה (502) | מפתח/כתובת Supabase שגויים או bucket חסר | בדקי `SUPABASE_URL` ו-`SUPABASE_SERVICE_KEY` (service_role/secret) וקיום ה-buckets `tk-public` ו-`tk-private` ב-Supabase Storage |
| תמונות לא נראות באתר | bucket `tk-public` לא Public | ב-Supabase Storage: ה-bucket `tk-public` חייב להיות **Public** |
| אין מיילים | SMTP לא הוגדר / נחסם | בדקי `SMTP_*`; הסטטוס בטבלת `EmailLog` ב-Supabase (SENT / FAILED / SKIPPED, ועמודת `error`) |
| קבצים נעלמו אחרי Deploy | `STORAGE_DRIVER` נשאר `local` | הגדירי `supabase` והעלי שוב את הקבצים |
| השרת איטי בבקשה הראשונה | Render חינמי "ישן" | תקין. מחכים עד דקה |

---

## חלק ו – חיבור ה-React אחרי שתכתבי אותו
1. את כתובת השרת (`https://tk-books-api.onrender.com`) שמים ב-React כ-`VITE_API_URL`.
2. מעלים את ה-React לשירות כמו Netlify/Vercel.
3. ב-Render מוסיפים את כתובת האתר ל-`CORS_ORIGIN` ול-`FRONTEND_URL` ועושים Deploy מחדש.
4. כל פרטי ה-API ב-**FRONTEND-API-GUIDE.md**.

## חלק ז – מחליפות את תוכן הדמו בתוכן האמיתי
ראי **docs/REPLACE-DEMO-CONTENT.md** – שלב אחר שלב דרך Swagger.

## הרצה על המחשב (לבדיקות לפני העלאה)
ראי README.md → "הרצה מקומית".

---
**סיכום קצר של הסדר:** GitHub (להעלות קבצים) → Supabase (לפתוח פרויקט, לשמור סיסמה/כתובת/מפתח) → Render (Web Service + משתני סביבה) → לבדוק `/api/health` ו-`/api-docs`.
