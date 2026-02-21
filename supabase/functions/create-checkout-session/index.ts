import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.23.0?target=deno'

// Definimos o CORS aqui mesmo para evitar erros de importação
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 0. Handle CORS (Pre-flight request)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verificação de Variáveis de Ambiente
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeKey || !supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      const missing = []
      if (!stripeKey) missing.push('STRIPE_SECRET_KEY')
      if (!supabaseUrl) missing.push('SUPABASE_URL')
      if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY')
      if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
      
      throw new Error(`Erro de Configuração: Variáveis de ambiente ausentes: ${missing.join(', ')}`)
    }

    // 2. Inicialização dos Clientes
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })
    
    // 3. Parse do Corpo da Requisição
    const { plan } = await req.json().catch(() => ({ plan: null }))
    if (!plan) {
        throw new Error("Erro na Requisição: O parâmetro 'plan' é obrigatório.")
    }

    // 4. Obter ID do Preço
    const priceId = plan === 'yearly' 
      ? Deno.env.get('STRIPE_PRICE_ID_YEARLY')
      : Deno.env.get('STRIPE_PRICE_ID_MONTHLY');

    if (!priceId) {
      throw new Error(`Erro de Configuração: ID de preço não encontrado para o plano '${plan}'. Verifique os Secrets.`)
    }

    // 5. Autenticação do Usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Erro de Autenticação: Header Authorization ausente.')

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Erro de Autenticação: Usuário não logado ou token inválido.')

    // 6. Obter ou Criar Cliente no Stripe
    // Usamos o cliente Admin para garantir acesso à tabela profiles
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      // Cria novo cliente no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_id: user.id },
      })
      customerId = customer.id
      
      // Salva no banco
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Erro ao salvar stripe_customer_id:', updateError)
        // Não lançamos erro aqui para tentar prosseguir com o checkout mesmo assim
      }
    }

    // 7. Criar Sessão de Checkout
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${siteUrl}?payment=success`,
      cancel_url: siteUrl,
    })

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Retorna o erro detalhado para o frontend
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
