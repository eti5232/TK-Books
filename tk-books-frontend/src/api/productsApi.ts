import type { Paginated, Product } from '../types';
import { api, qs } from './client';

export type ProductParams = Record<string, string | number | undefined>;

export const fetchProducts = (params: ProductParams) => api<Paginated<Product>>(`/api/products${qs(params)}`);

export const fetchProduct = (slug: string) => api<Product>(`/api/products/${slug}`);
