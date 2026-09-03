/*
  Redefines bulk_update_products() to distinguish "field omitted" from
  "field explicitly set to null".

  The original version used coalesce((rec->>'f')::t, f), which meant a JSON null
  was indistinguishable from an absent key — both left the column unchanged.
  Two consequences:
    1. Nullable columns (b2b_price, category_id) could never be CLEARED.
    2. Undo could not restore a column that was previously null: reverting
       b2b_price from 10 back to null silently kept 10.

  Using the jsonb `?` key-existence operator fixes both: a key that is present
  is written (null included), a key that is absent is left alone.

  security invoker is retained, so the products RLS policies (is_admin() /
  supplier-owns-row) remain the only authority on what a caller may change.
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
      b2c_price = case when rec ? 'b2c_price'
                       then (rec->>'b2c_price')::numeric
                       else b2c_price end,
      b2b_price = case when rec ? 'b2b_price'
                       then (rec->>'b2b_price')::numeric
                       else b2b_price end,
      stock_quantity = case when rec ? 'stock_quantity'
                            then (rec->>'stock_quantity')::integer
                            else stock_quantity end,
      is_active = case when rec ? 'is_active'
                       then (rec->>'is_active')::boolean
                       else is_active end,
      category_id = case when rec ? 'category_id'
                         then (rec->>'category_id')::uuid
                         else category_id end,
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
