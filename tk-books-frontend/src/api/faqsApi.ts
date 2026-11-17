import type { Faq } from '../types';
import { api, qs } from './client';

export type FaqParams = {
  bookSlug?: string;
  scope?: string;
  includeGeneral?: boolean;
  q?: string;
};

export const fetchFaqs = (params: FaqParams) => api<{ items: Faq[] }>(`/api/faqs${qs(params)}`);
