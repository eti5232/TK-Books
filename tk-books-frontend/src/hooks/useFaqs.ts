import { useQuery } from '@tanstack/react-query';
import { fetchFaqs, type FaqParams } from '../api/faqsApi';

export const useFaqs = (params: FaqParams) => useQuery({ queryKey: ['faqs', params], queryFn: () => fetchFaqs(params) });
