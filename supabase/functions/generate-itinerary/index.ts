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
  const apiKey = Deno.env.get('AI_API_KEY')!;
  const model = Deno.env.get('AI_MODEL')!;
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
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
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
        content: `Você é um juiz de uma Batalha de Prompts para estudantes. O desafio é criar um prompt que instrua uma IA a agir como guia turístico de uma cidade.

O que você avalia é a QUALIDADE DO PROMPT, não o conhecimento do participante sobre a cidade. Um prompt excelente pode falar de uma cidade que o participante nunca visitou — o que importa é ele saber instruir a IA bem.

CRITÉRIOS (total 100 pts):
- Clareza e especificidade (0–30 pts): o prompt diz claramente o que a IA deve fazer? Tem instruções objetivas?
- Criatividade e personalidade (0–30 pts): o prompt dá personalidade ao guia? Tem elementos originais, tom, estilo?
- Estrutura e instruções para IA (0–20 pts): o prompt organiza bem o que quer? Usa técnicas de prompt (persona, formato, restrições)?
- Uso do contexto/destino (0–20 pts): o prompt menciona ou aproveita o destino de alguma forma, mesmo que genérica?

REGRAS:
- Prompt totalmente fora do tema turismo ou ofensivo → nota máxima 25, valid=false
- Prompt muito curto ou genérico (menos de 10 palavras, ex: "seja um guia") → nota máxima 40
- Não penalize por falta de conhecimento turístico — avalie apenas a habilidade de escrever prompts
- Seja generoso com iniciantes: um prompt simples mas bem estruturado merece nota justa
- Notas altas (76–100) para prompts que realmente instruem bem a IA com criatividade e clareza

Responda SOMENTE com JSON puro (sem markdown, sem texto extra):
{"score":<total>,"feedback":"<frase encorajadora em português, máx 2 frases, comente o que foi bom ou o que pode melhorar>","criteria":{"clarity":<0-30>,"creativity":<0-30>,"structure":<0-20>,"context":<0-20>},"valid":<true|false>}`,
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
      valid = p.valid !== false;
      criteria = {
        clarity: Math.min(30, Math.max(0, Math.round(Number(p.criteria?.clarity ?? 12)))),
        creativity: Math.min(30, Math.max(0, Math.round(Number(p.criteria?.creativity ?? 12)))),
        structure: Math.min(20, Math.max(0, Math.round(Number(p.criteria?.structure ?? 10)))),
        context: Math.min(20, Math.max(0, Math.round(Number(p.criteria?.context ?? 8)))),
      };
      score = criteria.clarity + criteria.creativity + criteria.structure + criteria.context;
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
