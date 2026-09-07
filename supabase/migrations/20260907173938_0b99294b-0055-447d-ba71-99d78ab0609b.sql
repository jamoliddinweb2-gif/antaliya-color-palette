CREATE TABLE public.categories (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  "imageUrl" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.customers (
  id bigserial PRIMARY KEY,
  phone text NOT NULL UNIQUE,
  name text,
  "avatarUrl" text,
  language text DEFAULT 'uz',
  "telegramId" text,
  "savedAddress" text,
  "lastNotificationReadAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.couriers (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  lat double precision,
  lng double precision,
  "locationUpdatedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.products (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  description text,
  price double precision NOT NULL,
  "oldPrice" double precision,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  "categoryId" bigint REFERENCES public.categories(id) ON DELETE SET NULL,
  "inStock" boolean NOT NULL DEFAULT true,
  unit text NOT NULL DEFAULT 'dona',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cart (
  id bigserial PRIMARY KEY,
  "customerId" bigint NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  "productId" bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.liked (
  id bigserial PRIMARY KEY,
  "customerId" bigint NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  "productId" bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.orders (
  id bigserial PRIMARY KEY,
  "customerId" bigint NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  "courierId" bigint REFERENCES public.couriers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new',
  "deliveryMethod" text NOT NULL,
  "paymentMethod" text NOT NULL,
  address text,
  note text,
  "promoCode" text,
  "discountAmount" double precision NOT NULL DEFAULT 0,
  "totalPrice" double precision NOT NULL,
  "deliveryFee" double precision NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.order_items (
  id bigserial PRIMARY KEY,
  "orderId" bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  "productId" bigint,
  "productName" text NOT NULL,
  "productImage" text,
  quantity integer NOT NULL,
  price double precision NOT NULL
);
CREATE TABLE public.messages (
  id bigserial PRIMARY KEY,
  "customerId" bigint NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  "senderType" text NOT NULL,
  text text NOT NULL DEFAULT '',
  "mediaUrl" text,
  "mediaType" text,
  "isRead" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.banners (
  id bigserial PRIMARY KEY,
  "imageUrl" text NOT NULL,
  title text,
  link text,
  "isActive" boolean NOT NULL DEFAULT true,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.settings (
  id bigserial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.promo_codes (
  id bigserial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  "discountType" text NOT NULL DEFAULT 'fixed',
  "discountAmount" double precision NOT NULL,
  "maxUses" integer,
  "usedCount" integer NOT NULL DEFAULT 0,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.promo_code_usages (
  id bigserial PRIMARY KEY,
  "promoCodeId" bigint NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  "customerId" bigint NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  "orderId" bigint REFERENCES public.orders(id) ON DELETE SET NULL,
  "usedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.notifications (
  id bigserial PRIMARY KEY,
  message text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.customers TO service_role;
GRANT ALL ON public.couriers TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.cart TO service_role;
GRANT ALL ON public.liked TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.banners TO service_role;
GRANT ALL ON public.settings TO service_role;
GRANT ALL ON public.promo_codes TO service_role;
GRANT ALL ON public.promo_code_usages TO service_role;
GRANT ALL ON public.notifications TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

INSERT INTO public.settings (key, value) VALUES
  ('siteName', 'Como Pizza'),
  ('supportPhone', '+998901234567'),
  ('deliveryFee', '15000'),
  ('freeDeliveryThreshold', '200000'),
  ('adminPassword', 'admin123'),
  ('chefPassword', 'chef123'),
  ('workDays', '[0,1,2,3,4,5,6]');

INSERT INTO public.categories (id, name) VALUES
  (1, 'Pitsalar'), (2, 'Lavash va burger'), (3, 'Ichimliklar'), (4, 'Shirinliklar');
SELECT setval('public.categories_id_seq', 4, true);

INSERT INTO public.products (name, description, price, "oldPrice", "categoryId", unit) VALUES
  ('Margarita', 'Pomidor sousi, motsarella, rayhon', 55000, NULL, 1, 'dona'),
  ('Pepperoni', 'Pepperoni kolbasa, motsarella, pomidor sousi', 72000, 80000, 1, 'dona'),
  ('To''rt xil pishloq', 'Motsarella, chedder, parmezan, dor blyu', 85000, NULL, 1, 'dona'),
  ('Como Special', 'Go''sht, qo''ziqorin, qalampir, zaytun', 95000, NULL, 1, 'dona'),
  ('Tovuqli lavash', 'Tovuq filesi, sabzavot, maxsus sous', 32000, NULL, 2, 'dona'),
  ('Chizburger', 'Mol go''shti kotleti, chedder, tuzlangan bodring', 38000, NULL, 2, 'dona'),
  ('Coca-Cola 1L', 'Sovutilgan gazli ichimlik', 12000, NULL, 3, 'dona'),
  ('Limonad', 'Uy limonadi, limon va yalpiz', 15000, NULL, 3, 'dona'),
  ('Tiramisu', 'Klassik italyan shirinligi', 28000, NULL, 4, 'dona'),
  ('Cheesecake', 'Nyu-York uslubidagi chizkeyk', 30000, NULL, 4, 'dona');