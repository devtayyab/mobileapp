/*
  Fix: suppliers could not replace/resubmit their own KYC documents.

  `kyc_documents` had RLS policies for supplier SELECT and INSERT, and UPDATE
  only for admins (20260115152126, 20260221081011). The supplier-side
  "Replace Document" flow issues an UPDATE, which RLS silently filtered to zero
  rows — no error was raised, so the mobile app reported success while nothing
  was written. This affects the mobile app (app/supplier/kyc.tsx) as well as the
  new web KYC screen.

  This adds the missing supplier UPDATE policy, scoped exactly like the existing
  supplier SELECT/INSERT policies: the row's supplier must belong to the caller.
  WITH CHECK repeats the condition so a supplier cannot reassign a document to
  another supplier.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'kyc_documents'
      AND policyname = 'Suppliers can update own KYC documents'
  ) THEN
    CREATE POLICY "Suppliers can update own KYC documents"
      ON kyc_documents FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM suppliers
          WHERE suppliers.id = kyc_documents.supplier_id
          AND suppliers.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM suppliers
          WHERE suppliers.id = supplier_id
          AND suppliers.user_id = auth.uid()
        )
      );
  END IF;
END $$;
