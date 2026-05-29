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
import {
  buildCartLineKey,
  type CartLineOptions,
} from '@/lib/cart-line-options';

export type CartLine = {
  lineKey: string;
  productId: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
};

const STORAGE_KEY = 'stylesnest-cart-v2';
const LEGACY_STORAGE_KEY = 'stylesnest-cart-v1';

type CartContextValue = {
  lines: CartLine[];
  /** Sum of line quantities */
  totalQuantity: number;
  hydrated: boolean;
  addToCart: (productId: number, quantity?: number, options?: CartLineOptions) => void;
  removeCartLine: (lineKey: string) => void;
  /** @deprecated Use removeCartLine */
  removeFromCart: (lineKey: string) => void;
  removeLinesFromCart: (lineKeys: string[]) => void;
  setLineQuantity: (lineKey: string, quantity: number) => void;
  updateLineOptions: (lineKey: string, options: CartLineOptions) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function normalizeOptions(options?: CartLineOptions): CartLineOptions {
  const selectedSize = options?.selectedSize?.trim() || undefined;
  const selectedColor = options?.selectedColor?.trim() || undefined;
  return { selectedSize, selectedColor };
}

function parseLineRow(row: unknown): CartLine | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const productId = Math.floor(Number(r.productId));
  const quantity = Math.floor(Number(r.quantity));
  if (!Number.isFinite(productId) || productId < 1 || !Number.isFinite(quantity)) return null;

  const options = normalizeOptions({
    selectedSize: typeof r.selectedSize === 'string' ? r.selectedSize : undefined,
    selectedColor: typeof r.selectedColor === 'string' ? r.selectedColor : undefined,
  });

  const lineKey =
    typeof r.lineKey === 'string' && r.lineKey.trim()
      ? r.lineKey.trim()
      : buildCartLineKey(productId, options);

  return {
    lineKey,
    productId,
    quantity: Math.min(99, Math.max(1, quantity)),
    ...options,
  };
}

function parseStored(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.map(parseLineRow).filter((x): x is CartLine => x !== null);
  } catch {
    return [];
  }
}

function loadInitialLines(): CartLine[] {
  if (typeof window === 'undefined') return [];
  const current = parseStored(localStorage.getItem(STORAGE_KEY));
  if (current.length > 0) return current;
  return parseStored(localStorage.getItem(LEGACY_STORAGE_KEY));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(loadInitialLines());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (lines.length === 0) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota / private mode */
    }
  }, [lines, hydrated]);

  const addToCart = useCallback((productId: number, quantity = 1, options?: CartLineOptions) => {
    const pid = Math.floor(Number(productId));
    if (!Number.isFinite(pid) || pid < 1) return;
    const q = Math.min(99, Math.max(1, Math.floor(Number(quantity)) || 1));
    const normalized = normalizeOptions(options);
    const lineKey = buildCartLineKey(pid, normalized);

    setLines((prev) => {
      const idx = prev.findIndex((l) => l.lineKey === lineKey);
      if (idx === -1) {
        return [{ lineKey, productId: pid, quantity: q, ...normalized }, ...prev];
      }
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        quantity: Math.min(99, next[idx].quantity + q),
      };
      return next;
    });
  }, []);

  const removeCartLine = useCallback((lineKey: string) => {
    const key = lineKey.trim();
    if (!key) return;
    setLines((prev) => prev.filter((l) => l.lineKey !== key));
  }, []);

  const removeLinesFromCart = useCallback((lineKeys: string[]) => {
    const drop = new Set(lineKeys.map((k) => k.trim()).filter(Boolean));
    if (drop.size === 0) return;
    setLines((prev) => prev.filter((l) => !drop.has(l.lineKey)));
  }, []);

  const setLineQuantity = useCallback((lineKey: string, quantity: number) => {
    const key = lineKey.trim();
    const q = Math.floor(Number(quantity));
    if (!key) return;
    if (!Number.isFinite(q) || q < 1) {
      setLines((prev) => prev.filter((l) => l.lineKey !== key));
      return;
    }
    const capped = Math.min(99, q);
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.lineKey === key);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: capped };
      return next;
    });
  }, []);

  const updateLineOptions = useCallback((lineKey: string, options: CartLineOptions) => {
    const key = lineKey.trim();
    if (!key) return;
    const normalized = normalizeOptions(options);

    setLines((prev) => {
      const current = prev.find((l) => l.lineKey === key);
      if (!current) return prev;

      const newKey = buildCartLineKey(current.productId, normalized);
      if (newKey === key) {
        return prev.map((l) => (l.lineKey === key ? { ...l, ...normalized } : l));
      }

      const withoutCurrent = prev.filter((l) => l.lineKey !== key);
      const mergeTarget = withoutCurrent.find((l) => l.lineKey === newKey);

      if (!mergeTarget) {
        return [
          { ...current, lineKey: newKey, ...normalized },
          ...withoutCurrent,
        ];
      }

      return withoutCurrent.map((l) =>
        l.lineKey === newKey
          ? {
              ...l,
              quantity: Math.min(99, l.quantity + current.quantity),
              ...normalized,
            }
          : l,
      );
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
      removeCartLine,
      removeFromCart: removeCartLine,
      removeLinesFromCart,
      setLineQuantity,
      updateLineOptions,
      clearCart,
    }),
    [
      lines,
      totalQuantity,
      hydrated,
      addToCart,
      removeCartLine,
      removeLinesFromCart,
      setLineQuantity,
      updateLineOptions,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
