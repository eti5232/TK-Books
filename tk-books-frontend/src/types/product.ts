export type ProductKind = 'DIGITAL' | 'PHYSICAL';

export type ProductCategory = 'FLASHCARDS' | 'SONGBOOK' | 'PRINTABLES' | 'STICKERS' | 'STAMPS' | 'OTHER';

export interface Product {
  id: string;
  slug: string;
  bookId: string | null;
  book: { slug: string; titleHe: string; titleEn: string } | null;
  kind: ProductKind;
  category: ProductCategory;
  nameHe: string;
  nameEn: string;
  descriptionHe: string;
  descriptionEn: string;
  priceAgorot: number;
  currency: string;
  images: { url: string | null; altHe: string; altEn: string }[];
  isActive?: boolean;
  digitalFileKey?: string | null;
  imageKeys?: string[];
}
