import type { Lang } from '../types';

export const money = (agorot: number): string => `₪${(agorot / 100).toFixed(2)}`;

export const fmtDate = (iso: string | null | undefined, lang: Lang): string =>
  iso ? new Date(iso).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB') : '-';

export const fmtDateTime = (iso: string | null | undefined, lang: Lang): string =>
  iso ? new Date(iso).toLocaleString(lang === 'he' ? 'he-IL' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '-';

/** בוחר את השדה בשפה הנוכחית: pick(lang, book, 'title') => titleHe / titleEn */
export function pick<T extends object>(lang: Lang, obj: T, base: string): string {
  const key = `${base}${lang === 'he' ? 'He' : 'En'}`;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : '';
}

/** זמן שנותר להורדה */
export function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

/** צבע ספר לפי הסדר: 1 ורוד, 2 תכלת, 3 לימון, ואז שוב */
export const accentFor = (sortOrder: number): 'pink' | 'sky' | 'sun' => (['pink', 'sky', 'sun'] as const)[(Math.max(1, sortOrder) - 1) % 3] ?? 'pink';
