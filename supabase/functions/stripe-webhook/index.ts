// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

/**
 * Stripe Webhook handler for Connect account lifecycle events (`account.updated`).
 * Keeps `suppliers.stripe_onboarding_complete` automatically synced in real time
 * whenever Stripe activates or restricts a supplier's Express account.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

    let event: any
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
    } else {
      event = JSON.parse(rawBody)
    }

    if (event.type === 'account.updated') {
      const account = event.data?.object
      if (account?.id) {
        const transfersActive = account.capabilities?.transfers === 'active'
        const isComplete = Boolean(
          account.details_submitted && (transfersActive || account.payouts_enabled)
        )

        await supabaseAdmin
          .from('suppliers')
          .update({ stripe_onboarding_complete: isComplete })
          .eq('stripe_account_id', account.id)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
