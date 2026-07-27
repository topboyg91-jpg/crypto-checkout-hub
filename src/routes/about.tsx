import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { InfoCard, InfoPage, useSettings } from "@/components/site-chrome";
import { categoriesQuery } from "@/lib/store";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About us — Gramory specialty coffee, tea & spice" },
      { name: "description", content: "A small team roasting, blending and shipping specialty coffee, tea and spices worldwide, with crypto checkout." },
      { property: "og:title", content: "About us" },
      { property: "og:description", content: "Who we are and how the store works." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const settings = useSettings();
  const { data: categories } = useQuery(categoriesQuery);
  const groups = [...new Set((categories ?? []).map((c) => c.group_label))];

  return (
    <InfoPage title="About us" lead="Straightforward ordering, careful packing, worldwide reach.">
      <InfoCard title="What we do">
        <p>
          {settings.store_name ?? "We"} ships worldwide from stock held in the United States and Western Europe. Every
          product is priced and sold by weight in grams, so you order exactly the amount you need.
        </p>
      </InfoCard>
      <InfoCard title="Our catalogue">
        <ul className="list-disc pl-5 space-y-1">
          {groups.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </InfoCard>
      <InfoCard title="Support">
        <p>Questions about an order go to {settings.contact_email ?? "our support address"} — usually answered same day.</p>
      </InfoCard>
    </InfoPage>
  );
}
