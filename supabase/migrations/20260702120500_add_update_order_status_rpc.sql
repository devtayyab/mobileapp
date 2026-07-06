CREATE OR REPLACE FUNCTION public.update_order_status_from_shipment(p_order_id uuid, p_status order_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is a supplier for this order
  IF EXISTS (
    SELECT 1 FROM order_items oi
    JOIN suppliers s ON s.id = oi.supplier_id
    WHERE oi.order_id = p_order_id
    AND s.user_id = auth.uid()
  ) THEN
    -- Update the order status
    UPDATE orders
    SET status = p_status,
        updated_at = now()
    WHERE id = p_order_id;
  ELSE
    RAISE EXCEPTION 'Not authorized to update this order';
  END IF;
END;
$$;
