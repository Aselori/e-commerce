"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  type: "individual" | "kit";
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "fimetienda:cart";

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it) =>
        it &&
        typeof it.productId === "string" &&
        typeof it.name === "string" &&
        typeof it.price === "number" &&
        typeof it.quantity === "number"
    );
  } catch {
    return [];
  }
}

function subscribeNoop() {
  return () => {};
}

function getHydrated() {
  return true;
}

function getServerHydrated() {
  return false;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStorage);
  const hydrated = useSyncExternalStore(subscribeNoop, getHydrated, getServerHydrated);
  const skipSync = useRef(true);

  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const add = useCallback<CartContextValue["add"]>((item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((x) => x.productId === item.productId);
      if (existing) {
        return prev.map((x) =>
          x.productId === item.productId
            ? { ...x, quantity: x.quantity + quantity }
            : x
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    (productId, quantity) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((x) => x.productId !== productId)
          : prev.map((x) =>
              x.productId === productId ? { ...x, quantity } : x
            )
      );
    },
    []
  );

  const remove = useCallback<CartContextValue["remove"]>((productId) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((n, it) => n + it.quantity, 0);
    const subtotal = items.reduce((n, it) => n + it.price * it.quantity, 0);
    return { items, itemCount, subtotal, hydrated, add, setQuantity, remove, clear };
  }, [items, hydrated, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { formatMXN } from "./format";
