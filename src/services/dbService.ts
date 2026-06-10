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

export async function checkPhonePlayedToday(phone: string): Promise<boolean> {
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

export async function getPlayerByPhone(phone: string): Promise<Pick<Player, 'name' | 'phone' | 'school'> | null> {
  const { data } = await supabase
    .from('players')
    .select('name, phone, school')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
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

// ── Snapshots quantitativos ───────────────────────────────────────────────────

export interface EventSnapshot {
  id: string;
  snapshot_date: string;
  label: string | null;
  total_players: number;
  total_games: number;
  avg_score: number;
  max_score: number;
  schools: Record<string, number> | null;
  created_at: string;
}

export async function saveSnapshotAndClear(players: AdminPlayer[], label?: string): Promise<void> {
  if (players.length === 0) {
    await supabase.from('game_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return;
  }

  const withScore = players.filter(p => p.best_score !== null);
  const total_players = players.length;
  const total_games = players.reduce((s, p) => s + p.total_attempts, 0);
  const avg_score = withScore.length > 0
    ? Math.round(withScore.reduce((s, p) => s + (p.best_score ?? 0), 0) / withScore.length)
    : 0;
  const max_score = withScore.length > 0
    ? Math.max(...withScore.map(p => p.best_score ?? 0))
    : 0;
  const schools = players.reduce<Record<string, number>>((acc, p) => {
    const s = p.school || 'Não informada';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  await supabase.from('event_snapshots').insert({
    snapshot_date: new Date().toISOString().slice(0, 10),
    label: label ?? null,
    total_players,
    total_games,
    avg_score,
    max_score,
    schools,
  });

  await supabase.from('game_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

export async function fetchSnapshots(): Promise<EventSnapshot[]> {
  const { data, error } = await supabase
    .from('event_snapshots')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar snapshots: ${error.message}`);
  return data ?? [];
}

// ── Consulta por data ─────────────────────────────────────────────────────────

export async function fetchPlayersByDate(date: string): Promise<AdminPlayer[]> {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, phone, school, created_at')
    .gte('created_at', `${date}T00:00:00.000Z`)
    .lte('created_at', `${date}T23:59:59.999Z`)
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

// ── Inscrições físicas ────────────────────────────────────────────────────────

export interface PhysicalRegistration {
  id: string;
  name: string;
  phone: string | null;
  school: string | null;
  event_date: string;
  notes: string | null;
  created_at: string;
}

export async function fetchPhysicalRegistrations(date?: string): Promise<PhysicalRegistration[]> {
  let query = supabase
    .from('physical_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (date) query = query.eq('event_date', date);

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao buscar inscrições físicas: ${error.message}`);
  return data ?? [];
}

export async function createPhysicalRegistration(
  data: Pick<PhysicalRegistration, 'name' | 'phone' | 'school' | 'event_date' | 'notes'>,
): Promise<PhysicalRegistration> {
  const { data: reg, error } = await supabase
    .from('physical_registrations')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Erro ao salvar inscrição física: ${error.message}`);
  return reg;
}

export async function deletePhysicalRegistration(id: string): Promise<void> {
  const { error } = await supabase.from('physical_registrations').delete().eq('id', id);
  if (error) throw new Error(`Erro ao deletar inscrição: ${error.message}`);
}
