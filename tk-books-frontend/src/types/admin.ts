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
