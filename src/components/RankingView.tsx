import { Trophy, Crown, Loader2, ChevronLeft } from 'lucide-react';
import { avatarForName } from '../utils/avatar';
import type { RankingEntry } from '../services/dbService';

interface Props {
  rankingData: RankingEntry[];
  rankingLoading: boolean;
  currentPlayerId: string;
  onBack: () => void;
}

export default function RankingView({ rankingData, rankingLoading, currentPlayerId, onBack }: Props) {
  return (
    <div className="flex flex-col h-full md:flex-row md:h-full">
      <div className="md:w-2/5 md:bg-gradient-to-b md:from-purple-700 md:to-indigo-800 md:flex md:flex-col md:p-8 md:text-white md:overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 md:text-white">Ranking Geral</h2>
          <button onClick={onBack}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 md:bg-white/10 hover:bg-slate-200 md:hover:bg-white/20 text-slate-600 md:text-white rounded-xl font-semibold text-sm transition-all">
            <ChevronLeft className="w-4 h-4" />
            <span>Início</span>
          </button>
        </div>
        {!rankingLoading && rankingData.length >= 3 && (
          <div className="bg-gradient-to-b from-purple-600 to-indigo-700 md:bg-none rounded-3xl p-6 md:p-0 text-white mb-4 md:mb-0 md:flex-1 shadow-lg md:shadow-none relative overflow-hidden">
            <div className="absolute top-4 left-0 w-full flex justify-center opacity-10"><Crown className="w-32 h-32" /></div>
            <div className="flex items-end justify-between px-4 md:px-0 pt-8 md:pt-12 relative z-10">
              {[1, 0, 2].map((pos, i) => {
                const p = rankingData[pos];
                const heights = ['h-20', 'h-28', 'h-16'];
                const borders = ['border-slate-300', 'border-yellow-400', 'border-amber-600'];
                const labels = ['2', '1', '3'];
                return (
                  <div key={pos} className="flex flex-col items-center">
                    {i === 1 && <Crown className="w-8 h-8 text-yellow-300 mb-1 animate-bounce" />}
                    <div className="text-3xl mb-1">{avatarForName(p.name)}</div>
                    <p className="text-xs text-purple-200 mb-1 max-w-[70px] truncate text-center">{p.name.split(' ')[0]}</p>
                    <div className={`w-16 md:w-20 ${heights[i]} bg-white/10 rounded-t-lg border-t-2 ${borders[i]} flex flex-col items-center justify-end pb-2`}>
                      <span className={`font-bold ${i === 1 ? 'text-2xl text-yellow-300' : 'text-lg'}`}>{labels[i]}</span>
                      <span className="text-xs text-purple-200">{p.best_score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {rankingLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>
        ) : rankingData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-6">
            <Trophy className="w-12 h-12 text-slate-300" />
            <p className="text-slate-400 font-medium">Nenhuma pontuação ainda.</p>
            <p className="text-slate-400 text-sm">Seja o primeiro a jogar!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-4 hidden md:block">Todos os participantes</p>
            {rankingData.map((player, index) => (
              <div key={player.player_id}
                className={`bg-white p-4 rounded-2xl shadow-sm border flex items-center transition-all hover:scale-[1.01] ${player.player_id === currentPlayerId ? 'border-purple-300 bg-purple-50' : 'border-slate-100'}`}>
                <div className={`w-8 font-bold text-center shrink-0 ${index < 3 ? 'text-purple-600' : 'text-slate-400'}`}>#{index + 1}</div>
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl mx-3 shrink-0">{avatarForName(player.name)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    {player.name}
                    {player.player_id === currentPlayerId && <span className="ml-2 text-xs text-purple-500">(você)</span>}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{player.school}</p>
                </div>
                <div className="shrink-0 ml-2 bg-purple-50 text-purple-700 font-bold px-3 py-1.5 rounded-lg text-sm">{player.best_score} pts</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
