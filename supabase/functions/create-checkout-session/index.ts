import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Responde a requisições de pre-flight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('--- Iniciando create-checkout-session (DIAGNÓSTICO) ---')

    // 1. Validação e Inicialização Segura
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    console.log('Verificando variáveis de ambiente...')
    if (!stripeKey || !supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Variáveis ausentes:', { 
        hasStripe: !!stripeKey, 
        hasUrl: !!supabaseUrl, 
        hasService: !!supabaseServiceKey, 
        hasAnon: !!supabaseAnonKey 
      })
      throw new Error('Configuração do servidor incompleta: Variáveis de ambiente ausentes.')
    }
    console.log('Variáveis de ambiente OK. URL:', supabaseUrl)

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const reqBody = await req.json()
    const { plan } = reqBody
    console.log('Plano solicitado:', plan)

    // Mapeia o plano para o ID de preço do Stripe
    const priceId = plan === 'yearly' 
      ? Deno.env.get('STRIPE_PRICE_ID_YEARLY')
      : Deno.env.get('STRIPE_PRICE_ID_MONTHLY');

    if (!priceId) {
      throw new Error(`ID de preço não configurado para o plano: ${plan}`)
    }

    // Cria um cliente Supabase usando o token do usuário que fez a chamada
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization Header presente:', !!authHeader)
    
    if (!authHeader) {
        throw new Error('Header Authorization ausente.')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Pega os dados do usuário autenticado
    console.log('Autenticando usuário...')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
        console.error('Erro ao autenticar usuário:', userError)
        throw userError
    }
    if (!user) throw new Error('Usuário não autenticado.')
    console.log('Usuário autenticado:', user.id)

    // Busca o perfil do usuário para ver se ele já é um cliente no Stripe
    console.log('Buscando perfil do usuário...')
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
      throw new Error('Perfil de usuário não encontrado.')
    }
    console.log('Perfil encontrado. Customer ID:', profile?.stripe_customer_id)

    let customerId = profile?.stripe_customer_id

    // Se não for um cliente, cria um no Stripe e atualiza nosso banco
    if (!customerId) {
      console.log('Criando novo cliente no Stripe...')
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_id: user.id },
      })
      customerId = customer.id
      console.log('Cliente criado no Stripe:', customerId)

      // Usa o cliente admin para garantir que a permissão de escrita não falhe
      console.log('Atualizando perfil com novo Customer ID...')
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erro ao atualizar perfil com stripe_customer_id:', updateError)
        throw new Error('Não foi possível salvar os dados de pagamento do cliente.')
      }
    }

    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

    // Cria a Sessão de Checkout no Stripe
    console.log('Criando sessão de checkout...')
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true, // Permite o uso de cupons de desconto
      success_url: `${siteUrl}?payment=success`, // Redireciona para a página principal em caso de sucesso
      cancel_url: siteUrl,   // Redireciona para a página principal em caso de cancelamento
    })
    console.log('Sessão criada com sucesso:', session.url)

    // Retorna a URL de checkout para o frontend
    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro CRÍTICO na Edge Function:', error)
    // Tenta extrair informações úteis do erro se for um objeto
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
    
    return new Response(JSON.stringify({ error: errorMessage, details: error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
