import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../types';

export interface CartItem {
  productId: string;
  slug: string;
  nameHe: string;
  nameEn: string;
  priceAgorot: number;
  image: string | null;
  kind: 'DIGITAL' | 'PHYSICAL';
  quantity: number;
}

interface CartValue {
  items: CartItem[];
  count: number;
  total: number;
  hasPhysical: boolean;
  add: (p: Product, qty: number, max: number) => void;
  setQty: (productId: string, qty: number, max: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const KEY = 'tk_cart';
const Ctx = createContext<CartValue | null>(null);

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add = useCallback((p: Product, qty: number, max: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) return prev.map((i) => (i.productId === p.id ? { ...i, quantity: Math.min(max, i.quantity + qty) } : i));
      return [
        ...prev,
        { productId: p.id, slug: p.slug, nameHe: p.nameHe, nameEn: p.nameEn, priceAgorot: p.priceAgorot, image: p.images[0]?.url ?? null, kind: p.kind, quantity: Math.min(max, qty) },
      ];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number, max: number) => {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(max, qty)) } : i)));
  }, []);

  const remove = useCallback((productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      total: items.reduce((s, i) => s + i.quantity * i.priceAgorot, 0),
      hasPhysical: items.some((i) => i.kind === 'PHYSICAL'),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart must be used inside CartProvider');
  return v;
}
