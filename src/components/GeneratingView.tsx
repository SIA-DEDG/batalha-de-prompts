import { Loader2 } from 'lucide-react';

export default function GeneratingView() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-6">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-20 animate-pulse" />
        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center relative z-10 animate-bounce">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">A IA está pensando...</h2>
        <p className="text-slate-500 mt-2 md:text-lg">Avaliando sua criatividade e gerando o roteiro perfeito.</p>
      </div>
    </div>
  );
}
