
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
  ('Amphetamine','amphetamine','Hard Drugs',1),
  ('Cocaine','cocaine','Hard Drugs',2),
  ('Heroin','heroin','Hard Drugs',3),
  ('Meth','meth','Hard Drugs',4),
  ('Opium','opium','Hard Drugs',5),
  ('Other','other','Hard Drugs',6),
  ('Cannabis','cannabis','Soft Drugs',7),
  ('DMT','dmt','Soft Drugs',8),
  ('LSD','lsd','Soft Drugs',9),
  ('MDMA','mdma','Soft Drugs',10);

-- SEED PRODUCTS
INSERT INTO public.products (name, slug, description, category_id, sort_order)
SELECT v.name, v.slug, v.description, c.id, v.sort_order
FROM (VALUES
  ('Buy LSD Powder Online – LSD Powder For Sale','lsd-powder','High purity LSD powder, laboratory tested and discreetly packaged.','lsd',1),
  ('Buy LSD Blotters Online','lsd-blotters','Classic blotter tabs, accurately dosed and sealed for transit.','lsd',2),
  ('Buy 50 mcg LSD Tablets Online – LSD Tablets','lsd-tablets','Pressed 50 mcg tablets, consistent dosing per unit.','lsd',3),
  ('LSD Liquid Online (25mg/10ml) – LSD Drops','lsd-liquid','Liquid LSD in a sealed dropper vial, 25mg per 10ml.','lsd',4),
  ('Buy JWH-018 Powder Online, AM-678 For Sale','jwh-018-powder','Research grade JWH-018 (AM-678) powder.','other',5),
  ('Buy Anadrol (Oxymetholone)','anadrol-oxymetholone','Oxymetholone, pharmaceutical grade, sealed packaging.','other',6),
  ('Buy Pure Cocaine Powder Online','cocaine-powder','Uncut, unpowderized cocaine delivered in chunks and rocks.','cocaine',7),
  ('Buy Crystal Meth Online','crystal-meth','High grade crystal, double sealed with Mylar barrier.','meth',8),
  ('Buy Heroin Powder Online','heroin-powder','White heroin powder, discreetly packaged.','heroin',9),
  ('Buy Afghan Opium Online','afghan-opium','Raw Afghan opium, vacuum sealed.','opium',10),
  ('Buy MDMA Crystals Online','mdma-crystals','Champagne MDMA crystals, lab tested.','mdma',11),
  ('Buy DMT Powder Online','dmt-powder','N,N-DMT crystalline powder.','dmt',12),
  ('Buy Cannabis Buds Online','cannabis-buds','Indoor grown premium buds, smell proof packaging.','cannabis',13),
  ('Buy Amphetamine Paste Online','amphetamine-paste','Amphetamine paste, high purity.','amphetamine',14)
) AS v(name, slug, description, cat_slug, sort_order)
JOIN public.categories c ON c.slug = v.cat_slug;

-- SEED GRAM PRICES
INSERT INTO public.product_prices (product_id, grams, price, sort_order)
SELECT p.id, g.grams, round((g.grams * r.per_gram)::numeric, 0), g.sort_order
FROM public.products p
JOIN (VALUES
  ('lsd-powder', 55::numeric),('lsd-blotters', 45),('lsd-tablets', 32),('lsd-liquid', 48),
  ('jwh-018-powder', 42),('anadrol-oxymetholone', 40),('cocaine-powder', 60),('crystal-meth', 38),
  ('heroin-powder', 65),('afghan-opium', 30),('mdma-crystals', 28),('dmt-powder', 70),
  ('cannabis-buds', 12),('amphetamine-paste', 22)
) AS r(slug, per_gram) ON r.slug = p.slug
CROSS JOIN (VALUES (5::numeric,1),(10,2),(25,3),(50,4),(100,5)) AS g(grams, sort_order);

-- SEED PAYMENT METHODS
INSERT INTO public.payment_methods (label, code, address, network, gateway_note, sort_order) VALUES
  ('Bitcoin (BTC)','BTC','bc1qexampleaddressreplaceinadmin0000000','Bitcoin','Bitcoin payment gateway',1),
  ('Monero (XMR)','XMR','44ExampleMoneroAddressReplaceInAdmin0000000000','Monero','Monero payment gateway',2);

-- SEED SHIPPING
INSERT INTO public.shipping_options (label, description, price, is_default, sort_order) VALUES
  ('Free shipping','Delivery 8-14 Days',0,true,1),
  ('Express Delivery','Priority handling',21,false,2);

-- SEED SETTINGS
INSERT INTO public.site_settings (key, value, label, sort_order) VALUES
  ('store_name','Ui Rebuild Plus','Store name',1),
  ('tagline','Discreet worldwide delivery','Tagline',2),
  ('contact_email','support@example.com','Contact email',3),
  ('currency_symbol','$','Currency symbol',4),
  ('footer_text','© Ui Rebuild Plus — discreet packaging on every order.','Footer text',5),
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
**Zero Liability Policy:** We will not disclose success rates, do not ask.

The vast majority of packages make it That said, **there are no reships in case of seizure**.

International Parcel Orders get **tracking if email is supplied during order**. For orders International please use what you know that has been sent to that address or **follow below:**
**Line 1:** Name
**Line 2:** Street Address
**Line 3:** (If Needed) Suburb, Locality, Or extended Street Address
**Line 4:** City and Postal Code Line 5: Country',1),
('shipping-and-packaging','SHIPPING AND PACKAGING',
'We are a team With the following structure for shipping. Product is sourced from South America to the United States and to Europe through Africa over land. Everything and anything is possible with us, from grams till containers full of product.

We know what we are doing and what we can and can not do, therefore we can give you honest answers and deliver you with outstanding service!.

All orders will be shipped out throughout US which makes it allot saver and easier to send. Everything will be packed with the necessary equipment and material specially selected for your country to ensure arrival in secrecy.

Packages get shipped from the United States or from Western Europe to our buyers we do not disclose exact locations. Do not ask us ridiculous things such as sending yachts or planes worth of cocaine… Small orders Envelops Packaged professionally with a discreet printed label. Time and care are given to every order regardless of size.

All of our packs are double sealed in plastic and then a Mylar barrier is used too. We do not crush or powderize our cocaine and it comes to you in chunks, rocks, pebbles and some powder with our cocaine orders.

Bulk orders Standard stealth, printed label, medium sized box from a franchised company .

Large electronic appliances for bulk packages We will send your bulk order (50kg-100kg)with freight/parcel shipping – International Freight Shipping companies based in Peru or The US depending on your location

We conceal the product as either clothes,office supplies,medicine packets or regular electronics with hidden compartments All of these orders are sent with a decoy.

Delivery estimates exclude weekends and national holidays.',2);
