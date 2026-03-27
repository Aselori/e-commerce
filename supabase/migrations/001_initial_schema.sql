-- ============================================================
-- 001_initial_schema.sql
-- Initial schema for the e-commerce order management system.
-- ============================================================


-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  price       numeric,
  stock       integer NOT NULL DEFAULT 0,
  category_id uuid REFERENCES categories (id) ON DELETE SET NULL,
  type        text NOT NULL CHECK (type IN ('individual', 'kit')),
  images      text[],
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     text UNIQUE NOT NULL,
  user_id          uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN (
                       'pending',
                       'payment_review',
                       'confirmed',
                       'shipped',
                       'ready_for_pickup',
                       'delivered',
                       'cancelled'
                     )),
  delivery_method  text NOT NULL CHECK (delivery_method IN ('shipping', 'pickup')),
  shipping_address jsonb,
  postal_code      text,
  shipping_cost    numeric,
  total            numeric NOT NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity   integer NOT NULL,
  unit_price numeric NOT NULL
);

CREATE TABLE payment_receipts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  image_url  text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed   boolean NOT NULL DEFAULT false
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;


-- categories — public read
CREATE POLICY "Public can read categories"
  ON categories FOR SELECT
  USING (true);

-- products — public read (only active products to anonymous visitors)
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (active = true);

-- orders — authenticated users can manage their own orders
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- order_items — access is inherited through the parent order
CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create items on own orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- payment_receipts — access is inherited through the parent order
CREATE POLICY "Users can read own payment receipts"
  ON payment_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_receipts.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload receipts on own orders"
  ON payment_receipts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_receipts.order_id
        AND orders.user_id = auth.uid()
    )
  );


-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Product images — public read, no auth required to view
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Payment receipt photos — private, authenticated access only
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- products bucket: anyone can read; authenticated users can upload
CREATE POLICY "Public read access for product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

-- receipts bucket: users can upload and read their own receipts only.
-- The path convention is receipts/{user_id}/{filename}, enforced here.
CREATE POLICY "Users can upload their own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
