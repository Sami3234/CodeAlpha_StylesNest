'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type CartLine = {
  productId: number;
  quantity: number;
};

const STORAGE_KEY = 'stylesnest-cart-v1';

type CartContextValue = {
  lines: CartLine[];
  /** Sum of line quantities */
  totalQuantity: number;
  hydrated: boolean;
  addToCart: (productId: number, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  /** Remove several lines in one update (e.g. after checkout). */
  removeLinesFromCart: (productIds: number[]) => void;
  setLineQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function parseStored(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .map((row) => {
        const id = Number((row as CartLine).productId);
        const qty = Number((row as CartLine).quantity);
        if (!Number.isFinite(id) || id < 1 || !Number.isFinite(qty)) return null;
        return { productId: Math.floor(id), quantity: Math.min(99, Math.max(1, Math.floor(qty))) };
      })
      .filter((x): x is CartLine => x !== null);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(parseStored(typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      if (lines.length === 0) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota / private mode */
    }
  }, [lines, hydrated]);

  const addToCart = useCallback((productId: number, quantity = 1) => {
    const pid = Math.floor(Number(productId));
    if (!Number.isFinite(pid) || pid < 1) return;
    const q = Math.min(99, Math.max(1, Math.floor(Number(quantity)) || 1));
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === pid);
      if (idx === -1) return [...prev, { productId: pid, quantity: q }];
      const next = [...prev];
      next[idx] = {
        productId: pid,
        quantity: Math.min(99, next[idx].quantity + q),
      };
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    const pid = Math.floor(Number(productId));
    setLines((prev) => prev.filter((l) => l.productId !== pid));
  }, []);

  const removeLinesFromCart = useCallback((productIds: number[]) => {
    const drop = new Set(productIds.map((id) => Math.floor(Number(id))).filter((id) => Number.isFinite(id) && id >= 1));
    if (drop.size === 0) return;
    setLines((prev) => prev.filter((l) => !drop.has(l.productId)));
  }, []);

  const setLineQuantity = useCallback((productId: number, quantity: number) => {
    const pid = Math.floor(Number(productId));
    const q = Math.floor(Number(quantity));
    if (!Number.isFinite(pid) || pid < 1) return;
    if (!Number.isFinite(q) || q < 1) {
      setLines((prev) => prev.filter((l) => l.productId !== pid));
      return;
    }
    const capped = Math.min(99, q);
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === pid);
      if (idx === -1) return [...prev, { productId: pid, quantity: capped }];
      const next = [...prev];
      next[idx] = { productId: pid, quantity: capped };
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const totalQuantity = useMemo(
    () => lines.reduce((acc, l) => acc + l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      totalQuantity,
      hydrated,
      addToCart,
      removeFromCart,
      removeLinesFromCart,
      setLineQuantity,
      clearCart,
    }),
    [lines, totalQuantity, hydrated, addToCart, removeFromCart, removeLinesFromCart, setLineQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
