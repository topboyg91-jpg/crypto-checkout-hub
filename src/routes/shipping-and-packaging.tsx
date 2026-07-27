import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "./delivery-time";

export const Route = createFileRoute("/shipping-and-packaging")({
  head: () => ({
    meta: [
      { title: "Shipping and Packaging — how Gramory ships your order" },
      {
        name: "description",
        content: "How orders are sourced, sealed and shipped, from single pouches to wholesale pallets.",
      },
      { property: "og:title", content: "Shipping and Packaging" },
      { property: "og:description", content: "How we pack and ship every order." },
    ],
  }),
  component: () => <ContentPage slug="shipping-and-packaging" />,
});
