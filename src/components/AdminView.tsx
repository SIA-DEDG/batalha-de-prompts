import { useEffect, useState } from 'react';
import { Shield, Play, RefreshCw, Trash2, AlertTriangle, Loader2, Trophy, ClipboardList, Users, Plus, X, Archive } from 'lucide-react';
import {
  fetchAllPlayers, fetchPlayersByDate,
  deletePlayerById, saveSnapshotAndClear, fetchSnapshots,
  fetchPhysicalRegistrations, createPhysicalRegistration, deletePhysicalRegistration,
} from '../services/dbService';
import type { AdminPlayer, PhysicalRegistration, EventSnapshot } from '../services/dbService';

interface Props {
  onBack: () => void;
  onPlay: () => void;
}

type Tab = 'players' | 'physical' | 'history';

export default function AdminView({ onBack, onPlay }: Props) {
  const [tab, setTab] = useState<Tab>('players');

  // ── Jogadores ──────────────────────────────────────────────────────────────
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearLabel, setClearLabel] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const loadPlayers = async (date?: string) => {
    setLoadingPlayers(true);
    try {
      setPlayers(date ? await fetchPlayersByDate(date) : await fetchAllPlayers());
    } finally {
      setLoadingPlayers(false);
    }
  };

  useEffect(() => { loadPlayers(); }, []);

  const handleDateFilter = (value: string) => {
    setDateFilter(value);
    loadPlayers(value || undefined);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await deletePlayerById(id); await loadPlayers(dateFilter || undefined); } finally { setDeletingId(null); }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await saveSnapshotAndClear(players, clearLabel || undefined);
      setPlayers([]);
      setConfirmClear(false);
      setClearLabel('');
    } finally {
      setClearing(false);
    }
  };

  const totalPlayers = players.length;
  const totalGames = players.reduce((s, p) => s + p.total_attempts, 0);
  const withScore = players.filter(p => p.best_score !== null);
  const avgScore = withScore.length > 0
    ? Math.round(withScore.reduce((s, p) => s + (p.best_score ?? 0), 0) / withScore.length)
    : 0;

  // ── Histórico de snapshots ────────────────────────────────────────────────
  const [snapshots, setSnapshots] = useState<EventSnapshot[]>([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);

  const loadSnapshots = async () => {
    setLoadingSnaps(true);
    try { setSnapshots(await fetchSnapshots()); } finally { setLoadingSnaps(false); }
  };

  useEffect(() => { if (tab === 'history') loadSnapshots(); }, [tab]);

  // ── Inscrições Físicas ─────────────────────────────────────────────────────
  const [regs, setRegs] = useState<PhysicalRegistration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [deletingRegId, setDeletingRegId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regDateFilter, setRegDateFilter] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', school: '', event_date: '2026-06-09', notes: '' });

  const loadRegs = async (date?: string) => {
    setLoadingRegs(true);
    try { setRegs(await fetchPhysicalRegistrations(date || undefined)); } finally { setLoadingRegs(false); }
  };

  useEffect(() => { if (tab === 'physical') loadRegs(regDateFilter || undefined); }, [tab]);

  const handleRegDateFilter = (value: string) => {
    setRegDateFilter(value);
    loadRegs(value || undefined);
  };

  const handleSaveReg = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createPhysicalRegistration({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        school: form.school.trim() || null,
        event_date: form.event_date,
        notes: form.notes.trim() || null,
      });
      setForm({ name: '', phone: '', school: '', event_date: '2026-06-09', notes: '' });
      setShowForm(false);
      await loadRegs(regDateFilter || undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReg = async (id: string) => {
    setDeletingRegId(id);
    try { await deletePhysicalRegistration(id); await loadRegs(regDateFilter || undefined); } finally { setDeletingRegId(null); }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
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

        {tab === 'players' && (
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
        )}

        {tab === 'physical' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-white">{regs.length}</div>
              <div className="text-xs text-white/60 mt-0.5">Inscrições físicas</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-white">
                {new Set(regs.map(r => r.school).filter(Boolean)).size}
              </div>
              <div className="text-xs text-white/60 mt-0.5">Escolas</div>
            </div>
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex border-b border-slate-200 bg-white shrink-0">
        <button
          onClick={() => setTab('players')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-semibold transition-all ${
            tab === 'players'
              ? 'text-purple-700 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <Users className="w-4 h-4" />
          <span>Jogadores</span>
        </button>
        <button
          onClick={() => setTab('physical')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-semibold transition-all ${
            tab === 'physical'
              ? 'text-purple-700 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <ClipboardList className="w-4 h-4" />
          <span>Inscrições Físicas</span>
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-semibold transition-all ${
            tab === 'history'
              ? 'text-purple-700 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <Archive className="w-4 h-4" />
          <span>Histórico</span>
        </button>
      </div>

      {/* ── Aba Jogadores ──────────────────────────────────────────────────────── */}
      {tab === 'players' && (
        <>
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50 gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={e => handleDateFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <span className="text-sm font-semibold text-slate-600 shrink-0">{players.length} cadastros</span>
            <div className="flex items-center space-x-2 shrink-0">
              <button onClick={() => loadPlayers(dateFilter || undefined)} disabled={loadingPlayers}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all">
                <RefreshCw className={`w-4 h-4 ${loadingPlayers ? 'animate-spin' : ''}`} />
              </button>
              {!confirmClear ? (
                <button onClick={() => setConfirmClear(true)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-lg transition-all flex items-center space-x-1">
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar tudo</span>
                </button>
              ) : (
                <div className="flex flex-col gap-1.5 items-end">
                  <input
                    placeholder="Rótulo da sessão (ex: Turma A — manhã)"
                    value={clearLabel}
                    onChange={e => setClearLabel(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-xs text-red-600 font-bold">Salva o quantitativo e reinicia.</span>
                    <button onClick={handleClearAll} disabled={clearing}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all shrink-0">
                      {clearing ? 'Salvando...' : 'Confirmar'}
                    </button>
                    <button onClick={() => { setConfirmClear(false); setClearLabel(''); }}
                      className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-300 transition-all shrink-0">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingPlayers ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ) : players.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 space-y-2">
                <Trophy className="w-8 h-8 text-slate-300" />
                <p className="text-sm">Nenhum participante encontrado.</p>
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
        </>
      )}

      {/* ── Aba Inscrições Físicas ─────────────────────────────────────────────── */}
      {tab === 'physical' && (
        <>
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50 gap-2">
            <input
              type="date"
              value={regDateFilter}
              onChange={e => handleRegDateFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <span className="text-sm font-semibold text-slate-600 shrink-0">{regs.length} inscrições</span>
            <div className="flex items-center space-x-2 shrink-0">
              <button onClick={() => loadRegs(regDateFilter || undefined)} disabled={loadingRegs}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all">
                <RefreshCw className={`w-4 h-4 ${loadingRegs ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setShowForm(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1">
                <Plus className="w-3 h-3" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {/* Formulário inline */}
          {showForm && (
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 shrink-0 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-purple-700">Nova inscrição física</span>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                placeholder="Nome *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Telefone"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <input
                  placeholder="Escola"
                  value={form.school}
                  onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={form.event_date}
                  onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <input
                  placeholder="Observações"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <button
                onClick={handleSaveReg}
                disabled={saving || !form.name.trim()}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>{saving ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingRegs ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ) : regs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 space-y-2">
                <ClipboardList className="w-8 h-8 text-slate-300" />
                <p className="text-sm">Nenhuma inscrição física cadastrada.</p>
              </div>
            ) : (
              regs.map(r => (
                <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center space-x-3 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{r.name}</h4>
                      <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md shrink-0">
                        {new Date(r.event_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    {(r.school || r.phone) && (
                      <p className="text-xs text-slate-500 truncate">
                        {[r.school, r.phone].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {r.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{r.notes}</p>}
                  </div>
                  <button onClick={() => handleDeleteReg(r.id)} disabled={deletingRegId === r.id}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0 disabled:opacity-50">
                    {deletingRegId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── Aba Histórico ─────────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <>
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
            <span className="text-sm font-semibold text-slate-600">{snapshots.length} sessões arquivadas</span>
            <button onClick={loadSnapshots} disabled={loadingSnaps}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all">
              <RefreshCw className={`w-4 h-4 ${loadingSnaps ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingSnaps ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ) : snapshots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 space-y-2">
                <Archive className="w-8 h-8 text-slate-300" />
                <p className="text-sm">Nenhuma sessão arquivada ainda.</p>
                <p className="text-xs text-slate-400 text-center">O quantitativo é salvo automaticamente ao clicar em "Limpar tudo".</p>
              </div>
            ) : (
              snapshots.map(s => (
                <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {s.label ?? 'Sessão sem rótulo'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {new Date(s.snapshot_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        {' · '}
                        {new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-lg">
                      {s.total_players} jogadores
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Partidas', value: s.total_games },
                      { label: 'Média', value: `${s.avg_score} pts` },
                      { label: 'Máximo', value: `${s.max_score} pts` },
                    ].map(m => (
                      <div key={m.label} className="bg-slate-50 rounded-xl p-2 text-center">
                        <div className="text-sm font-black text-slate-700">{m.value}</div>
                        <div className="text-xs text-slate-400">{m.label}</div>
                      </div>
                    ))}
                  </div>
                  {s.schools && Object.keys(s.schools).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(s.schools).map(([school, count]) => (
                        <span key={school} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                          {school}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
