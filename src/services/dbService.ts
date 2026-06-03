import { supabase } from '../lib/supabase';

export interface Player {
  id: string;
  name: string;
  phone: string;
  school: string;
  created_at: string;
}

export interface GameAttempt {
  id: string;
  player_id: string;
  city: string;
  user_prompt: string;
  generated_itinerary: string | null;
  score: number | null;
  ai_feedback: string | null;
  created_at: string;
}

export interface RankingEntry {
  player_id: string;
  name: string;
  school: string;
  best_score: number;
  total_attempts: number;
  last_attempt_at: string;
}

export interface AdminPlayer {
  id: string;
  name: string;
  phone: string;
  school: string;
  created_at: string;
  best_score: number | null;
  total_attempts: number;
}

async function checkPhonePlayedToday(phone: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`);
  return (count ?? 0) > 0;
}

// Remove registros de hoje para um telefone — usado pelo admin para jogar várias vezes
export async function clearTodayRecordsByPhone(phone: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: todayPlayers } = await supabase
    .from('players')
    .select('id')
    .eq('phone', phone)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`);

  if (todayPlayers && todayPlayers.length > 0) {
    const ids = todayPlayers.map(p => p.id);
    await supabase.from('game_attempts').delete().in('player_id', ids);
    await supabase.from('players').delete().in('id', ids);
  }
}

export async function createPlayer(
  data: Pick<Player, 'name' | 'phone' | 'school'>,
  skipDailyCheck = false,
): Promise<Player> {
  if (!skipDailyCheck) {
    const alreadyPlayed = await checkPhonePlayedToday(data.phone);
    if (alreadyPlayed) {
      throw new Error('Você já participou hoje! Volte amanhã para uma nova batalha. 🏆');
    }
  }

  const { data: player, error } = await supabase
    .from('players')
    .insert(data)
    .select()
    .single();

  if (error) {
    if (error.message.includes('já participou')) {
      throw new Error('Você já participou hoje! Volte amanhã para uma nova batalha. 🏆');
    }
    throw new Error(`Erro ao salvar jogador: ${error.message}`);
  }
  return player;
}

export async function saveGameAttempt(data: {
  player_id: string;
  city: string;
  user_prompt: string;
  generated_itinerary: string;
  score: number;
  ai_feedback: string;
}): Promise<GameAttempt> {
  const { data: attempt, error } = await supabase
    .from('game_attempts')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Erro ao salvar tentativa: ${error.message}`);
  return attempt;
}

export async function fetchRanking(): Promise<RankingEntry[]> {
  const { data, error } = await supabase
    .from('ranking')
    .select('*')
    .order('best_score', { ascending: false })
    .limit(50);

  if (error) throw new Error(`Erro ao buscar ranking: ${error.message}`);
  return data ?? [];
}

export async function getPlayerRank(playerId: string): Promise<number> {
  const { data, error } = await supabase
    .from('ranking')
    .select('player_id')
    .order('best_score', { ascending: false });

  if (error || !data) return 0;
  const index = data.findIndex(r => r.player_id === playerId);
  return index === -1 ? 0 : index + 1;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function fetchAllPlayers(): Promise<AdminPlayer[]> {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, phone, school, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar jogadores: ${error.message}`);
  if (!players) return [];

  const { data: ranking } = await supabase.from('ranking').select('player_id, best_score, total_attempts');
  const rankMap = new Map((ranking ?? []).map(r => [r.player_id, r]));

  return players.map(p => ({
    ...p,
    best_score: rankMap.get(p.id)?.best_score ?? null,
    total_attempts: rankMap.get(p.id)?.total_attempts ?? 0,
  }));
}

export async function deletePlayerById(playerId: string): Promise<void> {
  // game_attempts é deletado em cascata
  const { error } = await supabase.from('players').delete().eq('id', playerId);
  if (error) throw new Error(`Erro ao deletar jogador: ${error.message}`);
}

export async function deleteAllPlayers(): Promise<void> {
  await supabase.from('game_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
