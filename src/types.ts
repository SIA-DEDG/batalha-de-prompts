export type View = 'AUTH' | 'HOME' | 'GAME' | 'GENERATING' | 'RESULT' | 'RANKING' | 'ITINERARY' | 'ADMIN';

export interface StoredPlayer {
  name: string;
  phone: string;
  school: string;
}

export interface StoredSession {
  date: string;
  playerId: string;
  score: number;
  rank: number;
}

export interface GameData {
  city: string;
  prompt: string;
  score: number;
  rank: number;
}
