export type Category = {
  name: string;
  slug: string;
  group: string;
};

export type GiftCard = {
  slug: string;
  name: string;
  description: string;
  priceMin: number;
  priceMax: number;
  categorySlug: string;
  denominations: number[];
};

export const CATEGORIES: Category[] = [
  { name: "Retail", slug: "retail", group: "Popular" },
  { name: "Amazon", slug: "amazon", group: "Popular" },
  { name: "Walmart", slug: "walmart", group: "Popular" },
  { name: "Target", slug: "target", group: "Popular" },
  { name: "Best Buy", slug: "best-buy", group: "Popular" },
  { name: "Entertainment", slug: "entertainment", group: "Entertainment" },
  { name: "Netflix", slug: "netflix", group: "Entertainment" },
  { name: "Spotify", slug: "spotify", group: "Entertainment" },
  { name: "Steam", slug: "steam", group: "Entertainment" },
  { name: "Xbox", slug: "xbox", group: "Entertainment" },
  { name: "Food & Dining", slug: "food", group: "Food & Dining" },
  { name: "Starbucks", slug: "starbucks", group: "Food & Dining" },
  { name: "Uber Eats", slug: "uber-eats", group: "Food & Dining" },
];

function denoms(min: number, max: number): number[] {
  const steps = [min, Math.round((min + max) / 4), Math.round((min + max) / 2), max];
  return Array.from(new Set(steps)).sort((a, b) => a - b);
}

const RAW: Array<[string, string, number, number, string]> = [
  ["Amazon Gift Card", "Redeemable on Amazon.com for millions of items.", 25, 500, "amazon"],
  ["Walmart Gift Card", "Use in-store or online at Walmart.", 25, 250, "walmart"],
  ["Target Gift Card", "Perfect for everyday shopping runs.", 25, 300, "target"],
  ["Best Buy Gift Card", "Electronics, appliances and more.", 50, 500, "best-buy"],
  ["Netflix Gift Card", "1, 3, 6 or 12 month subscriptions.", 30, 200, "netflix"],
  ["Spotify Premium Card", "Ad-free music streaming, any plan.", 10, 120, "spotify"],
  ["Steam Wallet Code", "Credit for games on the Steam platform.", 20, 200, "steam"],
  ["Xbox Gift Card", "Games, add-ons and Game Pass.", 25, 250, "xbox"],
  ["Starbucks eGift Card", "For the morning coffee ritual.", 10, 150, "starbucks"],
  ["Uber Eats Gift Card", "Food delivered to your door.", 25, 200, "uber-eats"],
  ["Apple Gift Card", "Apps, music and iCloud storage.", 25, 500, "entertainment"],
  ["Google Play Gift Card", "Android apps, games and books.", 15, 200, "entertainment"],
  ["PlayStation Store Card", "PS5 and PS4 games and DLC.", 20, 200, "xbox"],
  ["Nintendo eShop Card", "Switch games and downloadable content.", 20, 100, "entertainment"],
  ["DoorDash Gift Card", "Restaurants, groceries and more.", 25, 200, "food"],
  ["Airbnb Gift Card", "Stays and experiences worldwide.", 100, 1000, "retail"],
  ["Sephora Gift Card", "Beauty, skincare and fragrance.", 25, 300, "retail"],
  ["Nike Gift Card", "Footwear and apparel.", 25, 500, "retail"],
  ["Home Depot Card", "Tools and home improvement.", 50, 500, "retail"],
  ["Visa eGift Card", "Use anywhere Visa is accepted.", 50, 500, "retail"],
  ["Uber Ride Credit", "Credit toward Uber rides.", 20, 200, "food"],
  ["Hulu Gift Card", "Streaming for shows and movies.", 25, 100, "entertainment"],
  ["Roblox Gift Card", "Robux and premium subscriptions.", 10, 100, "entertainment"],
  ["IKEA Gift Card", "Furniture and home essentials.", 25, 500, "retail"],
];

export const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const GIFT_CARDS: GiftCard[] = RAW.map(([name, description, priceMin, priceMax, categorySlug]) => ({
  slug: slugify(name),
  name,
  description,
  priceMin,
  priceMax,
  categorySlug,
  denominations: denoms(priceMin, priceMax),
}));

export function getCard(slug: string): GiftCard | undefined {
  return GIFT_CARDS.find((c) => c.slug === slug);
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function priceLabel(card: GiftCard): string {
  return card.priceMax > card.priceMin
    ? `$${card.priceMin} – $${card.priceMax}`
    : `$${card.priceMin}`;
}

export function money(v: number): string {
  return `$${v.toFixed(2)}`;
}

/** Deterministic gradient so each card looks distinct without image assets. */
export function cardGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const h1 = hash % 360;
  const h2 = (h1 + 40 + (hash % 80)) % 360;
  return `linear-gradient(135deg, hsl(${h1} 70% 55%), hsl(${h2} 75% 45%))`;
}

export const SETTINGS = {
  brandName: "GiftShop",
  tagline: "Digital Gift Cards, Instant Delivery",
  email: "hello@giftshop.example",
  footer: "© GiftShop — every card delivered digitally within minutes.",
};
