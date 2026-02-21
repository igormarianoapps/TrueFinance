import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import Stripe from 'npm:stripe@^16.2.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

Deno.serve(async (req) => {
  // Array para guardar os logs e enviar de volta para o Stripe
  const logs: string[] = []
  const addLog = (msg: string) => {
    console.log(msg)
    logs.push(msg)
  }
  const addError = (msg: string, err?: any) => {
    console.error(msg, err)
    logs.push(`ERROR: ${msg} ${err ? JSON.stringify(err) : ''}`)
  }

  try {
    const signature = req.headers.get('Stripe-Signature')
    const body = await req.text()

    addLog('Webhook recebido. Iniciando processamento...')

    if (!signature || !webhookSecret) {
      addError('Webhook secret ou assinatura ausente.')
      return new Response(JSON.stringify({ error: 'Configuração ausente', logs }), { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      addLog(`Evento verificado com sucesso: ${event.type}`)
    } catch (err) {
      addError(`Falha na verificação da assinatura: ${err.message}`)
      return new Response(JSON.stringify({ error: err.message, logs }), { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      addLog(`Cliente identificado: ${customerId}`)

      if (!customerId) {
        addError('CustomerId não encontrado na sessão.')
      } else {
        // Verifica se o perfil existe antes de tentar atualizar
        const { data: profileCheck, error: checkError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('stripe_customer_id', customerId)
        
        addLog(`Verificação de perfil no banco: ${JSON.stringify({ encontrados: profileCheck?.length, erro: checkError })}`)

        let interval = 'month'
        if (session.subscription) {
            try {
                const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
                interval = subscription.items.data[0].price.recurring?.interval || 'month'
                addLog(`Assinatura recuperada. Intervalo: ${interval}`)
            } catch (subErr) {
                addError('Erro ao recuperar detalhes da assinatura', subErr)
            }
        }

        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: 'active', plan_interval: interval })
          .eq('stripe_customer_id', customerId)
          .select()

        if (error) {
          addError('Erro ao atualizar perfil no banco:', error)
        } else if (!data || data.length === 0) {
          addError(`ALERTA: O update rodou mas nenhum registro foi alterado. Verifique se o stripe_customer_id "${customerId}" é EXATAMENTE igual ao que está na tabela profiles.`)
        } else {
          addLog('SUCESSO: Perfil atualizado para active!')
        }
      }
    } else {
      addLog(`Evento ${event.type} ignorado (não é checkout.session.completed).`)
    }

    return new Response(JSON.stringify({ received: true, logs }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    addError('Erro fatal no processamento', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error', logs }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
