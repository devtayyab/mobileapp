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

    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    if (supplierError || !supplier || !supplier.stripe_account_id) {
      return new Response(JSON.stringify({ error: 'Supplier Stripe account not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let body: { return_url?: string; refresh_url?: string } = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const defaultReturn = 'https://sathunglobal.com/supplier/business-settings?stripe=return'
    const defaultRefresh = 'https://sathunglobal.com/supplier/business-settings?stripe=refresh'

    // Stripe Live mode requires valid https:// URLs (rejects exp:// or localhost)
    const sanitizeUrl = (url: string | undefined, fallback: string) => {
      if (!url || !/^https?:\/\//i.test(url)) return fallback
      return url
    }

    const accountLink = await stripe.accountLinks.create({
      account: supplier.stripe_account_id,
      refresh_url: sanitizeUrl(body.refresh_url, defaultRefresh),
      return_url: sanitizeUrl(body.return_url, defaultReturn),
      type: 'account_onboarding',
    })

    return new Response(JSON.stringify({ url: accountLink.url }), {
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
