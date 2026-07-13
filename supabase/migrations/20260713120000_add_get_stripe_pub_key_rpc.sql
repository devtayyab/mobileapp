CREATE OR REPLACE FUNCTION get_stripe_publishable_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pub_key TEXT;
BEGIN
    SELECT stripe_publishable_key INTO pub_key FROM public.payment_settings WHERE id = 1;
    RETURN pub_key;
END;
$$;

GRANT EXECUTE ON FUNCTION get_stripe_publishable_key() TO PUBLIC;
