/*
  Bulk update products in a single transaction, for the web admin's CSV import feature.
  security invoker: runs as the calling user, so it is still fully governed by the
  existing products RLS policies (is_admin() / supplier-owns-row) — no privilege escalation.
*/
create or replace function bulk_update_products(updates jsonb)
returns integer
language plpgsql
security invoker
as $$
declare
  rec jsonb;
  updated_count integer := 0;
begin
  for rec in select * from jsonb_array_elements(updates) loop
    update products set
      b2c_price = coalesce((rec->>'b2c_price')::numeric, b2c_price),
      b2b_price = coalesce((rec->>'b2b_price')::numeric, b2b_price),
      stock_quantity = coalesce((rec->>'stock_quantity')::integer, stock_quantity),
      is_active = coalesce((rec->>'is_active')::boolean, is_active),
      category_id = coalesce((rec->>'category_id')::uuid, category_id),
      updated_at = now()
    where id = (rec->>'id')::uuid;

    if found then
      updated_count := updated_count + 1;
    end if;
  end loop;

  return updated_count;
end;
$$;

grant execute on function bulk_update_products(jsonb) to authenticated;
