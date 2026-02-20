import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

// Inicializa um cliente Supabase com privilégios de administrador
// para realizar operações seguras no servidor.
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Responde a requisições de pre-flight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan } = await req.json() // 'monthly' ou 'yearly'

    // Mapeia o plano para o ID de preço do Stripe
    const priceId = plan === 'yearly' 
      ? Deno.env.get('STRIPE_PRICE_ID_YEARLY')
      : Deno.env.get('STRIPE_PRICE_ID_MONTHLY');

    if (!priceId) {
      throw new Error('ID de preço não configurado para o plano selecionado.')
    }

    // Cria um cliente Supabase usando o token do usuário que fez a chamada
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Pega os dados do usuário autenticado
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado.')

    // Busca o perfil do usuário para ver se ele já é um cliente no Stripe
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
      throw new Error('Não foi possível encontrar o perfil do usuário. Tente relogar na aplicação e tente novamente.')
    }

    let customerId = profile?.stripe_customer_id

    // Se não for um cliente, cria um no Stripe e atualiza nosso banco
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_id: user.id },
      })
      customerId = customer.id
      // Usa o cliente admin para garantir que a permissão de escrita não falhe
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
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${siteUrl}?payment=success`, // Redireciona para a página principal em caso de sucesso
      cancel_url: siteUrl,   // Redireciona para a página principal em caso de cancelamento
    })

    // Retorna a URL de checkout para o frontend
    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})