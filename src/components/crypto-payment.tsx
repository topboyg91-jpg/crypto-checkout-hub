import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

const URI_SCHEMES: Record<string, string> = {
  BTC: "bitcoin",
  LTC: "litecoin",
  XMR: "monero",
  DOGE: "dogecoin",
  BCH: "bitcoincash",
  ETH: "ethereum",
};

/** Build a wallet-scannable payment URI, falling back to the raw address. */
export function paymentUri(code: string, address: string, amount?: number): string {
  const scheme = URI_SCHEMES[(code || "").toUpperCase()];
  if (!scheme || !address) return address;
  const query = amount && amount > 0 ? `?amount=${amount}` : "";
  return `${scheme}:${address}${query}`;
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${label} ${value}`}
      className="shrink-0 px-2.5 py-1 border border-primary text-primary rounded text-xs font-medium hover:bg-primary hover:text-primary-foreground transition"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export function CopyableAddress({ value }: { value: string }) {
  return (
    <div className="flex items-start gap-2">
      <code className="flex-1 min-w-0 break-all font-mono text-xs bg-muted/60 border border-border rounded px-2 py-1.5">
        {value}
      </code>
      <CopyButton value={value} />
    </div>
  );
}

export function PaymentQr({
  code,
  address,
  size = 148,
  caption,
}: {
  code: string;
  address: string;
  size?: number;
  caption?: string;
}) {
  if (!address) return null;
  return (
    <figure className="inline-flex flex-col items-center gap-2">
      <div className="bg-white p-2 rounded border border-border">
        <QRCodeSVG value={paymentUri(code, address)} size={size} level="M" title={`${code} payment address QR code`} />
      </div>
      <figcaption className="text-[11px] text-muted-foreground">{caption ?? `Scan to pay with ${code}`}</figcaption>
    </figure>
  );
}
