import { Crown, Sparkles } from 'lucide-react';

interface Props {
  generatedText: string;
  onBack: () => void;
}

export default function ItineraryView({ generatedText, onBack }: Props) {
  return (
    <div className="flex flex-col h-full md:flex-row md:h-full">
      <div className="hidden md:flex md:w-64 md:shrink-0 bg-gradient-to-b from-purple-700 to-indigo-800 flex-col p-8 text-white">
        <button onClick={onBack} className="flex items-center space-x-2 text-white/70 hover:text-white mb-8 transition-colors">
          <Crown className="w-5 h-5" />
          <span className="font-medium">Voltar</span>
        </button>
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-300" />
          <span className="text-sm font-bold text-purple-200 uppercase tracking-wider">Roteiro Gerado</span>
        </div>
        <p className="text-white/50 text-sm">Este roteiro foi criado pela IA com base no seu prompt.</p>
      </div>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center mb-4 md:hidden p-6 pb-0">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
            <Crown className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 ml-2">Resultado da IA</h2>
        </div>
        <div className="hidden md:flex items-center justify-between px-8 pt-8 pb-4 border-b border-slate-200 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Roteiro Gerado pela IA</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="prose prose-slate prose-sm md:prose-base max-w-none text-slate-600 whitespace-pre-wrap">{generatedText}</div>
        </div>
        <div className="p-6 md:p-8 border-t border-slate-100 shrink-0">
          <button onClick={onBack} className="w-full md:w-auto md:px-8 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-bold text-lg transition-all">
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}
