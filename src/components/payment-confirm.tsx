import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const REPORTED_STATUS = "Payment submitted — verifying";

/** Lets a customer report the transaction they sent so the order leaves "Awaiting payment". */
export function PaymentConfirmForm({
  orderNumber,
  initialTxid = "",
  initialReported = false,
  onConfirmed,
}: {
  orderNumber: string;
  initialTxid?: string;
  initialReported?: boolean;
  onConfirmed?: (txid: string) => void;
}) {
  const [txid, setTxid] = useState(initialTxid);
  const [reported, setReported] = useState(initialReported);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (reported) {
    return (
      <div className="rounded border border-primary/40 bg-primary/5 px-3 py-2 text-xs">
        <p className="font-semibold text-primary">Payment reported</p>
        <p className="mt-1 text-muted-foreground">
          We are verifying the transaction on-chain. The status updates to “Payment confirmed” once it settles.
        </p>
        {txid && <p className="mt-1 font-mono break-all text-foreground/80">{txid}</p>}
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = txid.trim();
    if (value.length < 8) {
      setError("Enter the transaction ID / hash from your wallet.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: err } = await supabase
      .from("orders")
      .update({
        payment_txid: value,
        payment_reported_at: new Date().toISOString(),
        status: REPORTED_STATUS,
      })
      .eq("order_number", orderNumber);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setReported(true);
    onConfirmed?.(value);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="block text-xs font-semibold" htmlFor={`txid-${orderNumber}`}>
        Already sent it? Paste your transaction ID
      </label>
      <div className="flex gap-2">
        <input
          id={`txid-${orderNumber}`}
          value={txid}
          onChange={(e) => setTxid(e.target.value)}
          placeholder="Transaction hash"
          className="flex-1 min-w-0 px-3 py-2 border border-border rounded bg-card text-xs font-mono"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 px-4 border border-primary text-primary rounded text-xs font-medium hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
        >
          {busy ? "Sending…" : "I have paid"}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
