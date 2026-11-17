import { useQuery } from '@tanstack/react-query';
import { fetchConfig } from '../api/configApi';

/** הגדרות מהשרת (מייל תמיכה, מגבלת כמות, מצב תשלום). כמעט לא משתנות, לכן נשמרות שעה. */
export const useConfig = () => useQuery({ queryKey: ['config'], queryFn: fetchConfig, staleTime: 3_600_000 });
