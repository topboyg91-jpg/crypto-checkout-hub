import { useState } from "react";
import { productGradient } from "@/lib/store";

/**
 * Turns a pasted share link into something an <img> can actually load.
 * Hosts like ibb.co, imgur or Google Drive hand out page links, not files.
 */
export function resolveImageUrl(raw: string | null | undefined): string | null {
  const url = (raw ?? "").trim();
  if (!url) return null;
  if (url.startsWith("/") || url.startsWith("data:")) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  const id = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
  const hasExt = /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(parsed.pathname);

  if (host === "ibb.co" && id && !hasExt) return `https://i.ibb.co/${id}.jpg`;
  if (host === "imgur.com" && id && !hasExt) return `https://i.imgur.com/${id}.jpg`;
  if (host === "drive.google.com") {
    const fileId = parsed.pathname.match(/\/d\/([^/]+)/)?.[1] ?? parsed.searchParams.get("id");
    if (fileId) return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  if (host === "dropbox.com") {
    parsed.searchParams.set("raw", "1");
    parsed.searchParams.delete("dl");
    return parsed.toString();
  }
  if (host === "github.com" && parsed.pathname.includes("/blob/")) {
    return `https://raw.githubusercontent.com${parsed.pathname.replace("/blob/", "/")}`;
  }
  return parsed.toString();
}

/** Product image with a gradient fallback when there is no image, or it fails to load. */
export function ProductImage({
  src,
  name,
  className = "",
}: {
  src: string | null | undefined;
  name: string;
  className?: string;
}) {
  const resolved = resolveImageUrl(src);
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) {
    return <span className={className} style={{ background: productGradient(name) }} aria-hidden="true" />;
  }

  return (
    <img
      src={resolved}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} object-cover`}
    />
  );
}