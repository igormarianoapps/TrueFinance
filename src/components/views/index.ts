import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Erro de configuração no servidor.")
    }

    // 1. Verificar quem está chamando (Usuário Logado)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Autorização necessária.')

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Usuário inválido.')

    // 2. Inicializar Admin para operações privilegiadas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 3. (Opcional) Enviar E-mail de Adeus
    // Nota: Como não temos um provedor de e-mail configurado (ex: Resend, SendGrid) no contexto,
    // deixamos aqui a lógica preparada. O Supabase Auth não envia e-mail nativo de "Conta Excluída".
    console.log(`[SIMULAÇÃO] Enviando e-mail de confirmação de exclusão para: ${user.email}`)
    /*
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'True Finance <noreply@truefinance.com>',
        to: user.email,
        subject: 'Sua conta foi excluída',
        html: '<p>Confirmamos que sua conta e seus dados foram excluídos permanentemente.</p>'
      })
    })
    */

    // 4. Excluir o Usuário
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ message: 'Conta excluída com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})