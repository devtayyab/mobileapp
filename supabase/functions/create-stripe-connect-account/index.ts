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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Get existing supplier data via admin client for reliable access
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('id, business_name, stripe_account_id, stripe_onboarding_complete, business_email')
      .eq('user_id', user.id)
      .single()

    if (supplierError || !supplier) {
      return new Response(JSON.stringify({ error: 'Supplier not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let accountId = supplier.stripe_account_id
    let onboardingComplete = Boolean(supplier.stripe_onboarding_complete)

    // If no stripe account exists, create an Express account with transfers requested
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: supplier.business_email || user.email,
        business_profile: {
          name: supplier.business_name || 'My Business',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          supplier_id: supplier.id,
          user_id: user.id,
        },
      })

      accountId = account.id

      const { error: updateError } = await supabaseAdmin
        .from('suppliers')
        .update({ stripe_account_id: accountId })
        .eq('id', supplier.id)

      if (updateError) {
        throw updateError
      }
    } else {
      // Ensure transfers capability is requested and sync live onboarding status
      try {
        const account = await stripe.accounts.retrieve(accountId)
        const transfersActive = account.capabilities?.transfers === 'active'
        const isComplete = Boolean(
          account.details_submitted && (transfersActive || account.payouts_enabled)
        )
        if (isComplete !== onboardingComplete) {
          onboardingComplete = isComplete
          await supabaseAdmin
            .from('suppliers')
            .update({ stripe_onboarding_complete: isComplete })
            .eq('id', supplier.id)
        }
      } catch (retrieveErr) {
        console.error('Could not retrieve existing Stripe account:', retrieveErr)
      }
    }

    return new Response(
      JSON.stringify({
        stripeAccountId: accountId,
        stripeOnboardingComplete: onboardingComplete,
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
