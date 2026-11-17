import type { AppConfig } from '../types';
import { api } from './client';

export const fetchConfig = () => api<AppConfig>('/api/config');
