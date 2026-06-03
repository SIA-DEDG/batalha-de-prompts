import { supabase } from '../lib/supabase';

export interface ScoreCriteria {
  clarity: number;    // 0–30
  creativity: number; // 0–30
  structure: number;  // 0–20
  context: number;    // 0–20
}

export interface AIResult {
  itinerary: string;
  score: number;
  feedback: string;
  criteria: ScoreCriteria;
}

export async function generateItineraryAndScore(
  city: string,
  userPrompt: string,
  playerId: string,
): Promise<AIResult> {
  const { data, error } = await supabase.functions.invoke('generate-itinerary', {
    body: { city, userPrompt, playerId },
  });

  if (error) throw new Error(`Erro na função de IA: ${error.message}`);
  if (data?.error) throw new Error(data.error);

  return {
    itinerary: data.itinerary as string,
    score:     data.score     as number,
    feedback:  data.feedback  as string,
    criteria:  data.criteria  as ScoreCriteria ?? { clarity: 0, creativity: 0, structure: 0, context: 0 },
  };
}
