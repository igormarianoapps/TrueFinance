import { createClient } from 'npm:@supabase/supabase-js@2'

// Definimos o CORS aqui mesmo para evitar erros de importação
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
  // 0. Handle CORS (Pre-flight request)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Iniciando create-checkout-session (Modo Fetch)...")

    // 1. Verificação de Variáveis de Ambiente
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeKey || !supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Erro de Configuração: Variáveis de ambiente ausentes.")
    }

    // 2. Parse do Corpo da Requisição
    const { plan } = await req.json().catch(() => ({ plan: null }))
    if (!plan) throw new Error("O parâmetro 'plan' é obrigatório.")

    // 3. Obter ID do Preço
    const priceId = plan === 'yearly' 
      ? Deno.env.get('STRIPE_PRICE_ID_YEARLY')
      : Deno.env.get('STRIPE_PRICE_ID_MONTHLY');

    if (!priceId) throw new Error(`ID de preço não encontrado para '${plan}'.`)

    // 4. Autenticação do Usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Erro de Autenticação: Header Authorization ausente.')

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Erro de Autenticação: Usuário não logado ou token inválido.')

    // 5. Obter ou Criar Cliente no Stripe
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Sanitiza valores inválidos que podem ter sido salvos como string no banco
    if (customerId === 'null' || customerId === 'undefined') {
      customerId = null
    }

    if (!customerId) {
      console.log("Criando novo cliente no Stripe...")
      const customerParams = new URLSearchParams()
      customerParams.append('email', user.email || '')
      customerParams.append('metadata[supabase_id]', user.id)

      const customer = await stripeRequest('/customers', customerParams, stripeKey)
      customerId = customer.id

      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // 6. Criar Sessão de Checkout
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
    
    const sessionParams = new URLSearchParams()
    sessionParams.append('customer', customerId)
    sessionParams.append('mode', 'subscription')
    sessionParams.append('line_items[0][price]', priceId)
    sessionParams.append('line_items[0][quantity]', '1')
    sessionParams.append('allow_promotion_codes', 'true')
    sessionParams.append('success_url', `${siteUrl}?payment=success`)
    sessionParams.append('cancel_url', siteUrl)

    const session = await stripeRequest('/checkout/sessions', sessionParams, stripeKey)

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Erro:", error)
    // Retorna o erro detalhado para o frontend
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
