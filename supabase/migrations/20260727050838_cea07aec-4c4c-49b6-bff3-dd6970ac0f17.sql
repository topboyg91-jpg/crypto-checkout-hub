
-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  group_label text NOT NULL DEFAULT 'Products',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories open" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  image_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products open" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- PRICES BY GRAMS
CREATE TABLE public.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  grams numeric NOT NULL,
  price numeric NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_prices TO anon, authenticated;
GRANT ALL ON public.product_prices TO service_role;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_prices open" ON public.product_prices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- PAYMENT METHODS
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  code text NOT NULL,
  address text NOT NULL DEFAULT '',
  network text NOT NULL DEFAULT '',
  gateway_note text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO anon, authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_methods open" ON public.payment_methods FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- SHIPPING OPTIONS
CREATE TABLE public.shipping_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_options TO anon, authenticated;
GRANT ALL ON public.shipping_options TO service_role;
ALTER TABLE public.shipping_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipping_options open" ON public.shipping_options FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- SETTINGS
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings open" ON public.site_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- CONTENT PAGES
CREATE TABLE public.content_pages (
  slug text PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_pages TO anon, authenticated;
GRANT ALL ON public.content_pages TO service_role;
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_pages open" ON public.content_pages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text NOT NULL DEFAULT '',
  email text NOT NULL,
  notes text NOT NULL DEFAULT '',
  shipping_label text NOT NULL DEFAULT '',
  shipping_price numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_code text NOT NULL DEFAULT '',
  payment_address text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Awaiting payment',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders open" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  grams numeric NOT NULL,
  unit_price numeric NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  line_total numeric NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items open" ON public.order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- SEED CATEGORIES
INSERT INTO public.categories (name, slug, group_label, sort_order) VALUES
  ('Espresso Blends','espresso-blends','Coffee',1),
  ('Single Origin','single-origin','Coffee',2),
  ('Decaf','decaf','Coffee',3),
  ('Cocoa','cocoa','Coffee',4),
  ('Green Tea','green-tea','Tea',5),
  ('Black Tea','black-tea','Tea',6),
  ('Herbal Infusions','herbal-infusions','Tea',7),
  ('Whole Spices','whole-spices','Spices',8),
  ('Ground Spices','ground-spices','Spices',9),
  ('Rare & Reserve','rare-reserve','Spices',10);

-- SEED PRODUCTS
INSERT INTO public.products (name, slug, description, category_id, sort_order)
SELECT v.name, v.slug, v.description, c.id, v.sort_order
FROM (VALUES
  ('Ethiopia Yirgacheffe – Washed Single Origin','ethiopia-yirgacheffe','Bright, floral washed lot with jasmine and bergamot. Roasted to order.','single-origin',1),
  ('Colombia Huila – Whole Bean','colombia-huila','Balanced and caramel-sweet with a soft red apple finish.','single-origin',2),
  ('Kenya AA Nyeri – Reserve Lot','kenya-aa-nyeri','Blackcurrant and grapefruit acidity, a classic Kenyan cup.','single-origin',3),
  ('House Espresso Blend No. 4','house-espresso-4','Chocolate, hazelnut and dried fig. Built for milk drinks.','espresso-blends',4),
  ('Swiss Water Decaf – Brazil','swiss-water-decaf-brazil','Chemical-free decaffeination, nutty and low acid.','decaf',5),
  ('Single Origin Cocoa Nibs – Ecuador','cocoa-nibs-ecuador','Roasted and cracked Arriba Nacional nibs for brewing and baking.','cocoa',6),
  ('Uji Sencha – First Flush','uji-sencha','Grassy, umami-rich Japanese green tea from Kyoto.','green-tea',7),
  ('Jasmine Pearls – Hand Rolled','jasmine-pearls','Green tea pearls scented over fresh jasmine blossom.','green-tea',8),
  ('Assam Second Flush – Loose Leaf','assam-second-flush','Malty and full bodied, excellent with milk.','black-tea',9),
  ('Chamomile Blossom – Whole Flower','chamomile-blossom','Egyptian whole-flower chamomile, honeyed and calming.','herbal-infusions',10),
  ('Tellicherry Black Peppercorns','tellicherry-peppercorns','Late-harvest Indian peppercorns, bold and citrusy.','whole-spices',11),
  ('Ceylon Cinnamon Quills','ceylon-cinnamon-quills','True cinnamon quills, delicate and sweet.','whole-spices',12),
  ('Smoked Sweet Paprika – La Vera','smoked-paprika-la-vera','Oak-smoked Spanish paprika, deep red and fragrant.','ground-spices',13),
  ('Saffron Threads – Super Negin','saffron-super-negin','All-red Super Negin threads, graded for aroma and colour.','rare-reserve',14)
) AS v(name, slug, description, cat_slug, sort_order)
JOIN public.categories c ON c.slug = v.cat_slug;

-- SEED GRAM PRICES
INSERT INTO public.product_prices (product_id, grams, price, sort_order)
SELECT p.id, g.grams, round((g.grams * r.per_gram)::numeric, 2), g.sort_order
FROM public.products p
JOIN (VALUES
  ('ethiopia-yirgacheffe', 0.09::numeric),('colombia-huila', 0.07),('kenya-aa-nyeri', 0.11),('house-espresso-4', 0.06),
  ('swiss-water-decaf-brazil', 0.08),('cocoa-nibs-ecuador', 0.05),('uji-sencha', 0.22),('jasmine-pearls', 0.26),
  ('assam-second-flush', 0.12),('chamomile-blossom', 0.10),('tellicherry-peppercorns', 0.09),('ceylon-cinnamon-quills', 0.14),
  ('smoked-paprika-la-vera', 0.08),('saffron-super-negin', 9.50)
) AS r(slug, per_gram) ON r.slug = p.slug
CROSS JOIN (VALUES (25::numeric,1),(50,2),(100,3),(250,4),(500,5)) AS g(grams, sort_order);

-- SEED PAYMENT METHODS
INSERT INTO public.payment_methods (label, code, address, network, gateway_note, sort_order) VALUES
  ('Bitcoin (BTC)','BTC','bc1qexampleaddressreplaceinadmin0000000','Bitcoin','Bitcoin payment gateway',1),
  ('USD Coin (USDC)','USDC','0xExampleUsdcAddressReplaceInAdmin000000','Ethereum','USDC payment gateway',2);

-- SEED SHIPPING
INSERT INTO public.shipping_options (label, description, price, is_default, sort_order) VALUES
  ('Free shipping','Delivery 8-14 Days',0,true,1),
  ('Express Delivery','Priority handling',21,false,2);

-- SEED SETTINGS
INSERT INTO public.site_settings (key, value, label, sort_order) VALUES
  ('store_name','Gramory','Store name',1),
  ('tagline','Specialty coffee, tea and spice by the gram','Tagline',2),
  ('contact_email','support@gramory.example','Contact email',3),
  ('currency_symbol','$','Currency symbol',4),
  ('footer_text','© Gramory — roasted, blended and packed to order.','Footer text',5),
  ('checkout_notice','Since your browser does not support JavaScript, or it is disabled, please ensure you click the Update Totals button before placing your order. You may be charged more than the amount stated above if you fail to do so.','Checkout notice',6),
  ('search_placeholder','Search…','Search placeholder',7);

-- SEED CONTENT PAGES
INSERT INTO public.content_pages (slug, title, body, sort_order) VALUES
('delivery-time','Delivery Time',
'**North America**: 1 – 4 days
**South America**: 1-3 days
**Western European countries**: 7-10 working days
**Asia**: 12-20 working days
**Eastern Europe and Russia**: 8-12 days
**Australia & New Zealand**: 15-31 days
**AFRICA**: 12-27 days

Roasting happens the morning your order ships, so coffee leaves us at peak freshness.

Every international parcel gets **tracking if an email is supplied during order**. Please format your address as follows:
**Line 1:** Name
**Line 2:** Street Address
**Line 3:** (If Needed) Suburb, Locality, Or extended Street Address
**Line 4:** City and Postal Code
**Line 5:** Country',1),
('shipping-and-packaging','SHIPPING AND PACKAGING',
'We work directly with growers and cooperatives. Coffee is sourced from South and Central America and East Africa, tea from Japan, China and India, and spices from India, Sri Lanka and Spain.

Everything is bought at origin, imported through our own customs broker and stored in a temperature-controlled warehouse until you order. Nothing sits on a shelf for months.

All orders ship from the United States or Western Europe, whichever is closer to you. Small orders travel in resealable, food-grade pouches with a one-way degassing valve, packed inside a padded mailer with a printed label.

Larger orders are packed in kraft boxes with recycled fill. Wholesale volumes (25kg and up) ship on pallets with a freight partner — contact us before ordering at that scale so we can quote the correct rate.

Every pouch is nitrogen-flushed and heat-sealed, then labelled with the lot, roast or harvest date and the exact weight. Spices are packed in amber-tinted pouches to protect them from light.

Delivery estimates exclude weekends and national holidays.',2);
