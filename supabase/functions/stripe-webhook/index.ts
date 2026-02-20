import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

// Inicializa o cliente Stripe com a chave secreta
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

// Inicializa o cliente Supabase com a chave de ADMIN (service_role)
// para que ele possa ignorar as políticas de segurança (RLS) e atualizar a tabela.
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    if (!signature || !webhookSecret) {
      throw new Error('Webhook secret ou assinatura ausente.')
    }
    // Verifica se o evento veio mesmo do Stripe
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error(`Falha na verificação da assinatura do Webhook: ${err.message}`)
    return new Response(err.message, { status: 400 })
  }

  // Lida com o evento
  try {
    switch (event.type) {
      // Evento principal: pagamento bem-sucedido
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            plan_interval: subscription.items.data[0].price.recurring?.interval,
          })
          .eq('stripe_customer_id', customerId)
        break
      }
      // Outros eventos úteis (cancelamento, falha, etc.) podem ser adicionados aqui
      // case 'customer.subscription.deleted':
      // case 'customer.subscription.updated':
      // ...
    }
  } catch (error) {
    console.error('Erro ao processar evento do webhook:', error.message)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }

  // Retorna uma resposta de sucesso para o Stripe
  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
