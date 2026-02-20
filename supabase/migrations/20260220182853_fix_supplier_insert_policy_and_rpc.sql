/*
  # Fix Supplier INSERT Policy and Add Create Supplier RPC

  1. Problem
    - Suppliers table has RLS enabled but no INSERT policy
    - Authenticated users get "new row violates row-level security policy" error

  2. Fix
    - Add INSERT policy for suppliers table
    - Add SECURITY DEFINER RPC function to create supplier profiles reliably
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'suppliers' AND policyname = 'Suppliers can insert own profile'
  ) THEN
    CREATE POLICY "Suppliers can insert own profile"
      ON suppliers
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.create_supplier_profile(p_business_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_supplier_id
  FROM suppliers
  WHERE user_id = v_user_id;

  IF v_supplier_id IS NOT NULL THEN
    RETURN v_supplier_id;
  END IF;

  INSERT INTO suppliers (user_id, business_name, kyc_status, is_active, commission_rate)
  VALUES (v_user_id, p_business_name, 'pending', true, 10)
  RETURNING id INTO v_supplier_id;

  RETURN v_supplier_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_supplier_profile(text) TO authenticated;
