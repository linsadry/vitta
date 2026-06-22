// Supabase Edge Function: vitta-ia
// Secure proxy to the Anthropic API. The API key never reaches the client.
//
// Deploy:
//   1. Supabase Dashboard → Edge Functions → Create function "vitta-ia"
//      (or: supabase functions deploy vitta-ia --no-verify-jwt)
//   2. Set the secret ANTHROPIC_API_KEY in Project Settings → Edge Functions → Secrets
//
// The client sends { context, question } and receives { answer }.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { context, question } = await req.json()
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key não configurada' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = `Você é a assistente do Vitta+, um app pessoal de saúde e bem-estar da Adriana, médica oftalmologista.
Você analisa os dados de saúde dela e oferece insights gentis, práticos e acolhedores.
Seu tom é caloroso, sofisticado e encorajador — nunca alarmista. Use português brasileiro.
Você NÃO é médica e não substitui acompanhamento profissional; quando apropriado, sugira que ela leve dados ao médico.
Seja concisa (2-4 parágrafos curtos). Sem emojis. Foque em padrões, tendências e autocuidado.

Dados recentes da Adriana:
${context}`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }],
      }),
    })

    const data = await resp.json()
    const answer = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n') || 'Não consegui gerar uma resposta agora.'

    return new Response(JSON.stringify({ answer }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
