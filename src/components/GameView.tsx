import { MapPin, Sparkles } from 'lucide-react';
import type { GameData } from '../types';

interface Props {
  playerName: string;
  gameData: GameData;
  onChangePrompt: (p: string) => void;
  onGenerate: () => void;
  onSkip?: () => void;
  isDevMode?: boolean;
  error: string;
}

export default function GameView({ playerName, gameData, onChangePrompt, onGenerate, onSkip, isDevMode, error }: Props) {
  return (
    <div className="flex flex-col h-full md:flex-row md:h-full md:gap-0">
      <div className="md:w-2/5 md:bg-gradient-to-br md:from-indigo-600 md:to-purple-700 md:flex md:flex-col md:justify-between md:p-8 md:text-white md:overflow-y-auto">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <div className="w-10 h-10 bg-purple-100 md:bg-white/20 rounded-full flex items-center justify-center text-purple-600 md:text-white font-bold text-xl">
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 md:text-white">{playerName}</p>
            <p className="text-xs text-slate-500 md:text-white/60">Participante</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 md:bg-none rounded-3xl p-6 md:p-0 text-white shadow-lg md:shadow-none relative overflow-hidden mb-4 md:mb-0 md:flex-1 md:flex md:flex-col md:justify-center">
          <div className="absolute -right-4 -top-4 opacity-10 md:hidden">
            <MapPin className="w-32 h-32" />
          </div>
          <div className="hidden md:block opacity-10 mb-6">
            <MapPin className="w-20 h-20" />
          </div>
          <p className="text-purple-100 font-medium text-sm mb-1">Seu destino sorteado:</p>
          <h3 className="text-3xl md:text-4xl font-extrabold mb-4">{gameData.city}</h3>
          <p className="text-sm text-purple-50 md:text-white/70">
            Escreva um prompt para a IA agir como um <strong>Guia Turístico Jovem</strong>. Peça um roteiro de 1 dia com linguagem atual, dicas secretas e por onde começar!
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-0 md:p-8 min-h-0">
        <div className="flex-1 flex flex-col space-y-2 min-h-0">
          <label className="font-semibold text-slate-700 hidden md:block text-lg">Seu Prompt de Comando:</label>
          <textarea
            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-slate-700 md:text-base"
            placeholder="Ex: Aja como um guia turístico super animado. Crie um roteiro de 1 dia em..."
            value={gameData.prompt}
            onChange={e => onChangePrompt(e.target.value)}
          />
        </div>
        {error && <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">⚠️ {error}</div>}
        <div className="pt-4 space-y-2">
          {isDevMode && (
            <button onClick={onSkip}
              className="w-full py-3 rounded-2xl font-bold text-sm border-2 border-dashed border-orange-300 text-orange-500 bg-orange-50 hover:bg-orange-100 transition-all flex items-center justify-center space-x-2 active:scale-95">
              <span>⚡ [DEV] Pular — pontuação aleatória</span>
            </button>
          )}
          <button onClick={onGenerate} disabled={!gameData.prompt}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 ${gameData.prompt ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            <Sparkles className="w-5 h-5" />
            <span>Gerar Roteiro Mágico</span>
          </button>
        </div>
      </div>
    </div>
  );
}
