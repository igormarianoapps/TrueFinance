import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function stripeRequest(endpoint: string, body: URLSearchParams, apiKey: string) {
  const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || 'Erro na comunicação com o Stripe')
  }
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeKey || !supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Erro de Configuração: Variáveis de ambiente ausentes.")
    }

    // Auth User
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Header Authorization ausente.')

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Usuário não autenticado.')

    // Get Customer ID
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const customerId = profile?.stripe_customer_id
    if (!customerId) throw new Error('Cliente não encontrado (sem ID Stripe).')

    // Create Portal Session
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
    
    const params = new URLSearchParams()
    params.append('customer', customerId)
    params.append('return_url', siteUrl)

    const session = await stripeRequest('/billing_portal/sessions', params, stripeKey)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})