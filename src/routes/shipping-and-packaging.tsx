import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "./delivery-time";

export const Route = createFileRoute("/shipping-and-packaging")({
  head: () => ({
    meta: [
      { title: "Shipping and Packaging — discreet stealth packaging" },
      {
        name: "description",
        content: "How orders are sourced, sealed and shipped, from small envelopes to bulk freight consignments.",
      },
      { property: "og:title", content: "Shipping and Packaging" },
      { property: "og:description", content: "How we pack and ship every order discreetly." },
    ],
  }),
  component: () => <ContentPage slug="shipping-and-packaging" />,
});
