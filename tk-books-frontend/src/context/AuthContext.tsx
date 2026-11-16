import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from '../api/client';
import type { AdminUser } from '../types';

interface AuthValue {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken());

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
  }, []);

  // בטעינת האתר: אם יש Token שמור – בודקים אם הוא עדיין תקף
  useEffect(() => {
    if (!getToken()) return;
    api<AdminUser>('/api/auth/me', { auth: true })
      .then(setAdmin)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // 401 מהשרת באמצע עבודה => יציאה
  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('tk:unauthorized', onUnauthorized);
    return () => window.removeEventListener('tk:unauthorized', onUnauthorized);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; admin: AdminUser }>('/api/auth/login', { body: { email, password } });
    setToken(res.token);
    setAdmin(res.admin);
  }, []);

  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
