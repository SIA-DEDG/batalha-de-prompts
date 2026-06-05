import React, { useState, useEffect } from 'react';
import {
  Trophy, Play, User, Phone, School, MapPin,
  Sparkles, ArrowRight, Crown, Loader2, FileText,
  Moon, LogIn, Shield, Trash2, RefreshCw, AlertTriangle, ChevronLeft
} from 'lucide-react';
import { generateItineraryAndScore } from './services/aiService';
import type { ScoreCriteria } from './services/aiService';
import {
  createPlayer, saveGameAttempt, fetchRanking, getPlayerRank,
  fetchAllPlayers, deletePlayerById, deleteAllPlayers, clearTodayRecordsByPhone,
} from './services/dbService';
import type { RankingEntry, AdminPlayer } from './services/dbService';

const ADMIN_PHONE = '99981105226';

const CITIES = ['Teresina, PI', 'Parnaíba, PI', 'Tóquio, Japão', 'Paris, França', 'Nova York, EUA', 'São Raimundo Nonato, PI'];
const TODAY = new Date().toISOString().slice(0, 10);

// ── localStorage ──────────────────────────────────────────────────────────────

interface StoredPlayer { name: string; phone: string; school: string; }
interface StoredSession { date: string; playerId: string; score: number; rank: number; }

function getStoredPlayer(): StoredPlayer | null {
  try { return JSON.parse(localStorage.getItem('bp_player') ?? 'null'); }
  catch { return null; }
}
function saveStoredPlayer(p: StoredPlayer) {
  localStorage.setItem('bp_player', JSON.stringify(p));
}
function getStoredSession(): StoredSession | null {
  try {
    const s: StoredSession = JSON.parse(localStorage.getItem('bp_session') ?? 'null');
    return s?.date === TODAY ? s : null;
  } catch { return null; }
}
function saveStoredSession(playerId: string, score: number, rank: number) {
  localStorage.setItem('bp_session', JSON.stringify({ date: TODAY, playerId, score, rank }));
}

type View = 'AUTH' | 'HOME' | 'GAME' | 'GENERATING' | 'RESULT' | 'RANKING' | 'ITINERARY' | 'ADMIN';
interface GameData { city: string; prompt: string; score: number; rank: number; }

function avatarForName(name: string) {
  const avatars = ['👩‍💻', '👨‍🚀', '👩‍🏫', '👨‍🎓', '👩‍🎨', '🧑‍💻', '👨‍🏫', '👩‍🚀'];
  return avatars[name.charCodeAt(0) % avatars.length];
}

// ─── AuthView ─────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = 'Soberania';

