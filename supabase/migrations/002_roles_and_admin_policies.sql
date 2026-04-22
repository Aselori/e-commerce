-- ============================================================
-- 002_roles_and_admin_policies.sql
-- User roles (customer / admin) and admin-level RLS policies.
-- ============================================================


-- ============================================================
-- PROFILES TABLE
-- ============================================================

CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'customer'
               CHECK (role IN ('customer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);


-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- is_admin() HELPER
-- SECURITY DEFINER so callers can use it inside RLS without
-- needing direct read access to profiles rows other than their own.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


-- ============================================================
-- ADMIN POLICIES
-- ============================================================

-- products: admins can insert / update / delete
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- categories: admins can insert / update / delete
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- orders: admins see everything, admins update everything
CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- order_items: admins see everything
CREATE POLICY "Admins can read all order items"
  ON order_items FOR SELECT
  USING (public.is_admin());

-- payment_receipts: admins see and update everything
CREATE POLICY "Admins can read all receipts"
  ON payment_receipts FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update receipts"
  ON payment_receipts FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
