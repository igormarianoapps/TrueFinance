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

    // 3. Enviar E-mail de Adeus (Integração com Resend)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'True Finance <onboarding@resend.dev>', // Use seu domínio verificado em produção
          to: user.email,
          subject: 'Sua conta foi excluída',
          html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #E6EAF7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .logo { font-size: 24px; font-weight: bold; color: #3457A4; text-decoration: none; display: block; text-align: center; margin-bottom: 30px; }
    .text { color: #475569; line-height: 1.6; font-size: 16px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">True Finance</div>
    <h1 style="color: #1e293b; font-size: 22px; text-align: center; margin-bottom: 20px;">Conta Excluída</h1>
    <p class="text">Olá,</p>
    <p class="text">Confirmamos que sua conta e todos os seus dados foram excluídos permanentemente da nossa plataforma conforme solicitado.</p>
    <p class="text">Sentiremos sua falta! Se decidir voltar no futuro, estaremos aqui.</p>
    <div class="footer">
      <p>&copy; 2026 True Finance. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`
        })
      })
    }

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