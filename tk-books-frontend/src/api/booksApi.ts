import type { Book, BookDetail, Material, Paginated } from '../types';
import { api, qs } from './client';

export const fetchBooks = () => api<{ items: Book[] }>('/api/books');

export const fetchBook = (slug: string) => api<BookDetail>(`/api/books/${slug}`);

export const fetchMaterials = (slug: string, type: string) =>
  api<Paginated<Material>>(`/api/books/${slug}/materials${qs({ type, pageSize: 100 })}`);
