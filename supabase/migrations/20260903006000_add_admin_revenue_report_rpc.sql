/*
  Admin revenue report aggregates (web route /admin/reports).

  Why an RPC instead of fetching rows and summing in JS (what mobile
  `app/admin/reports.tsx` does):

  1. Correctness at scale — mobile does
     `supabase.from('order_items').select(...)` with no bound and reduces in JS.
     PostgREST silently caps that response at its `max-rows` default, so every
     total is understated once the table outgrows the cap, with no error.
     Aggregating in SQL has no such ceiling.

  2. Currency. `orders.currency` varies per row and `order_items` has NO
     currency column of its own, so every monetary figure here is grouped by
     the parent order's currency. A single blended sum across currencies is a
     meaningless number, so none is produced. Same pattern as
     `admin_platform_stats()` (20260903001000).

  Order counts (`total_orders`, `orders_by_status`) are currency-free and so
  are returned ungrouped.

  security invoker: runs as the caller, so the existing "Admin can read all …"
  RLS policies on orders / order_items / suppliers still apply. A non-admin
  calling this gets only their own rows back — no privilege escalation.
*/
create or replace function admin_revenue_report()
returns jsonb
language plpgsql
security invoker
as $$
declare
  result jsonb;
  -- Start of the 7-day window, inclusive, in UTC. Mobile builds the same
  -- window client-side from `toISOString().slice(0, 10)`, which is also UTC.
  window_start date := ((now() at time zone 'utc')::date - 6);
begin
  select jsonb_build_object(
    'window_start', window_start::text,
    'window_end', ((now() at time zone 'utc')::date)::text,

    'total_orders', (select count(*) from orders),

    -- Counts, not money: safe to report ungrouped.
    'orders_by_status', coalesce(
      (
        select jsonb_agg(row_to_json(t))
        from (
          select o.status::text as status, count(*) as orders
          from orders o
          group by o.status
          order by count(*) desc
        ) t
      ),
      '[]'::jsonb
    ),

    -- Order-level money, one row per currency.
    'by_currency', coalesce(
      (
        select jsonb_agg(row_to_json(t))
        from (
          select
            coalesce(o.currency, 'USD')  as currency,
            sum(o.total)                 as gross_revenue,
            sum(o.platform_commission)   as commission,
            count(*)                     as orders,
            avg(o.total)                 as avg_order_value
          from orders o
          group by coalesce(o.currency, 'USD')
          order by sum(o.total) desc
        ) t
      ),
      '[]'::jsonb
    ),

    -- Item-level money (the supplier's cut), one row per currency. Currency
    -- comes from the parent order because order_items has no currency column.
    'payouts_by_currency', coalesce(
      (
        select jsonb_agg(row_to_json(t))
        from (
          select
            coalesce(o.currency, 'USD')     as currency,
            sum(oi.supplier_amount)         as supplier_payouts,
            sum(oi.platform_commission)     as item_commission
          from order_items oi
          join orders o on o.id = oi.order_id
          group by coalesce(o.currency, 'USD')
        ) t
      ),
      '[]'::jsonb
    ),

    -- Last 7 UTC days, one row per (currency, day). Days with no orders are
    -- simply absent; the UI fills the gaps with zero so the axis stays even.
    'daily_revenue', coalesce(
      (
        select jsonb_agg(row_to_json(t))
        from (
          select
            coalesce(o.currency, 'USD')                        as currency,
            ((o.created_at at time zone 'utc')::date)::text     as day,
            sum(o.total)                                       as revenue,
            count(*)                                           as orders
          from orders o
          where (o.created_at at time zone 'utc')::date >= window_start
          group by 1, 2
          order by 2
        ) t
      ),
      '[]'::jsonb
    ),

    -- Top 5 suppliers by payout, ranked WITHIN each currency (ranking across
    -- currencies would be comparing unlike units).
    'top_suppliers', coalesce(
      (
        select jsonb_agg(row_to_json(t))
        from (
          select currency, supplier_id, business_name, revenue, orders, rank
          from (
            select
              coalesce(o.currency, 'USD')     as currency,
              oi.supplier_id                  as supplier_id,
              s.business_name                 as business_name,
              sum(oi.supplier_amount)         as revenue,
              count(distinct oi.order_id)     as orders,
              row_number() over (
                partition by coalesce(o.currency, 'USD')
                order by sum(oi.supplier_amount) desc
              )                               as rank
            from order_items oi
            join orders o on o.id = oi.order_id
            left join suppliers s on s.id = oi.supplier_id
            group by coalesce(o.currency, 'USD'), oi.supplier_id, s.business_name
          ) ranked
          where rank <= 5
          order by currency, rank
        ) t
      ),
      '[]'::jsonb
    )
  )
  into result;

  return result;
end;
$$;

grant execute on function admin_revenue_report() to authenticated;
