-- ============================================================================
-- Instant Stripe Payment Splits, Custom Commission Controls & Split Tracking
-- ============================================================================

-- 1. Global default platform commission rates on payment_settings (id = 1)
--    Default stays 11% for Retail (B2C) and 6% for Wholesale (B2B),
--    and Super Admin can customize either rate from Payment Settings.
ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS retail_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 11.00,
  ADD COLUMN IF NOT EXISTS b2b_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 6.00;

UPDATE public.payment_settings
SET
  retail_commission_rate = COALESCE(retail_commission_rate, 11.00),
  b2b_commission_rate = COALESCE(b2b_commission_rate, 6.00)
WHERE id = 1;

-- 2. Per-supplier custom commission override on suppliers
--    custom_commission_enabled defaults to FALSE so existing suppliers (which had
--    the legacy 10.00 default) automatically follow the platform default
--    (11% retail / 6% B2B) until Super Admin explicitly sets a custom rate.
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS custom_commission_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS b2b_commission_rate NUMERIC(5,2);

-- 3. Per-supplier shipping breakdown on orders so multi-supplier transfers
--    send each supplier their exact shipping fee (while VAT stays with Platform).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS supplier_shipping_breakdown JSONB DEFAULT '{}'::jsonb;

-- 4. Enhance payment_splits table for full Stripe transfer tracking & retry
ALTER TABLE public.payment_splits
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_splits_order_id ON public.payment_splits(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_status ON public.payment_splits(status);

-- Ensure clean, non-recursive RLS policies on payment_splits
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suppliers can view own payment splits" ON public.payment_splits;
CREATE POLICY "Suppliers can view own payment splits"
  ON public.payment_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers
      WHERE suppliers.id = payment_splits.supplier_id
        AND suppliers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all payment splits" ON public.payment_splits;
CREATE POLICY "Admins can view all payment splits"
  ON public.payment_splits FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all payment splits" ON public.payment_splits;
CREATE POLICY "Admins can manage all payment splits"
  ON public.payment_splits FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. SECURITY DEFINER RPC: read global commission defaults safely at checkout
--    (Buyers cannot read payment_settings directly because it holds stripe_secret_key.)
CREATE OR REPLACE FUNCTION public.get_platform_commission_rates()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retail NUMERIC(5,2);
  v_b2b NUMERIC(5,2);
BEGIN
  SELECT retail_commission_rate, b2b_commission_rate
  INTO v_retail, v_b2b
  FROM public.payment_settings
  WHERE id = 1;

  RETURN jsonb_build_object(
    'retail_commission_rate', COALESCE(v_retail, 11.00),
    'b2b_commission_rate', COALESCE(v_b2b, 6.00)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_commission_rates() TO authenticated, anon;

-- 6. SECURITY DEFINER RPC: resolve effective retail & B2B commission rates
--    for a list of suppliers (combines platform defaults + per-supplier custom override).
CREATE OR REPLACE FUNCTION public.get_supplier_commission_rates(p_supplier_ids UUID[])
RETURNS TABLE (
  supplier_id UUID,
  retail_rate NUMERIC,
  b2b_rate NUMERIC,
  custom_enabled BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_retail NUMERIC(5,2);
  v_default_b2b NUMERIC(5,2);
BEGIN
  SELECT COALESCE(retail_commission_rate, 11.00), COALESCE(b2b_commission_rate, 6.00)
  INTO v_default_retail, v_default_b2b
  FROM public.payment_settings
  WHERE id = 1;

  IF v_default_retail IS NULL THEN v_default_retail := 11.00; END IF;
  IF v_default_b2b IS NULL THEN v_default_b2b := 6.00; END IF;

  RETURN QUERY
  SELECT
    s.id AS supplier_id,
    CASE
      WHEN COALESCE(s.custom_commission_enabled, false) AND s.commission_rate IS NOT NULL
        THEN s.commission_rate
      ELSE v_default_retail
    END AS retail_rate,
    CASE
      WHEN COALESCE(s.custom_commission_enabled, false) AND COALESCE(s.b2b_commission_rate, s.commission_rate) IS NOT NULL
        THEN COALESCE(s.b2b_commission_rate, s.commission_rate)
      ELSE v_default_b2b
    END AS b2b_rate,
    COALESCE(s.custom_commission_enabled, false) AS custom_enabled
  FROM public.suppliers s
  WHERE s.id = ANY(p_supplier_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_supplier_commission_rates(UUID[]) TO authenticated, anon;