function AuthView({ onAuth, error }: {
  onAuth: (name: string, phone: string, school: string) => void;
  error: string;
}) {
  const [form, setForm] = useState({ name: '', phone: '', school: '', password: '' });
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const isAdminPhone = form.phone.replace(/\D/g, '') === ADMIN_PHONE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (isAdminPhone) {
      if (form.password !== ADMIN_PASSWORD) {
        setPasswordError('Senha incorreta. Tente novamente.');
        return;
      }
      // Admin: school é preenchida automaticamente
      if (form.name && form.phone) {
        onAuth(form.name, form.phone, 'Secretaria de IA');
      }
      return;
    }

    if (form.name && form.phone && form.school) onAuth(form.name, form.phone, form.school);
  };

  return (
    <div className="flex flex-col h-full md:flex-row md:h-full">

      {/* Painel esquerdo — desktop */}
      <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-purple-700 via-indigo-700 to-slate-900 flex-col items-center justify-between p-12 text-white">
        <div />
        <div className="flex flex-col items-center">
          <img src="/logos/logo-evento.png" alt="Piauí para o Mundo" className="h-40 w-auto object-contain mb-8 drop-shadow-2xl" />
          <p className="text-white/60 text-center text-base max-w-xs">
            {isAdminPhone ? 'Acesso administrativo. Digite a senha para continuar.' : 'Faça seu cadastro uma vez e participe da maior Batalha de Prompts do Piauí!'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <img src="/logos/logo-soberania.svg" alt="Soberania IA" className="h-12 w-auto object-contain opacity-80" />
          <img src="/logos/logo-pit.png" alt="PIT" className="h-10 w-auto object-contain opacity-80" />
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-col flex-1 overflow-y-auto p-6 md:p-12 md:justify-center bg-slate-50">

        {/* Logo mobile */}
        <div className="flex flex-col items-center md:hidden mb-8 space-y-3">
          <img src="/logos/logo-evento.png" alt="Piauí para o Mundo" className="h-24 w-auto object-contain drop-shadow-lg" />
        </div>

        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-1">
            {isAdminPhone
              ? <><Shield className="w-5 h-5 text-yellow-500" /><span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Acesso Admin</span></>
              : <><LogIn className="w-5 h-5 text-purple-500" /><span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Cadastro único</span></>
            }
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800">
            {isAdminPhone ? 'Área Administrativa' : 'Bem-vindo(a)!'}
          </h2>
          <p className="text-slate-500 mt-1">
            {isAdminPhone
              ? 'Digite a senha de administrador para acessar o painel.'
              : 'Preencha seus dados para entrar na batalha. Você só precisará fazer isso uma vez.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 w-full md:max-w-md">
          {[
            { label: 'Seu nome', type: 'text', placeholder: 'Como quer ser chamado(a)?', key: 'name', Icon: User },
            { label: 'WhatsApp', type: 'tel', placeholder: '(86) 99999-9999', key: 'phone', Icon: Phone },
            ...(!isAdminPhone ? [{ label: 'Escola / Instituição', type: 'text', placeholder: 'Ex: IFPI, CEV, UFPI...', key: 'school', Icon: School }] : []),
          ].map(({ label, type, placeholder, key, Icon }) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">{label}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <input required type={type} placeholder={placeholder}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            </div>
          ))}

          {/* Campo de senha — só aparece para o admin */}
          {isAdminPhone && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">Senha de acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Shield className="w-5 h-5 text-yellow-400" />
                </div>
                <input required type="password" placeholder="••••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-yellow-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              {passwordError && (
                <p className="text-red-600 text-xs ml-1 font-medium">⚠️ {passwordError}</p>
              )}
            </div>
          )}

          {/* Campo escola oculto para admin (preenchido automaticamente) */}
          {isAdminPhone && (
            <input type="hidden" value="Secretaria de IA"
              onChange={() => setForm(f => ({ ...f, school: 'Secretaria de IA' }))} />
          )}

          {/* Consentimento LGPD — só para participantes */}
          {!isAdminPhone && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Proteção de Dados — LGPD</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ao participar, você autoriza a <strong>Secretaria de Inteligência Artificial (SIA)</strong> a coletar seu <strong>nome, WhatsApp e escola</strong> exclusivamente para organização e exibição do ranking da <em>Batalha de Prompts — Piauí para o Mundo</em>, conforme a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>. Os dados serão usados somente durante o evento e não serão compartilhados com terceiros.
              </p>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  checked={lgpdAccepted}
                  onChange={e => setLgpdAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-purple-600 shrink-0 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                  Li e concordo com o uso dos meus dados conforme descrito acima.
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">⚠️ {error}</div>
          )}

          <button type="submit"
            disabled={!isAdminPhone && !lgpdAccepted}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 mt-2 ${
              isAdminPhone
                ? 'bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white'
                : lgpdAccepted
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}>
            {isAdminPhone ? <Shield className="w-5 h-5 text-yellow-400" /> : <ArrowRight className="w-5 h-5" />}
            <span>{isAdminPhone ? 'Acessar Painel Admin' : 'Entrar na Batalha'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── HomeView ─────────────────────────────────────────────────────────────────

function HomeView({ player, alreadyPlayed, session, isAdmin, onStart, onRanking, onAdmin, startError }: {
  player: StoredPlayer;
  alreadyPlayed: boolean;
  session: StoredSession | null;
  isAdmin: boolean;
  onStart: () => void;
  onRanking: () => void;
  onAdmin: () => void;
  startError: string;
}) {
  return (
    <div className="flex flex-col h-full md:flex-row md:h-full">

      {/* Painel esquerdo — desktop */}
      <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-purple-700 via-indigo-700 to-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <img src="/logos/logo-evento.png" alt="Piauí para o Mundo" className="h-44 w-auto object-contain mb-6 drop-shadow-2xl relative z-10" />
        <p className="text-white/60 text-center text-base max-w-sm relative z-10">
          A maior Batalha de Prompts do Piauí. Domine a IA e conquiste o ranking!
        </p>
        <div className="mt-10 relative z-10 flex flex-col items-center space-y-3">
          <img src="/logos/logo-soberania.svg" alt="Soberania IA" className="h-10 w-auto object-contain opacity-80" />
          <div className="flex items-center space-x-4">
            <img src="/logos/logo-sia.svg" alt="SIA" className="h-14 w-auto object-contain opacity-80" />
            <img src="/logos/logo-pit.png" alt="PIT" className="h-12 w-auto object-contain opacity-80" />
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center justify-center flex-1 p-6 md:p-12 space-y-6 text-center md:text-left md:items-start bg-slate-50 overflow-y-auto">

        {/* Logo mobile */}
        <div className="flex flex-col items-center md:hidden space-y-3">
          <img src="/logos/logo-evento.png" alt="Piauí para o Mundo" className="h-28 w-auto object-contain drop-shadow-lg" />
        </div>

        {/* Saudação */}
        <div>
          <p className="text-sm text-purple-600 font-bold uppercase tracking-wider mb-1">
            {avatarForName(player.name)} Olá, {player.name.split(' ')[0]}!
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

        {/* Card de pontuação (se já jogou) */}
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
          {/* Admin sempre pode jogar */}
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

        {/* Steps (só se não jogou) — desktop */}
        {!alreadyPlayed && (
          <div className="hidden md:flex flex-col space-y-3 w-full max-w-md pt-4 border-t border-slate-200">
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
      </div>
    </div>
  );
}

// ─── GameView ─────────────────────────────────────────────────────────────────

function GameView({ playerName, gameData, onChangePrompt, onGenerate, error }: {
  playerName: string; gameData: GameData;
  onChangePrompt: (p: string) => void; onGenerate: () => void; error: string;
}) {
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
        <div className="pt-4">
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

// ─── GeneratingView ───────────────────────────────────────────────────────────

function GeneratingView() {
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

// ─── ResultView ───────────────────────────────────────────────────────────────

function ResultView({ gameData, aiFeedback, criteria, onReadItinerary, onRanking }: {
  gameData: GameData; aiFeedback: string; criteria: ScoreCriteria;
  onReadItinerary: () => void; onRanking: () => void;
}) {
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

// ─── ItineraryView ────────────────────────────────────────────────────────────

function ItineraryView({ generatedText, onBack }: { generatedText: string; onBack: () => void }) {
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

// ─── RankingView ──────────────────────────────────────────────────────────────

function RankingView({ rankingData, rankingLoading, currentPlayerId, onBack }: {
  rankingData: RankingEntry[]; rankingLoading: boolean;
  currentPlayerId: string; onBack: () => void;
}) {
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

// ─── AdminView ────────────────────────────────────────────────────────────────

function AdminView({ onBack, onPlay }: { onBack: () => void; onPlay: () => void }) {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setPlayers(await fetchAllPlayers()); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await deletePlayerById(id); await load(); } finally { setDeletingId(null); }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try { await deleteAllPlayers(); setPlayers([]); setConfirmClear(false); } finally { setClearing(false); }
  };

  const totalPlayers = players.length;
  const totalGames   = players.reduce((s, p) => s + p.total_attempts, 0);
  const avgScore     = players.filter(p => p.best_score !== null).length > 0
    ? Math.round(players.reduce((s, p) => s + (p.best_score ?? 0), 0) / players.filter(p => p.best_score !== null).length)
    : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header do painel */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-white">Painel Admin</span>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={onPlay}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all flex items-center space-x-1">
              <Play className="w-4 h-4 fill-current" />
              <span>Testar Jogo</span>
            </button>
            <button onClick={onBack}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all">
              Sair
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Participantes', value: totalPlayers },
            { label: 'Partidas jogadas', value: totalGames },
            { label: 'Média de pontos', value: avgScore },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-white/60 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações globais */}
      <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
        <span className="text-sm font-semibold text-slate-600">{players.length} cadastros</span>
        <div className="flex items-center space-x-2">
          <button onClick={load} disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)}
              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-lg transition-all flex items-center space-x-1">
              <Trash2 className="w-3 h-3" />
              <span>Limpar tudo</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 font-bold">Tem certeza?</span>
              <button onClick={handleClearAll} disabled={clearing}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all">
                {clearing ? 'Limpando...' : 'Confirmar'}
              </button>
              <button onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-300 transition-all">
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de jogadores */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 space-y-2">
            <Trophy className="w-8 h-8 text-slate-300" />
            <p className="text-sm">Nenhum participante ainda.</p>
          </div>
        ) : (
          players.map(p => (
            <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center space-x-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{p.name}</h4>
                  {p.best_score !== null && (
                    <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md shrink-0">
                      {p.best_score} pts
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{p.school} · {p.phone}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {p.total_attempts} {p.total_attempts === 1 ? 'partida' : 'partidas'} ·{' '}
                  {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={deletingId === p.id}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0 disabled:opacity-50">
                {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

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
  const [authError, setAuthError] = useState('');
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

  // Cadastro inicial — salva identidade permanente no localStorage
  const handleAuth = (name: string, phone: string, school: string) => {
    setAuthError('');
    const resolvedSchool = phone.replace(/\D/g, '') === ADMIN_PHONE ? 'Secretaria de IA' : school;
    const p: StoredPlayer = { name, phone: phone.replace(/\D/g, ''), school: resolvedSchool };
    saveStoredPlayer(p);
    setPlayer(p);
    setCurrentView('HOME');
  };

  const isAdmin = player?.phone === ADMIN_PHONE;

  // Iniciar jogo — admin faz bypass do limite diário
  const handleStartGame = async () => {
    if (!player) return;
    setStartError('');
    try {
      if (isAdmin) {
        // Remove registros de hoje para permitir nova partida
        await clearTodayRecordsByPhone(player.phone);
      }
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const dbPlayer = await createPlayer(
        { name: player.name, phone: player.phone, school: player.school },
        isAdmin, // skipDailyCheck
      );
      setPlayerId(dbPlayer.id);
      setGameData({ city, prompt: '', score: 0, rank: 0 });
      setCurrentView('GAME');
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Erro ao iniciar jogo');
    }
  };

  // Gerar roteiro
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

      {/* Conteúdo */}
      <main className="flex-1 min-h-0 flex flex-col md:px-6 md:pt-4 md:pb-0">
        <div className="flex-1 min-h-0 md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-200 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 p-6 md:p-0 flex flex-col">
            {currentView === 'AUTH' && <AuthView onAuth={handleAuth} error={authError} />}
            {currentView === 'HOME' && player && (
              <HomeView
                player={player}
                alreadyPlayed={!!storedSession}
                session={storedSession}
                isAdmin={isAdmin}
                onStart={handleStartGame}
                onRanking={() => setCurrentView('RANKING')}
                onAdmin={() => setCurrentView('ADMIN')}
                startError={startError}
              />
            )}
            {currentView === 'ADMIN' && (
              <AdminView
                onBack={() => setCurrentView('HOME')}
                onPlay={handleStartGame}
              />
            )}
            {currentView === 'GAME' && player && (
              <GameView
                playerName={player.name}
                gameData={gameData}
                onChangePrompt={p => setGameData(prev => ({ ...prev, prompt: p }))}
                onGenerate={handleGenerate}
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
                onBack={() => setCurrentView('HOME')}
              />
            )}
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="shrink-0 bg-white border-t border-slate-100 px-6 py-2 flex items-center justify-center md:justify-between">
        <img src="/logos/logo-soberania.svg" alt="Soberania IA" className="hidden md:block h-8 w-auto object-contain opacity-75" />
        <div className="flex items-center space-x-3">
          <img src="/logos/logo-sia.svg" alt="SIA" className="h-8 w-auto object-contain opacity-85" />
          <div className="bg-slate-800 rounded-lg px-2 py-1">
            <img src="/logos/logo-pit.png" alt="PIT" className="h-6 w-auto object-contain" />
          </div>
        </div>
      </footer>

    </div>
  );
}
