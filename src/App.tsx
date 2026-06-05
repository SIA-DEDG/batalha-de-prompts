import { useState, useEffect } from 'react';
import { ADMIN_PHONE, CITIES, IS_DEV } from './constants';
import { getStoredPlayer, saveStoredPlayer, getStoredSession, saveStoredSession } from './utils/storage';
import { generateItineraryAndScore } from './services/aiService';
import type { ScoreCriteria } from './services/aiService';
import {
  createPlayer, saveGameAttempt, fetchRanking, getPlayerRank, clearTodayRecordsByPhone, getPlayerByPhone,
} from './services/dbService';
import type { RankingEntry } from './services/dbService';
import type { View, StoredPlayer, GameData } from './types';

import AuthView from './components/AuthView';
import HomeView from './components/HomeView';
import GameView from './components/GameView';
import GeneratingView from './components/GeneratingView';
import ResultView from './components/ResultView';
import ItineraryView from './components/ItineraryView';
import RankingView from './components/RankingView';
import AdminView from './components/AdminView';

export default function App() {
  const [currentView, setCurrentView] = useState<View>(() =>
    getStoredPlayer() ? 'HOME' : 'AUTH'
  );
  const [player, setPlayer] = useState<StoredPlayer | null>(getStoredPlayer);
  const storedSession = getStoredSession();

  const [playerId, setPlayerId] = useState('');
  const [gameData, setGameData] = useState<GameData>({ city: '', prompt: '', score: 0, rank: 0 });
  const [generatedText, setGeneratedText] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiCriteria, setAiCriteria] = useState<ScoreCriteria>({ clarity: 0, creativity: 0, structure: 0, context: 0 });
  const [startError, setStartError] = useState('');
  const [gameError, setGameError] = useState('');
  const [rankingData, setRankingData] = useState<RankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    if (currentView === 'RANKING') {
      setRankingLoading(true);
      fetchRanking().then(setRankingData).finally(() => setRankingLoading(false));
    }
  }, [currentView]);

  const isAdmin = player?.phone === ADMIN_PHONE;

  const handleAuth = async (name: string, phone: string, school: string): Promise<string | null> => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone !== ADMIN_PHONE) {
      try {
        const existing = await getPlayerByPhone(cleanPhone);
        if (existing) return 'Esse número já está cadastrado. Clique em "Já tenho cadastro" para entrar.';
      } catch {
        return 'Erro ao verificar cadastro. Verifique sua internet e tente novamente.';
      }
    }
    localStorage.removeItem('bp_session');
    const resolvedSchool = cleanPhone === ADMIN_PHONE ? 'Secretaria de IA' : school;
    const p: StoredPlayer = { name, phone: cleanPhone, school: resolvedSchool };
    saveStoredPlayer(p);
    setPlayer(p);
    setCurrentView('HOME');
    return null;
  };

  const handleLogin = async (phone: string): Promise<string | null> => {
    const found = await getPlayerByPhone(phone);
    if (!found) return 'Número não encontrado. Verifique ou faça um novo cadastro.';
    localStorage.removeItem('bp_session');
    saveStoredPlayer(found);
    setPlayer(found);
    setCurrentView('HOME');
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem('bp_player');
    localStorage.removeItem('bp_session');
    setPlayer(null);
    setCurrentView('AUTH');
  };

  const handleStartGame = async () => {
    if (!player) return;
    setStartError('');
    try {
      if (isAdmin || IS_DEV) await clearTodayRecordsByPhone(player.phone);
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const dbPlayer = await createPlayer(
        { name: player.name, phone: player.phone, school: player.school },
        isAdmin || IS_DEV,
      );
      setPlayerId(dbPlayer.id);
      setGameData({ city, prompt: '', score: 0, rank: 0 });
      setCurrentView('GAME');
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Erro ao iniciar jogo');
    }
  };

  const handleSkip = async () => {
    setCurrentView('GENERATING');
    const score = Math.floor(Math.random() * 56) + 40;
    const clarity = Math.min(30, Math.round(score * 0.30));
    const creativity = Math.min(30, Math.round(score * 0.30));
    const structure = Math.min(20, Math.round(score * 0.20));
    const context = Math.max(0, Math.min(20, score - clarity - creativity - structure));
    const itinerary = `[DEV] Roteiro simulado para ${gameData.city}.`;
    const feedback = 'Pontuação gerada automaticamente (modo dev).';
    try {
      await saveGameAttempt({ player_id: playerId, city: gameData.city, user_prompt: gameData.prompt || '[dev skip]', generated_itinerary: itinerary, score, ai_feedback: feedback });
      const rank = await getPlayerRank(playerId);
      setGameData(prev => ({ ...prev, score, rank }));
      setGeneratedText(itinerary);
      setAiFeedback(feedback);
      setAiCriteria({ clarity, creativity, structure, context });
      saveStoredSession(playerId, score, rank);
      setCurrentView('RESULT');
    } catch (err) {
      setGameError(err instanceof Error ? err.message : 'Erro desconhecido');
      setCurrentView('GAME');
    }
  };

  const handleGenerate = async () => {
    if (!gameData.prompt) return;
    setCurrentView('GENERATING');
    setGameError('');
    try {
      const { itinerary, score, feedback, criteria } = await generateItineraryAndScore(
        gameData.city, gameData.prompt, playerId,
      );
      await saveGameAttempt({ player_id: playerId, city: gameData.city, user_prompt: gameData.prompt, generated_itinerary: itinerary, score, ai_feedback: feedback });
      const rank = await getPlayerRank(playerId);
      setGameData(prev => ({ ...prev, score, rank }));
      setGeneratedText(itinerary);
      setAiFeedback(feedback);
      setAiCriteria(criteria);
      saveStoredSession(playerId, score, rank);
      setCurrentView('RESULT');
    } catch (err) {
      setGameError(err instanceof Error ? err.message : 'Erro desconhecido');
      setCurrentView('GAME');
    }
  };

  return (
    <div className="h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">

      <main className="flex-1 min-h-0 flex flex-col md:px-6 md:pt-4 md:pb-4">
        <div className="flex-1 min-h-0 md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-200 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 p-6 md:p-0 flex flex-col">

            {currentView === 'AUTH' && (
              <AuthView onAuth={handleAuth} onLogin={handleLogin} onRanking={() => setCurrentView('RANKING')} />
            )}

            {currentView === 'HOME' && player && (
              <HomeView
                player={player}
                alreadyPlayed={!IS_DEV && !!storedSession}
                session={storedSession}
                isAdmin={isAdmin}
                onStart={handleStartGame}
                onRanking={() => setCurrentView('RANKING')}
                onAdmin={() => setCurrentView('ADMIN')}
                onSwitchUser={handleLogout}
                startError={startError}
              />
            )}

            {currentView === 'ADMIN' && (
              <AdminView onBack={() => setCurrentView('HOME')} onPlay={handleStartGame} />
            )}

            {currentView === 'GAME' && player && (
              <GameView
                playerName={player.name}
                gameData={gameData}
                onChangePrompt={p => setGameData(prev => ({ ...prev, prompt: p }))}
                onGenerate={handleGenerate}
                onSkip={handleSkip}
                isDevMode={IS_DEV}
                error={gameError}
              />
            )}

            {currentView === 'GENERATING' && <GeneratingView />}

            {currentView === 'RESULT' && (
              <ResultView
                gameData={gameData}
                aiFeedback={aiFeedback}
                criteria={aiCriteria}
                onReadItinerary={() => setCurrentView('ITINERARY')}
                onRanking={() => setCurrentView('RANKING')}
              />
            )}

            {currentView === 'ITINERARY' && (
              <ItineraryView generatedText={generatedText} onBack={() => setCurrentView('HOME')} />
            )}

            {currentView === 'RANKING' && (
              <RankingView
                rankingData={rankingData}
                rankingLoading={rankingLoading}
                currentPlayerId={playerId || storedSession?.playerId || ''}
                onBack={() => setCurrentView(player ? 'HOME' : 'AUTH')}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
