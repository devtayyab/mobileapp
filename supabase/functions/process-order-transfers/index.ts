// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Executes instant Stripe Connect transfers for a paid order (Separate Charges
 * and Transfers) and records every split in `public.payment_splits`:
 *
 *  - Platform keeps: Platform Commission (on product subtotal; default 11% retail /
 *    6% B2B, or Super Admin's custom rate) + VAT (remitted by Platform Admin).
 *  - Each Supplier receives immediately: (Supplier Items Subtotal - Platform Commission)
 *    + Supplier's Shipping Fee via `stripe.transfers.create` tied to `source_transaction`.
 *
 * Also callable by Super Admin to release/retry any `pending` supplier payout
 * once the supplier finishes Stripe Connect onboarding.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { order_id, payment_intent_id } = await req.json()
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 1. Load order + verify caller is buyer or admin
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(
        'id, order_number, user_id, subtotal, shipping_fee, vat_amount, platform_commission, total, currency, supplier_shipping_breakdown'
      )
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = callerProfile?.role === 'admin'
    if (order.user_id !== user.id && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 2. Load Stripe secret key & payment row
    const [{ data: settings }, { data: paymentRow }, { data: orderItems }] = await Promise.all([
      supabaseAdmin
        .from('payment_settings')
        .select('stripe_secret_key, retail_commission_rate, b2b_commission_rate')
        .eq('id', 1)
        .single(),
      supabaseAdmin
        .from('payments')
        .select('id, transaction_id, payment_gateway, amount, currency, status')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from('order_items')
        .select('id, supplier_id, subtotal, supplier_amount, platform_commission')
        .eq('order_id', order.id),
    ])

    const secretKey = settings?.stripe_secret_key || Deno.env.get('STRIPE_SECRET_KEY') || ''
    if (!secretKey) {
      throw new Error('Stripe Secret Key is not configured')
    }

    const resolvedPiId = payment_intent_id || paymentRow?.transaction_id || null
    if (!resolvedPiId) {
      return new Response(
        JSON.stringify({ error: 'No Stripe payment_intent_id linked to this order' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const stripe = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: '2023-10-16',
    })

    // 3. Verify PaymentIntent genuinely succeeded on Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(resolvedPiId, {
      expand: ['latest_charge'],
    })

    if (paymentIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({
          error: `PaymentIntent is not succeeded (status: ${paymentIntent.status})`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const chargeId =
      typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id || undefined

    // Persist transaction_id on payments row if missing
    if (paymentRow?.id && !paymentRow.transaction_id) {
      await supabaseAdmin
        .from('payments')
        .update({
          transaction_id: paymentIntent.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', paymentRow.id)
    }

    // 4. Load existing payment_splits for idempotency
    const { data: existingSplits } = await supabaseAdmin
      .from('payment_splits')
      .select('id, supplier_id, split_type, status, payout_reference, amount')
      .eq('order_id', order.id)

    const splitsList = existingSplits ?? []
    const orderCurrency = (order.currency || paymentIntent.currency || 'USD').toUpperCase()
    const stripeCurrency = (paymentIntent.currency || orderCurrency).toLowerCase()
    const nowIso = new Date().toISOString()

    // 5. Group order_items per supplier
    const items = orderItems ?? []
    const bySupplier = new Map<
      string,
      { subtotal: number; supplierNet: number; commission: number }
    >()

    let totalPlatformCommission = 0
    for (const item of items) {
      const suppId = item.supplier_id
      if (!suppId) continue
      const entry = bySupplier.get(suppId) ?? { subtotal: 0, supplierNet: 0, commission: 0 }
      entry.subtotal = round2(entry.subtotal + Number(item.subtotal || 0))
      entry.supplierNet = round2(entry.supplierNet + Number(item.supplier_amount || 0))
      entry.commission = round2(entry.commission + Number(item.platform_commission || 0))
      totalPlatformCommission = round2(totalPlatformCommission + Number(item.platform_commission || 0))
      bySupplier.set(suppId, entry)
    }

    if (totalPlatformCommission === 0 && Number(order.platform_commission || 0) > 0) {
      totalPlatformCommission = round2(Number(order.platform_commission))
    }

    // 6. Record Platform Commission & Platform VAT splits (idempotent)
    const hasPlatformCommSplit = splitsList.some((s: any) => s.split_type === 'platform_commission')
    if (!hasPlatformCommSplit && totalPlatformCommission > 0) {
      await supabaseAdmin.from('payment_splits').insert({
        order_id: order.id,
        payment_id: paymentRow?.id ?? null,
        supplier_id: null,
        split_type: 'platform_commission',
        amount: totalPlatformCommission,
        currency: orderCurrency,
        subtotal_amount: round2(Number(order.subtotal || 0)),
        commission_amount: totalPlatformCommission,
        shipping_amount: 0,
        status: 'completed',
        payout_reference: paymentIntent.id,
        paid_at: nowIso,
      })
    }

    const vatAmount = round2(Number(order.vat_amount || 0))
    const hasPlatformVatSplit = splitsList.some((s: any) => s.split_type === 'platform_vat')
    if (!hasPlatformVatSplit && vatAmount > 0) {
      await supabaseAdmin.from('payment_splits').insert({
        order_id: order.id,
        payment_id: paymentRow?.id ?? null,
        supplier_id: null,
        split_type: 'platform_vat',
        amount: vatAmount,
        currency: orderCurrency,
        subtotal_amount: 0,
        commission_amount: 0,
        shipping_amount: 0,
        status: 'completed',
        payout_reference: paymentIntent.id,
        paid_at: nowIso,
      })
    }

    // 7. Load supplier Stripe Connect accounts
    const supplierIds = Array.from(bySupplier.keys())
    const { data: suppliersData } = supplierIds.length
      ? await supabaseAdmin
          .from('suppliers')
          .select('id, user_id, business_name, stripe_account_id, stripe_onboarding_complete')
          .in('id', supplierIds)
      : { data: [] }

    const supplierMap = new Map<
      string,
      {
        id: string
        user_id: string | null
        business_name: string | null
        stripe_account_id: string | null
        stripe_onboarding_complete: boolean | null
      }
    >((suppliersData ?? []).map((s: any) => [s.id, s]))

    // Parse per-supplier shipping breakdown
    const rawShippingMap = (order.supplier_shipping_breakdown ?? {}) as Record<string, number>
    const totalOrderShipping = round2(Number(order.shipping_fee || 0))
    const totalOrderSubtotal = round2(Number(order.subtotal || 0))

    // Track remaining chargeable cents so rounding can never exceed the Stripe charge
    const alreadyTransferredCents = splitsList
      .filter((s: any) => s.split_type === 'supplier_payout' && s.status === 'completed')
      .reduce((acc: number, s: any) => acc + Math.round(Number(s.amount || 0) * 100), 0)
    const platformRetainedCents = Math.round((totalPlatformCommission + vatAmount) * 100)
    let remainingBudgetCents = Math.max(
      0,
      paymentIntent.amount - platformRetainedCents - alreadyTransferredCents
    )

    const transferResults: Array<{
      supplier_id: string
      business_name: string
      amount: number
      currency: string
      status: 'completed' | 'pending'
      transfer_id: string | null
      reason: string | null
    }> = []

    // 8. Execute instant Stripe Transfer for each supplier
    for (const supplierId of supplierIds) {
      const agg = bySupplier.get(supplierId)!
      const supp = supplierMap.get(supplierId)
      const existingSuppSplit = splitsList.find(
        (s: any) => s.split_type === 'supplier_payout' && s.supplier_id === supplierId
      )

      // Already transferred? Do not double pay!
      if (existingSuppSplit && existingSuppSplit.status === 'completed') {
        transferResults.push({
          supplier_id: supplierId,
          business_name: supp?.business_name ?? 'Supplier',
          amount: Number(existingSuppSplit.amount),
          currency: orderCurrency,
          status: 'completed',
          transfer_id: existingSuppSplit.payout_reference ?? null,
          reason: null,
        })
        continue
      }

      // Compute this supplier's shipping fee share
      let supplierShipping = 0
      if (typeof rawShippingMap[supplierId] === 'number' && Number.isFinite(rawShippingMap[supplierId])) {
        supplierShipping = round2(rawShippingMap[supplierId])
      } else if (supplierIds.length === 1) {
        supplierShipping = totalOrderShipping
      } else if (totalOrderSubtotal > 0 && totalOrderShipping > 0) {
        // Proportional fallback for older orders without breakdown
        supplierShipping = round2((agg.subtotal / totalOrderSubtotal) * totalOrderShipping)
      }

      const payoutAmount = round2(agg.supplierNet + supplierShipping)
      let payoutCents = Math.round(payoutAmount * 100)
      if (payoutCents > remainingBudgetCents && remainingBudgetCents > 0) {
        // Guard against 1-2 cent rounding drift vs charged total
        if (payoutCents - remainingBudgetCents <= 5) {
          payoutCents = remainingBudgetCents
        }
      }

      const finalPayoutAmount = round2(payoutCents / 100)

      // Check & live-sync Stripe Connect readiness
      let stripeReady = false
      let pendingReason: string | null = null

      if (!supp?.stripe_account_id) {
        pendingReason = 'Supplier has not connected a Stripe payout account yet.'
      } else if (supp.stripe_onboarding_complete) {
        stripeReady = true
      } else {
        // Live check Stripe in case onboarding was finished without hitting webhook
        try {
          const acct = await stripe.accounts.retrieve(supp.stripe_account_id)
          const transfersActive = acct.capabilities?.transfers === 'active'
          const isComplete = Boolean(
            acct.details_submitted && (transfersActive || acct.payouts_enabled)
          )
          if (isComplete) {
            stripeReady = true
            await supabaseAdmin
              .from('suppliers')
              .update({ stripe_onboarding_complete: true })
              .eq('id', supplierId)
          } else {
            pendingReason =
              'Supplier Stripe onboarding is incomplete (transfers not active yet).'
          }
        } catch (acctErr) {
          pendingReason = `Could not verify Stripe account: ${
            acctErr instanceof Error ? acctErr.message : String(acctErr)
          }`
        }
      }

      let transferId: string | null = null
      let splitStatus: 'completed' | 'pending' = 'pending'

      if (stripeReady && supp?.stripe_account_id && payoutCents > 0) {
        try {
          const transfer = await stripe.transfers.create(
            {
              amount: payoutCents,
              currency: stripeCurrency,
              destination: supp.stripe_account_id,
              ...(chargeId ? { source_transaction: chargeId } : {}),
              transfer_group: order.order_number,
              description: `Order ${order.order_number} payout`,
              metadata: {
                order_id: order.id,
                order_number: order.order_number,
                supplier_id: supplierId,
                items_subtotal: String(agg.subtotal),
                platform_commission: String(agg.commission),
                shipping_fee: String(supplierShipping),
              },
            },
            {
              idempotencyKey: `transfer_${order.id}_${supplierId}`,
            }
          )

          transferId = transfer.id
          splitStatus = 'completed'
          pendingReason = null
          remainingBudgetCents = Math.max(0, remainingBudgetCents - payoutCents)
        } catch (transferErr) {
          splitStatus = 'pending'
          pendingReason =
            transferErr instanceof Error ? transferErr.message : String(transferErr)
          console.error(`Transfer failed for supplier ${supplierId}:`, pendingReason)
        }
      }

      // Upsert payment_splits row for this supplier
      const splitPayload = {
        order_id: order.id,
        payment_id: paymentRow?.id ?? null,
        supplier_id: supplierId,
        split_type: 'supplier_payout',
        amount: finalPayoutAmount,
        currency: orderCurrency,
        subtotal_amount: agg.subtotal,
        commission_amount: agg.commission,
        shipping_amount: supplierShipping,
        status: splitStatus,
        payout_reference: transferId,
        failure_reason: pendingReason,
        paid_at: splitStatus === 'completed' ? nowIso : null,
      }

      if (existingSuppSplit?.id) {
        await supabaseAdmin
          .from('payment_splits')
          .update(splitPayload)
          .eq('id', existingSuppSplit.id)
      } else {
        await supabaseAdmin.from('payment_splits').insert(splitPayload)
      }

      // Notify supplier if transfer completed
      if (splitStatus === 'completed' && supp?.user_id) {
        try {
          await supabaseAdmin.from('notifications').insert({
            user_id: supp.user_id,
            title: 'Payout Transferred',
            message: `${orderCurrency} ${finalPayoutAmount.toFixed(2)} for Order #${order.order_number} (incl. shipping) has been transferred to your Stripe account.`,
            type: 'payout',
            payload: {
              order_id: order.id,
              order_number: order.order_number,
              transfer_id: transferId,
            },
          })
        } catch (nErr) {
          console.error('Could not notify supplier of payout:', nErr)
        }
      }

      transferResults.push({
        supplier_id: supplierId,
        business_name: supp?.business_name ?? 'Supplier',
        amount: finalPayoutAmount,
        currency: orderCurrency,
        status: splitStatus,
        transfer_id: transferId,
        reason: pendingReason,
      })
    }

    // Store split summary on payment_details for easy auditing
    if (paymentRow?.id) {
      await supabaseAdmin
        .from('payments')
        .update({
          payment_details: {
            payment_intent_id: paymentIntent.id,
            charge_id: chargeId ?? null,
            platform_commission: totalPlatformCommission,
            platform_vat: vatAmount,
            supplier_transfers: transferResults,
          },
        })
        .eq('id', paymentRow.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        paymentIntentId: paymentIntent.id,
        currency: orderCurrency,
        platformCommission: totalPlatformCommission,
        platformVat: vatAmount,
        transfers: transferResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
