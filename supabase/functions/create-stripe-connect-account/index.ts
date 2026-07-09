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

    // Get existing supplier data
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, business_name, stripe_account_id, business_email')
      .eq('user_id', user.id)
      .single()

    if (supplierError || !supplier) {
      return new Response(JSON.stringify({ error: 'Supplier not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let accountId = supplier.stripe_account_id

    // If no stripe account exists, create one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: supplier.business_email || user.email,
        business_profile: {
          name: supplier.business_name || 'My Business',
        },
        metadata: {
          supplier_id: supplier.id,
          user_id: user.id
        }
      })

      accountId = account.id

      // Save the account ID to the database
      const { error: updateError } = await supabase
        .from('suppliers')
        .update({ stripe_account_id: accountId })
        .eq('id', supplier.id)

      if (updateError) {
        throw updateError
      }
    }

    return new Response(JSON.stringify({ stripeAccountId: accountId }), {
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
