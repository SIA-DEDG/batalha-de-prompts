import { Trophy, Play, Moon, Shield } from 'lucide-react';
import { avatarForName } from '../utils/avatar';
import type { StoredPlayer, StoredSession } from '../types';

interface Props {
  player: StoredPlayer;
  alreadyPlayed: boolean;
  session: StoredSession | null;
  isAdmin: boolean;
  onStart: () => void;
  onRanking: () => void;
  onAdmin: () => void;
  onSwitchUser: () => void;
  startError: string;
}

export default function HomeView({ player, alreadyPlayed, session, isAdmin, onStart, onRanking, onAdmin, onSwitchUser, startError }: Props) {
  return (
    <div className="flex flex-col h-full md:flex-row md:h-full">

      <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-purple-700 via-indigo-700 to-slate-900 flex-col items-center justify-between p-12 text-white">
        <div />
        <div className="flex flex-col items-center">
          <img src="/logos/logo-evento.png" alt="Piauí para o Mundo" className="h-40 w-auto object-contain mb-8 drop-shadow-2xl" />
          <p className="text-white/60 text-center text-base max-w-sm relative z-10">
            A maior Batalha de Prompts do Piauí. Domine a IA e conquiste o ranking!
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <img src="/logos/logo-soberania.svg" alt="Soberania IA" className="h-8 w-auto object-contain opacity-80" />
          <img src="/logos/logo-pit.png" alt="PIT" className="h-16 w-auto object-contain opacity-80 rounded-lg" />
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center md:justify-center flex-1 p-6 md:p-12 space-y-6 text-center md:text-left md:items-start bg-slate-50 overflow-y-auto">

        {/* Logo mobile — topo */}
        <div className="flex justify-center md:hidden w-full">
          <img src="/logos/logo-evento.png" alt="Piauí para o Mundo" className="h-24 w-auto object-contain drop-shadow-lg" />
        </div>

        {/* Logo SIA — desktop */}
        <div className="hidden md:flex justify-center w-full mb-6">
          <img src="/logos/logo-sia.svg" alt="SIA" className="h-20 w-auto object-contain opacity-90" />
        </div>

        {/* Saudação */}
        <div>
          <p className="text-sm text-purple-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
            <span>{avatarForName(player.name)} Olá, {player.name.split(' ')[0]}!</span>
            <button onClick={onSwitchUser} className="text-xs text-slate-400 hover:text-slate-600 font-normal underline underline-offset-2 transition-colors">
              Não é você?
            </button>
          </p>
          <h2 className="text-3xl font-extrabold text-slate-800">
            {alreadyPlayed ? 'Até amanhã! 🌙' : 'Pronto para batalhar?'}
          </h2>
          <p className="text-slate-500 mt-1 text-base">
            {alreadyPlayed
              ? 'Você já participou hoje. Volte amanhã para uma nova batalha!'
              : 'Você receberá um destino sorteado e deverá criar o melhor prompt de guia turístico.'}
          </p>
        </div>

        {/* Card de pontuação */}
        {alreadyPlayed && session && (
          <div className="w-full max-w-sm md:max-w-md flex items-center space-x-6 bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Pontuação</p>
              <div className="text-4xl font-black text-purple-600">{session.score}</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Posição</p>
              <div className="text-4xl font-black text-slate-800">#{session.rank}</div>
            </div>
          </div>
        )}

        {startError && (
          <div className="w-full max-w-sm md:max-w-md bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">
            ⚠️ {startError}
          </div>
        )}

        <div className="w-full max-w-sm md:max-w-md space-y-4">
          {alreadyPlayed && !isAdmin ? (
            <div className="w-full py-4 bg-slate-100 border-2 border-slate-200 text-slate-400 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 cursor-not-allowed select-none">
              <Moon className="w-5 h-5" />
              <span>Volte amanhã para jogar</span>
            </div>
          ) : (
            <button onClick={onStart}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center space-x-2 active:scale-95">
              <Play className="w-5 h-5 fill-current" />
              <span>{isAdmin && alreadyPlayed ? 'Jogar novamente (Admin)' : 'Começar Jogo'}</span>
            </button>
          )}

          <button onClick={onRanking}
            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 hover:border-purple-200 hover:bg-purple-50 rounded-2xl font-bold text-lg shadow-sm transition-all flex items-center justify-center space-x-2 active:scale-95">
            <Trophy className="w-5 h-5 text-purple-500" />
            <span>Ver Ranking</span>
          </button>

          {isAdmin && (
            <button onClick={onAdmin}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-base transition-all flex items-center justify-center space-x-2 active:scale-95">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span>Painel Administrativo</span>
            </button>
          )}

        </div>

        {/* Steps — desktop */}
        {!alreadyPlayed && (
          <div className="hidden md:flex space-y-3 w-full max-w-md pt-4 border-t border-slate-200">
            {[
              { n: '1', t: 'Receba um destino', d: 'Uma cidade sorteada para você' },
              { n: '2', t: 'Escreva seu prompt', d: 'Instrua a IA como um guia jovem' },
              { n: '3', t: 'Receba sua nota', d: 'A IA avalia e você entra no ranking' },
            ].map(s => (
              <div key={s.n} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">{s.n}</div>
                <div>
                  <p className="font-semibold text-slate-700 text-sm">{s.t}</p>
                  <p className="text-xs text-slate-400">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer mobile — logos SIA e PIT */}
        <div className="flex justify-center items-center space-x-4 md:hidden w-full pt-4 border-t border-slate-200">
          <img src="/logos/logo-sia.svg" alt="SIA" className="h-10 w-auto object-contain opacity-80" />
          <img src="/logos/logo-pit-preta.png" alt="PIT" className="h-16 w-auto object-contain opacity-80 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
