import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  grams: number;
  price: number;
  quantity: number;
};

export type PlaceOrderInput = {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  notes: string;
  shippingLabel: string;
  shippingPrice: number;
  paymentCode: string;
  paymentAddress: string;
};

export type PlacedOrder = {
  orderNumber: string;
  total: number;
  paymentCode: string;
  paymentAddress: string;
  email: string;
};

const CART_KEY = "shop.cart.grams.v1";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  add: (item: CartItem) => void;
  setQuantity: (productId: string, grams: number, quantity: number) => void;
  remove: (productId: string, grams: number) => void;
  clear: () => void;
  placeOrder: (details: PlaceOrderInput) => Promise<PlacedOrder>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items, hydrated]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === item.productId && i.grams === item.grams);
      if (idx === -1) return [...prev, item];
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
      return next;
    });
  }, []);

  const setQuantity = useCallback((productId: string, grams: number, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => !(i.productId === productId && i.grams === grams))
        : prev.map((i) => (i.productId === productId && i.grams === grams ? { ...i, quantity } : i)),
    );
  }, []);

  const remove = useCallback((productId: string, grams: number) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.grams === grams)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const placeOrder = useCallback<CartContextValue["placeOrder"]>(
    async (details) => {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const total = subtotal + details.shippingPrice;

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          first_name: details.firstName,
          last_name: details.lastName,
          address: details.address,
          email: details.email,
          notes: details.notes,
          shipping_label: details.shippingLabel,
          shipping_price: details.shippingPrice,
          subtotal,
          total,
          payment_code: details.paymentCode,
          payment_address: details.paymentAddress,
          status: "Awaiting payment",
        })
        .select("id")
        .single();

      if (error) throw error;

      const rows = items.map((i) => ({
        order_id: (order as { id: string }).id,
        product_name: i.name,
        grams: i.grams,
        unit_price: i.price,
        quantity: i.quantity,
        line_total: i.price * i.quantity,
      }));
      if (rows.length > 0) {
        const { error: itemError } = await supabase.from("order_items").insert(rows);
        if (itemError) throw itemError;
      }

      setItems([]);
      return {
        orderNumber,
        total,
        paymentCode: details.paymentCode,
        paymentAddress: details.paymentAddress,
        email: details.email,
      };
    },
    [items, subtotal],
  );

  const value = useMemo(
    () => ({ items, count, subtotal, hydrated, add, setQuantity, remove, clear, placeOrder }),
    [items, count, subtotal, hydrated, add, setQuantity, remove, clear, placeOrder],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
