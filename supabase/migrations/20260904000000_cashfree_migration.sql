-- Non-destructive migration for the existing Velnora schema.
-- Review and apply this file in the existing Supabase project; it is not executed by the app.

DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'razorpay_order_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cashfree_order_id') THEN
    ALTER TABLE public.orders RENAME COLUMN razorpay_order_id TO cashfree_order_id;
  END IF;
  IF to_regclass('public.orders') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'razorpay_payment_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cashfree_payment_id') THEN
    ALTER TABLE public.orders RENAME COLUMN razorpay_payment_id TO cashfree_payment_id;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashfree_order_id text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashfree_payment_id text;
    CREATE UNIQUE INDEX IF NOT EXISTS orders_cashfree_order_id_key ON public.orders (cashfree_order_id) WHERE cashfree_order_id IS NOT NULL;
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON public.contact_messages (created_at DESC);

-- Payment status is intentionally excluded from client update policies.
DROP POLICY IF EXISTS "Users can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update payment status" ON public.orders;
CREATE POLICY "Admins can update payment and order status" ON public.orders
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
