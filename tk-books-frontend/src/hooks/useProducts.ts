import { useQuery } from '@tanstack/react-query';
import { fetchProduct, fetchProducts, type ProductParams } from '../api/productsApi';

export const useProducts = (params: ProductParams, enabled = true) => useQuery({ queryKey: ['products', params], queryFn: () => fetchProducts(params), enabled });

export const useProduct = (slug: string | undefined) => useQuery({ queryKey: ['product', slug], queryFn: () => fetchProduct(slug as string), enabled: !!slug });
