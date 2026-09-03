/*
  Fix: admins could not create or delete categories.

  History:
    20260115152126  created "Admins can manage categories" (FOR ALL)
    20260115164339  DROPPED it while fixing policy recursion, and replaced it
                    with a SELECT-only policy — never restoring write access
    20260221081011  re-added UPDATE only
    20260713123000  added INSERT for SUPPLIERS only
                    (EXISTS (SELECT 1 FROM suppliers WHERE user_id = auth.uid()))

  Net effect on the live database:
    - INSERT fails for any admin without a `suppliers` row (PostgREST 42501)
    - DELETE has NO policy at all, so it silently affects 0 rows and returns no
      error — the mobile admin screen reports success while nothing is deleted

  This restores explicit admin INSERT and DELETE. is_admin() is SECURITY DEFINER
  (20260221081011), so it does not reintroduce the profiles recursion that
  20260115164339 was fixing. UPDATE/SELECT are left as they are.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'categories' AND policyname = 'Admin can insert categories'
  ) THEN
    CREATE POLICY "Admin can insert categories"
      ON categories FOR INSERT
      TO authenticated
      WITH CHECK (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'categories' AND policyname = 'Admin can delete categories'
  ) THEN
    CREATE POLICY "Admin can delete categories"
      ON categories FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;
