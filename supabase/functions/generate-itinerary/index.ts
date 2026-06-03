// Sem imports externos — usa apenas APIs nativas do Deno para máxima compatibilidade

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function callAI(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey  = Deno.env.get('AI_API_KEY')!;
  const model   = Deno.env.get('AI_MODEL')!;
  const baseUrl = Deno.env.get('AI_API_URL')!;

  const res = await fetch(`${baseUrl}v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.8 }),
  });

  if (!res.ok) throw new Error(`IA retornou ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return String(data.choices[0].message.content);
}

async function saveIP(playerId: string, ip: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return;

  await fetch(`${supabaseUrl}/rest/v1/players?id=eq.${playerId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ ip_address: ip }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { city, userPrompt, playerId } = await req.json();
    if (!city || !userPrompt) return json({ error: 'city e userPrompt são obrigatórios' }, 400);

    // ── 1. Avalia o prompt ────────────────────────────────────────────────────
    const scoreRaw = await callAI([
      {
        role: 'system',
        content: `Você é um juiz de uma competição de prompts de IA sobre turismo.

CRITÉRIOS (total 100 pts):
- Clareza e especificidade (0–30 pts)
- Criatividade e personalidade (0–30 pts)
- Estrutura e instruções para IA (0–20 pts)
- Uso do contexto/destino (0–20 pts)

REGRAS DE PENALIDADE:
- Prompt aleatório, ofensivo ou sem relação com turismo → nota máxima 25, valid=false
- Muito curto/genérico (menos de 10 palavras) → nota máxima 40
- Bom mas com falhas → 50–75
- Excelente → 76–100

Responda SOMENTE com JSON puro (sem markdown, sem texto extra):
{"score":<total>,"feedback":"<frase amigável em português, máx 2 frases>","criteria":{"clarity":<0-30>,"creativity":<0-30>,"structure":<0-20>,"context":<0-20>},"valid":<true|false>}`,
      },
      { role: 'user', content: `Destino: ${city}\nPrompt do participante: ${userPrompt}` },
    ]);

    let score = 50;
    let feedback = 'Tente ser mais específico no próximo!';
    let criteria = { clarity: 12, creativity: 12, structure: 10, context: 8 };
    let valid = true;

    try {
      const clean = scoreRaw.replace(/^```json?\s*|\s*```$/g, '').trim();
      const p = JSON.parse(clean);
      valid    = p.valid !== false;
      criteria = {
        clarity:    Math.min(30, Math.max(0, Math.round(Number(p.criteria?.clarity    ?? 12)))),
        creativity: Math.min(30, Math.max(0, Math.round(Number(p.criteria?.creativity ?? 12)))),
        structure:  Math.min(20, Math.max(0, Math.round(Number(p.criteria?.structure  ?? 10)))),
        context:    Math.min(20, Math.max(0, Math.round(Number(p.criteria?.context    ?? 8)))),
      };
      score    = criteria.clarity + criteria.creativity + criteria.structure + criteria.context;
      feedback = String(p.feedback || feedback);
    } catch { /* usa defaults */ }

    // ── 2. Gera o roteiro (ou mensagem amigável se prompt ruim) ───────────────
    let itinerary: string;

    if (!valid || score < 20) {
      itinerary = `Ei! Parece que seu prompt não tinha relação com turismo 😅\n\nPara pontuar bem, tente algo assim:\n"Aja como um guia turístico jovem e animado. Crie um roteiro incrível de 1 dia em ${city}, com dicas secretas que só os locais conhecem, sugestões de comida e linguagem descontraída!"\n\nVocê consegue muito melhor! 💪 Tente de novo na próxima!`;
    } else {
      itinerary = await callAI([
        {
          role: 'system',
          content: 'Você é um guia turístico jovem, animado e criativo. Siga RIGOROSAMENTE as instruções do usuário. Responda sempre em português brasileiro com energia e personalidade.',
        },
        { role: 'user', content: `Destino: ${city}\n\nInstrução:\n${userPrompt}` },
      ]);
    }

    // ── 3. Registra IP do jogador ─────────────────────────────────────────────
    if (playerId) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
        ?? req.headers.get('x-real-ip')
        ?? 'unknown';
      await saveIP(playerId, ip).catch(() => { /* não bloqueia a resposta */ });
    }

    return json({ itinerary, score, feedback, criteria });

  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
