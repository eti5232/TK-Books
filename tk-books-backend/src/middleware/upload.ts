import multer from 'multer';
import { badRequest } from '../utils/app-error';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'video/mp4': '.mp4',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'application/zip': '.zip',
};

const storage = multer.memoryStorage();

/** העלאת קובץ בודד (שדה: file) */
export const uploadSingle = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME[file.mimetype]) cb(null, true);
    else cb(badRequest('UNSUPPORTED_FILE_TYPE', `סוג קובץ לא נתמך: ${file.mimetype}`));
  },
}).single('file');

/** העלאת תמונות עמודי ספר (שדה: pages, עד 300 תמונות) */
export const uploadPages = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 300 },
  fileFilter: (_req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(badRequest('UNSUPPORTED_FILE_TYPE', 'עמודי ספר חייבים להיות תמונות (PNG/JPG/WEBP)'));
  },
}).array('pages', 300);
