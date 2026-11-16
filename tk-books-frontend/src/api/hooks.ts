import { useQuery } from '@tanstack/react-query';
import type { AppConfig, Book, BookDetail, Faq, Material, Paginated, Product } from '../types';
import { api, qs } from './client';

export const useConfig = () =>
  useQuery({ queryKey: ['config'], queryFn: () => api<AppConfig>('/api/config'), staleTime: 3_600_000 });

export const useBooks = () => useQuery({ queryKey: ['books'], queryFn: () => api<{ items: Book[] }>('/api/books') });

export const useBook = (slug: string | undefined) =>
  useQuery({ queryKey: ['book', slug], queryFn: () => api<BookDetail>(`/api/books/${slug}`), enabled: !!slug });

export const useMaterials = (slug: string | undefined, type: string) =>
  useQuery({
    queryKey: ['materials', slug, type],
    queryFn: () => api<Paginated<Material>>(`/api/books/${slug}/materials${qs({ type, pageSize: 100 })}`),
    enabled: !!slug,
  });

export const useFaqs = (params: { bookSlug?: string; scope?: string; includeGeneral?: boolean; q?: string }) =>
  useQuery({ queryKey: ['faqs', params], queryFn: () => api<{ items: Faq[] }>(`/api/faqs${qs(params)}`) });

export const useProducts = (params: Record<string, string | number | undefined>, enabled = true) =>
  useQuery({ queryKey: ['products', params], queryFn: () => api<Paginated<Product>>(`/api/products${qs(params)}`), enabled });

export const useProduct = (slug: string | undefined) =>
  useQuery({ queryKey: ['product', slug], queryFn: () => api<Product>(`/api/products/${slug}`), enabled: !!slug });
