# החלפת תוכן הדמו בתוכן האמיתי

כל מה שנוצר ב-Seed (ספרים, עמודים, שירים, מבחנים, מוצרים, תמונות) הוא **דמו**. את מחליפה אותו בתוכן האמיתי דרך **Swagger** (`/api-docs`) – לא צריך לגעת בקוד ולא בבסיס הנתונים. (כשתכתבי את ה-React, מסכי המנהלת יעשו אותו דבר.)

## 0. התחברות ב-Swagger
1. פתחי `/api-docs`.
2. `POST /api/auth/login` → **Try it out** → הכניסי מייל וסיסמה → **Execute**.
3. העתיקי את הערך של `token` מהתשובה.
4. לחצי **Authorize** (למעלה) → הדביקי את ה-Token (בלי המילה Bearer) → **Authorize** → **Close**.

## 1. החלפת עמודי ספר (הספר עצמו, לצפייה בלבד)
1. המרת הספר לתמונות: ייצאי כל עמוד כ-JPG או PNG (מ-Word/PDF/Canva/Adobe – "ייצוא כתמונה"). קראי להן `01.jpg`, `02.jpg`… כדי שהסדר יהיה נכון.
2. ב-Swagger: `GET /api/admin/books` → Execute → מצאי את ה-`id` של הספר.
3. `POST /api/admin/books/{id}/pages` → הכניסי את ה-`id` → בשדה `pages` בחרי **את כל התמונות יחד** → בשדה `replace` בחרי `true` (מוחק את עמודי הדמו) → Execute.
4. בדיקה: `GET /api/books/book-1/pages/1` – אמורה להיפתח תמונת העמוד עם סימן מים.

## 2. כריכה
1. `POST /api/admin/uploads` → `file` = תמונת הכריכה, `area` = `public`, `folder` = `covers` → Execute → העתיקי את ה-`key`.
2. `PUT /api/admin/books/{id}` עם `{ "coverImageKey": "<ה-key>", "titleHe": "השם האמיתי", "titleEn": "Real title", "descriptionHe": "…", "descriptionEn": "…" }`.

## 3. שירים / מבחנים / דפי חזרה / מדריך למורה (חינמיים)
1. העלאת הקובץ: `POST /api/admin/uploads` → `file` = ה-PDF או ה-MP3, `area` = `private`, `folder` = `materials` → העתיקי את ה-`key`.
2. עדכון חומר קיים: `GET /api/admin/materials?bookId=<id>` → מצאי `id` → `PUT /api/admin/materials/{id}` עם `{ "fileKey": "<key>", "titleHe": "…", "titleEn": "…" }`.
   או הוספת חדש: `POST /api/admin/materials` עם `bookId`, `type` (`SONG`/`TEST`/`REVIEW_SHEET`/`TEACHER_GUIDE`), `titleHe`, `titleEn`, `fileKey`.
3. לשיר עם סרטון – הוסיפי `"mediaUrl": "https://www.youtube.com/watch?v=…"` ובשביל המילים `lyricsHe` / `lyricsEn`.
4. מחיקת חומר דמו: `DELETE /api/admin/materials/{id}`.

## 4. מוצרים
- תמונה: העלאה עם `area=public`, `folder=products` → `key`.
- קובץ דיגיטלי להורדה: העלאה עם `area=private`, `folder=products` → `key`.
- עדכון: `PUT /api/admin/products/{id}` עם `{ "priceAgorot": 2900, "nameHe": "…", "nameEn": "…", "digitalFileKey": "<key>", "images": [ { "key": "<תמונה>", "altHe": "…", "altEn": "…" } ] }`.
  המחיר **באגורות** (₪29 = 2900). רשימת `images` מחליפה את כל התמונות הקיימות.
- מוצר שכבר הוזמן אי אפשר למחוק; הסתירי אותו עם `{ "isActive": false }`.

## 5. שאלות נפוצות
`GET /api/admin/faqs` → `PUT /api/admin/faqs/{id}` או `DELETE`. חדשה: `POST /api/admin/faqs` (בלי `bookId` = כללית).

## 6. הזמנות ופניות של דמו
הזמנות הדמו (`TK-DEMO01..03`) והפנייה לדוגמה אינן ניתנות למחיקה ב-API (הזמנות נשמרות כהיסטוריה). הן לא מזיקות, אבל אפשר להתעלם מהן. בענן אפשר להתחיל נקי: לפני הפריסה הראשונה הגדירי `SEED_DEMO=false`, ואז לא ייווצרו נתוני דמו בכלל, ובמקום זה תוסיפי את כל התוכן ידנית לפי המדריך הזה.

## 7. כיבוי נתוני הדמו
ב-Render → Environment → `SEED_DEMO` = `false`. (נתונים שכבר נוצרו לא נמחקים; הם נשארים עד שתמחקי/תחליפי אותם.)
