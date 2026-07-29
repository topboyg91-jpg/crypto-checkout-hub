import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

// Derived per-request so the same build works on a .onion address, a clearnet
// domain, or localhost without rebaking a hostname into the bundle.
function baseUrlFrom(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = forwardedHost ?? url.host;
  // Tor hidden services are plain HTTP behind the onion transport.
  const proto = forwardedProto ?? (host.endsWith(".onion") ? "http" : url.protocol.replace(":", ""));
  return `${proto}://${host}`;
}

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const BASE_URL = baseUrlFrom(request);
        const { data } = await supabase
          .from("products")
          .select("slug")
          .eq("is_active", true)
          .returns<{ slug: string }[]>();

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/order-tracking", changefreq: "monthly", priority: "0.6" },
          { path: "/payment-and-delivery", changefreq: "monthly", priority: "0.6" },
          { path: "/delivery-method", changefreq: "monthly", priority: "0.6" },
          { path: "/delivery-time", changefreq: "monthly", priority: "0.6" },
          { path: "/shipping-and-packaging", changefreq: "monthly", priority: "0.6" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/contact", changefreq: "monthly", priority: "0.5" },
          ...(data ?? []).map((p) => ({
            path: `/product/${p.slug}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
