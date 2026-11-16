export type Lang = 'he' | 'en';

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

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

export interface AppConfig {
  supportEmail: string;
  maxItemQuantity: number;
  downloadValidDays: number;
  deliveryBusinessDays: number;
  currency: string;
  paymentMode: 'fake';
}

export type OrderStatus = 'PENDING' | 'PAID' | 'ORDERED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' | 'APPROVED' | 'REJECTED';

export interface OrderItem {
  id: string;
  productId: string;
  productSlug: string;
  nameHe: string;
  nameEn: string;
  kind: ProductKind;
  quantity: number;
  unitPriceAgorot: number;
  lineTotalAgorot: number;
  download: { url: string; expiresAt: string; expired: boolean; downloadsLeft: number } | null;
}

export interface TrackedOrder {
  code: string;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  orderedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDeliveryAt: string | null;
  trackingNumber: string | null;
  hasPhysicalItems: boolean;
  deliveryLate: boolean;
  canPay: boolean;
  statusNote: string | null;
  contactPath: string;
  supportEmail: string;
  totalAgorot: number;
  currency: string;
  items: OrderItem[];
}

export interface AdminOrder {
  id: string;
  code: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: { street: string; city: string; zip?: string } | null;
  notes: string | null;
  adminNote: string | null;
  preferredLanguage: Lang;
  totalAgorot: number;
  paymentRef: string | null;
  trackingNumber: string | null;
  createdAt: string;
  paidAt: string | null;
  orderedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDeliveryAt: string | null;
  items: OrderItem[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  orderCode: string | null;
  status: 'NEW' | 'HANDLED';
  createdAt: string;
}

export interface Customer {
  email: string;
  name: string;
  phone: string | null;
  ordersCount: number;
  totalAgorot: number;
  lastOrderAt: string;
}

export interface Stats {
  pendingOrders: number;
  totalOrders: number;
  newMessages: number;
  books: number;
  materials: number;
  products: number;
  faqs: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN';
}
