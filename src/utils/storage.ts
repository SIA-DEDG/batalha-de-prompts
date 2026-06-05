import { TODAY } from '../constants';
import type { StoredPlayer, StoredSession } from '../types';

export function getStoredPlayer(): StoredPlayer | null {
  try { return JSON.parse(localStorage.getItem('bp_player') ?? 'null'); }
  catch { return null; }
}

export function saveStoredPlayer(p: StoredPlayer) {
  localStorage.setItem('bp_player', JSON.stringify(p));
}

export function getStoredSession(): StoredSession | null {
  try {
    const s: StoredSession = JSON.parse(localStorage.getItem('bp_session') ?? 'null');
    return s?.date === TODAY ? s : null;
  } catch { return null; }
}

export function saveStoredSession(playerId: string, score: number, rank: number) {
  localStorage.setItem('bp_session', JSON.stringify({ date: TODAY, playerId, score, rank }));
}
