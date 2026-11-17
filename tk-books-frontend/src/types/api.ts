export type Lang = 'he' | 'en';

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AppConfig {
  supportEmail: string;
  maxItemQuantity: number;
  downloadValidDays: number;
  deliveryBusinessDays: number;
  currency: string;
  paymentMode: 'fake';
}
