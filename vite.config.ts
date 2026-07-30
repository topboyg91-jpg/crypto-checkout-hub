// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { readFileSync } from "node:fs";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Static export is opt-in via `STATIC_BUILD=1 bun run build` (see README).
// Inside Lovable the preset is forced to Cloudflare, so prerendering is skipped there.
const staticBuild = process.env.STATIC_BUILD === "1";

/**
 * Product pages are data-driven, so the slug list is pulled from the database
 * once at build time and baked into the prerender list.
 */
function envValue(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(".env", "utf8")
      .split("\n")
      .find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

async function productPages(): Promise<Array<{ path: string }>> {
  const url = envValue("VITE_SUPABASE_URL");
  const key = envValue("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/products?select=slug&is_active=eq.true`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ slug: string }>;
    return rows
      .map((r) => (r.slug ?? "").trim())
      // Only URL-safe slugs can be baked into a file path; anything else is still
      // reachable at runtime through the SPA fallback (see deploy/nginx.conf).
      .filter((slug) => /^[A-Za-z0-9._~-]+$/.test(slug))
      .map((slug) => ({ path: `/product/${slug}` }));
  } catch {
    return [];
  }
}

const extraPages = staticBuild ? await productPages() : [];

export default defineConfig({
  // For the static export we skip nitro entirely: TanStack Start prerenders every
  // page to plain HTML in dist/client, which is all a Tor hidden service needs.
  nitro: staticBuild ? false : undefined,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    prerender: { enabled: staticBuild, crawlLinks: false, autoSubfolderIndex: true },
    pages: staticBuild
      ? [
      { path: "/" },
      { path: "/about" },
      { path: "/contact" },
      { path: "/cart" },
      { path: "/checkout" },
      { path: "/order-tracking" },
      { path: "/delivery-method" },
      { path: "/delivery-time" },
      { path: "/payment-and-delivery" },
      { path: "/shipping-and-packaging" },
      { path: "/admin" },
      { path: "/sitemap.xml" },
      ...extraPages,
        ]
      : [],
  },
});
