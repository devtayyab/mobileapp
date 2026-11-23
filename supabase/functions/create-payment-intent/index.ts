// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare Deno locally to prevent TypeScript errors in the editor
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Creates a Stripe PaymentIntent on the Platform account using Stripe Connect's
 * Separate Charges and Transfers pattern (`transfer_group`).
 *
 * Why Separate Charges and Transfers instead of Destination Charges:
 *  - Supports BOTH single-supplier AND multi-supplier carts seamlessly
 *  - Keeps Platform Commission (default 11% retail / 6% B2B, or Super Admin custom rate)
 *    + VAT safely on the Platform account
 *  - Transfers each supplier's exact (Items Net + Shipping Fee) immediately after
 *    payment confirmation via `process-order-transfers` using `source_transaction`
 *  - Never blocks checkout if a supplier hasn't finished Stripe Connect onboarding
 *    yet (records their split as pending for 1-click Admin release once connected).
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

    const { data: settings } = await supabaseAdmin
      .from('payment_settings')
      .select('stripe_secret_key, retail_commission_rate, b2b_commission_rate')
      .eq('id', 1)
      .single()

    const secretKey = settings?.stripe_secret_key || Deno.env.get('STRIPE_SECRET_KEY') || ''

    if (!secretKey) {
      throw new Error('Stripe Secret Key is not configured')
    }

    const stripe = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: '2023-10-16',
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { amount, currency, supplier_id, is_b2b, order_number } = await req.json()

    if (!amount || !currency) {
      return new Response(JSON.stringify({ error: 'Amount and currency are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const amountCents = Math.round(Number(amount) * 100)
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid payment amount' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let isWholesale = Boolean(is_b2b)
    if (is_b2b === undefined) {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      isWholesale = userProfile?.role === 'b2b'
    }

    const defaultRetailPct = Number(settings?.retail_commission_rate ?? 11)
    const defaultB2bPct = Number(settings?.b2b_commission_rate ?? 6)
    const platformPct = isWholesale ? defaultB2bPct : defaultRetailPct
    const transferGroup =
      typeof order_number === 'string' && order_number.trim()
        ? order_number.trim()
        : `ORD-${Date.now()}`

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: String(currency).toLowerCase(),
      payment_method_types: ['card'],
      transfer_group: transferGroup,
      metadata: {
        userId: user.id,
        orderNumber: transferGroup,
        supplierId: supplier_id || 'multi_or_platform',
        orderType: isWholesale ? 'wholesale' : 'retail',
        defaultPlatformFeeRate: `${platformPct}%`,
      },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        transferGroup,
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
