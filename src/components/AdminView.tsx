import { useEffect, useState } from 'react';
import { Shield, Play, RefreshCw, Trash2, AlertTriangle, Loader2, Trophy } from 'lucide-react';
import { fetchAllPlayers, deletePlayerById, deleteAllPlayers } from '../services/dbService';
import type { AdminPlayer } from '../services/dbService';

interface Props {
  onBack: () => void;
  onPlay: () => void;
}

export default function AdminView({ onBack, onPlay }: Props) {
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
  const totalGames = players.reduce((s, p) => s + p.total_attempts, 0);
  const withScore = players.filter(p => p.best_score !== null);
  const avgScore = withScore.length > 0
    ? Math.round(withScore.reduce((s, p) => s + (p.best_score ?? 0), 0) / withScore.length)
    : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">

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
              <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
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
