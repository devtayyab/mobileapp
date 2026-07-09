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
  // Handle CORS preflight requests
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

    const { amount, currency, supplier_id } = await req.json()

    if (!amount || !currency) {
      return new Response(JSON.stringify({ error: 'Amount and currency are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Default to taking 10% as platform fee if supplier_id is provided
    let paymentIntentParams: any = {
      amount: Math.round(amount * 100), // Stripe expects amounts in cents
      currency,
      customer: user.id, // Ideally, you'd map this to a Stripe Customer ID
      payment_method_types: ['card'],
      metadata: {
        userId: user.id,
        supplierId: supplier_id || 'platform',
      },
    }

    // If there's a supplier ID, fetch their Stripe Connected Account ID from database
    // This assumes you have a `stripe_account_id` column in the `suppliers` table
    if (supplier_id) {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('stripe_account_id')
        .eq('id', supplier_id)
        .single()

      if (supplierData?.stripe_account_id) {
        // Stripe Connect: Separate Charges and Transfers or Destination Charges
        // 10% platform fee
        const applicationFeeAmount = Math.round((amount * 0.10) * 100) 
        
        paymentIntentParams = {
          ...paymentIntentParams,
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: supplierData.stripe_account_id,
          },
        }
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
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
