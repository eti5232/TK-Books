import type { Lang } from './api';
import type { ProductKind } from './product';

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
