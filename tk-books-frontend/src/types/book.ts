export interface Book {
  id: string;
  slug: string;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  coverImageUrl: string | null;
  sortOrder: number;
  pageCount: number;
  isActive?: boolean;
  coverImageKey?: string | null;
}

export interface BookDetail extends Book {
  materialCounts: { SONG: number; TEST: number; REVIEW_SHEET: number; TEACHER_GUIDE: number };
  faqCount: number;
  productCount: number;
}

export type MaterialType = 'SONG' | 'TEST' | 'REVIEW_SHEET' | 'TEACHER_GUIDE';

export interface Material {
  id: string;
  bookId: string;
  type: MaterialType;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  unit: number | null;
  sortOrder: number;
  mediaUrl: string | null;
  lyricsHe: string | null;
  lyricsEn: string | null;
  hasFile: boolean;
  downloadUrl: string | null;
  fileKey?: string | null;
  isActive?: boolean;
}

export interface Faq {
  id: string;
  bookId: string | null;
  questionHe: string;
  questionEn: string;
  answerHe: string;
  answerEn: string;
  sortOrder: number;
  isActive?: boolean;
}
