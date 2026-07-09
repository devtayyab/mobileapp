-- Add Stripe Connect fields to suppliers table
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;

-- Create an index to quickly find suppliers by stripe_account_id if needed
CREATE INDEX IF NOT EXISTS idx_suppliers_stripe_account_id ON public.suppliers(stripe_account_id);
