import { useQuery } from '@tanstack/react-query';
import { fetchBook, fetchBooks, fetchMaterials } from '../api/booksApi';

export const useBooks = () => useQuery({ queryKey: ['books'], queryFn: fetchBooks });

export const useBook = (slug: string | undefined) => useQuery({ queryKey: ['book', slug], queryFn: () => fetchBook(slug as string), enabled: !!slug });

export const useMaterials = (slug: string | undefined, type: string) =>
  useQuery({ queryKey: ['materials', slug, type], queryFn: () => fetchMaterials(slug as string, type), enabled: !!slug });
