/*
  Admin dashboard platform statistics.

  Why an RPC instead of client-side summing:
  1. Correctness — the previous approach fetched `orders.total` rows and summed
     them in JS, so PostgREST's default max-rows limit silently capped the total
     once the orders table grew. Aggregating in SQL has no such ceiling.
  2. `orders.currency` varies per row, so a single blended sum is meaningless.
     Revenue is therefore returned grouped BY currency.

  security invoker: runs as the caller, so the existing admin RLS policies on
  orders/profiles/suppliers/products still apply — no privilege escalation.
*/
create or replace function admin_platform_stats()
returns jsonb
language plpgsql
security invoker
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total_users', (select count(*) from profiles),
    'total_suppliers', (select count(*) from suppliers),
    'pending_kyc', (select count(*) from suppliers where kyc_status = 'pending'),
    'under_review_kyc', (select count(*) from suppliers where kyc_status = 'under_review'),
    'approved_kyc', (select count(*) from suppliers where kyc_status = 'approved'),
    'total_products', (select count(*) from products),
    'active_products', (select count(*) from products where is_active = true),
    'total_orders', (select count(*) from orders),
    -- One row per currency: [{ currency, revenue, commission, orders }, ...]
    'revenue_by_currency', coalesce(
      (
        select jsonb_agg(row_to_json(t))
        from (
          select
            coalesce(currency, 'USD') as currency,
            sum(total)               as revenue,
            sum(platform_commission) as commission,
            count(*)                 as orders
          from orders
          group by coalesce(currency, 'USD')
          order by sum(total) desc
        ) t
      ),
      '[]'::jsonb
    )
  )
  into result;

  return result;
end;
$$;

grant execute on function admin_platform_stats() to authenticated;
