import { Trophy, FileText, Crown } from 'lucide-react';
import type { GameData } from '../types';
import type { ScoreCriteria } from '../services/aiService';

interface Props {
  gameData: GameData;
  aiFeedback: string;
  criteria: ScoreCriteria;
  onReadItinerary: () => void;
  onRanking: () => void;
}

export default function ResultView({ gameData, aiFeedback, criteria, onReadItinerary, onRanking }: Props) {
  return (
    <div className="flex flex-col h-full overflow-y-auto md:flex-row md:items-stretch">
      <div className="md:w-1/2 md:bg-gradient-to-br md:from-purple-700 md:to-indigo-800 md:flex md:flex-col md:items-center md:justify-center md:p-12 md:text-white">
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-center relative overflow-hidden md:border-0 md:bg-white/10 md:shadow-none md:backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-50 via-white to-white opacity-50 md:hidden" />
          <div className="w-24 h-24 bg-yellow-100 md:bg-yellow-400/20 rounded-full flex items-center justify-center mb-6 relative z-10 border-4 border-white md:border-yellow-400/30 shadow-lg">
            <Trophy className="w-12 h-12 text-yellow-500 md:text-yellow-300" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 md:text-white relative z-10">Parabéns!</h2>
          <p className="text-slate-500 md:text-white/70 mb-2 relative z-10">O seu prompt gerou um roteiro incrível.</p>
          {aiFeedback && (
            <p className="text-sm text-purple-600 md:text-white/80 font-medium bg-purple-50 md:bg-white/10 rounded-xl px-4 py-2 mb-4 relative z-10">
              💬 {aiFeedback}
            </p>
          )}
          <div className="flex items-center space-x-8 w-full justify-center relative z-10">
            <div className="text-center">
              <p className="text-xs text-slate-400 md:text-white/50 font-bold uppercase tracking-wider mb-1">Pontuação</p>
              <div className="text-5xl font-black text-purple-600 md:text-white">{gameData.score}</div>
            </div>
            <div className="w-px h-12 bg-slate-200 md:bg-white/20" />
            <div className="text-center">
              <p className="text-xs text-slate-400 md:text-white/50 font-bold uppercase tracking-wider mb-1">Posição</p>
              <div className="text-5xl font-black text-slate-800 md:text-white">#{gameData.rank}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:w-1/2 flex flex-col justify-center p-6 md:p-12 space-y-4 overflow-y-auto">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avaliação do seu Prompt</p>
          {[
            { label: 'Clareza e especificidade', value: criteria.clarity, max: 30, color: 'bg-blue-500' },
            { label: 'Criatividade e personalidade', value: criteria.creativity, max: 30, color: 'bg-purple-500' },
            { label: 'Estrutura e instruções', value: criteria.structure, max: 20, color: 'bg-indigo-500' },
            { label: 'Uso do contexto/destino', value: criteria.context, max: 20, color: 'bg-violet-500' },
          ].map(({ label, value, max, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{label}</span>
                <span className="text-slate-500 font-bold">{value}/{max}</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${(value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={onReadItinerary}
          className="w-full py-4 bg-slate-800 text-white hover:bg-slate-700 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Ler Roteiro Gerado</span>
        </button>
        <button onClick={onRanking}
          className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 hover:border-purple-200 hover:bg-purple-50 rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-2">
          <Crown className="w-5 h-5 text-purple-500" />
          <span>Ver Ranking Global</span>
        </button>
      </div>
    </div>
  );
}
