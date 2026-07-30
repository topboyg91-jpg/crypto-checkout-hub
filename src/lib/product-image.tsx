import { useEffect, useState } from "react";
import { productGradient } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_BUCKET = "product-images";
const LEGACY_PREFIX = "/api/public/product-image/";

/** Object-URL cache so the same image is only downloaded once per session. */
const objectUrlCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();

/** `storage:<path>` (or the legacy API path) → a path inside the images bucket. */
export function storagePath(raw: string | null | undefined): string | null {
  const url = (raw ?? "").trim();
  if (!url) return null;
  if (url.startsWith("storage:")) return decodeURIComponent(url.slice("storage:".length));
  if (url.startsWith(LEGACY_PREFIX)) return decodeURIComponent(url.slice(LEGACY_PREFIX.length));
  return null;
}

async function loadFromStorage(path: string): Promise<string | null> {
  const cached = objectUrlCache.get(path);
  if (cached) return cached;
  const pending = inFlight.get(path);
  if (pending) return pending;

  const task = (async () => {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);
    if (error || !data) return null;
    const objectUrl = URL.createObjectURL(data);
    objectUrlCache.set(path, objectUrl);
    return objectUrl;
  })().finally(() => inFlight.delete(path));

  inFlight.set(path, task);
  return task;
}

/**
 * Turns a pasted share link into something an <img> can actually load.
 * Hosts like ibb.co, imgur or Google Drive hand out page links, not files.
 */
export function resolveImageUrl(raw: string | null | undefined): string | null {
  const url = (raw ?? "").trim();
  if (!url) return null;
  if (storagePath(url)) return null; // resolved asynchronously by <ProductImage />
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
  const path = storagePath(src);
  const direct = resolveImageUrl(src);
  const [failed, setFailed] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(() => (path ? (objectUrlCache.get(path) ?? null) : null));

  useEffect(() => {
    if (!path || objectUrlCache.get(path)) return;
    let active = true;
    void loadFromStorage(path).then((url) => {
      if (!active) return;
      if (url) setObjectUrl(url);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [path]);

  const resolved = path ? objectUrl : direct;

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