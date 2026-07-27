import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageWithSidebar, useSettings } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";
import { gramsLabel, money, type OrderRow } from "@/lib/store";

type Item = { id: string; product_name: string; grams: number; unit_price: number; quantity: number; line_total: number };

export const Route = createFileRoute("/order-tracking")({
  head: () => ({
    meta: [
      { title: "Order tracking — check your order status" },
      { name: "description", content: "Look up an order by order number or email address to see its current status." },
      { property: "og:title", content: "Order tracking" },
      { property: "og:description", content: "Look up an order by number or email." },
    ],
  }),
  component: OrderTrackingPage,
});

function OrderTrackingPage() {
  const settings = useSettings();
  const symbol = settings.currency_symbol ?? "$";
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .or(`order_number.eq.${q},email.eq.${q}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<OrderRow[]>();
    const found = data?.[0] ?? null;
    setOrder(found);
    if (found) {
      const { data: rows } = await supabase.from("order_items").select("*").eq("order_id", found.id).returns<Item[]>();
      setItems(rows ?? []);
    } else {
      setItems([]);
    }
    setLoading(false);
  };

  return (
    <PageWithSidebar>
      <h2 className="text-3xl font-bold text-primary">Order tracking</h2>
      <p className="mt-2 text-sm text-foreground/70">Enter your order number or the email you ordered with.</p>

      <form onSubmit={search} className="mt-6 flex gap-2 max-w-md">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ORD-XXXXXX or email"
          aria-label="Order number or email"
          className="flex-1 px-3 py-2 border border-border rounded bg-card text-sm"
        />
        <button className="px-5 bg-primary text-primary-foreground rounded text-sm font-medium">Track</button>
      </form>

      {loading && <p className="mt-6 text-sm text-muted-foreground">Searching…</p>}

      {!loading && searched && !order && (
        <p className="mt-6 text-sm text-muted-foreground">No order found for that reference.</p>
      )}

      {!loading && order && (
        <div className="mt-8 bg-card/95 border border-border rounded p-6 text-sm space-y-4">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-muted-foreground">Order number</p>
              <p className="text-lg font-semibold text-primary">{order.order_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-semibold">{order.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Placed</p>
              <p>{new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>

          <table className="w-full border border-border">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Product</th>
                <th className="px-3 py-2 font-semibold">Weight</th>
                <th className="px-3 py-2 font-semibold">Qty</th>
                <th className="px-3 py-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-3 py-2">{i.product_name}</td>
                  <td className="px-3 py-2">{gramsLabel(Number(i.grams))}</td>
                  <td className="px-3 py-2">{i.quantity}</td>
                  <td className="px-3 py-2">{money(Number(i.line_total), symbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Shipping</p>
              <p>{order.shipping_label || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold">{money(Number(order.total), symbol)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid with</p>
              <p>{order.payment_code || "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground">Payment address</p>
              <p className="font-mono break-all text-xs">{order.payment_address || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </PageWithSidebar>
  );
}
