// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Queries Stripe live for a supplier's Express connected account status and
 * updates `suppliers.stripe_onboarding_complete` in Postgres.
 *
 * Called when:
 *  - A supplier returns from Stripe onboarding (`?stripe=return`) or taps Refresh Status
 *  - An admin checks/syncs a supplier's payout readiness
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

    let body: { supplier_id?: string } = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = callerProfile?.role === 'admin'

    let supplierQuery = supabaseAdmin
      .from('suppliers')
      .select('id, user_id, stripe_account_id, stripe_onboarding_complete')

    if (body.supplier_id && isAdmin) {
      supplierQuery = supplierQuery.eq('id', body.supplier_id)
    } else {
      supplierQuery = supplierQuery.eq('user_id', user.id)
    }

    const { data: supplier, error: supplierError } = await supplierQuery.maybeSingle()

    if (supplierError || !supplier) {
      return new Response(JSON.stringify({ error: 'Supplier not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    if (!supplier.stripe_account_id) {
      return new Response(
        JSON.stringify({
          connected: false,
          stripeAccountId: null,
          onboardingComplete: false,
          payoutsEnabled: false,
          chargesEnabled: false,
          transfersActive: false,
          detailsSubmitted: false,
          requirementsDue: [],
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const { data: settings } = await supabaseAdmin
      .from('payment_settings')
      .select('stripe_secret_key')
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

    const account = await stripe.accounts.retrieve(supplier.stripe_account_id)
    const transfersActive = account.capabilities?.transfers === 'active'
    const payoutsEnabled = Boolean(account.payouts_enabled)
    const chargesEnabled = Boolean(account.charges_enabled)
    const detailsSubmitted = Boolean(account.details_submitted)
    const onboardingComplete = Boolean(detailsSubmitted && (transfersActive || payoutsEnabled))

    if (Boolean(supplier.stripe_onboarding_complete) !== onboardingComplete) {
      await supabaseAdmin
        .from('suppliers')
        .update({ stripe_onboarding_complete: onboardingComplete })
        .eq('id', supplier.id)
    }

    return new Response(
      JSON.stringify({
        connected: true,
        stripeAccountId: supplier.stripe_account_id,
        onboardingComplete,
        payoutsEnabled,
        chargesEnabled,
        transfersActive,
        detailsSubmitted,
        requirementsDue: account.requirements?.currently_due ?? [],
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
