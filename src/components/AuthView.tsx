import React, { useState } from 'react';
import { Trophy, User, Phone, School, ArrowRight, Shield, LogIn } from 'lucide-react';
import { ADMIN_PHONE, ADMIN_PASSWORD } from '../constants';

interface Props {
  onAuth: (name: string, phone: string, school: string) => Promise<string | null>;
  onLogin: (phone: string) => Promise<string | null>;
  onRanking: () => void;
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function AuthView({ onAuth, onLogin, onRanking }: Props) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [form, setForm] = useState({ name: '', phone: '', school: '', password: '' });
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const isAdminPhone = form.phone.replace(/\D/g, '') === ADMIN_PHONE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setAuthError('');
    if (isAdminPhone) {
      if (form.password !== ADMIN_PASSWORD) {
        setPasswordError('Senha incorreta. Tente novamente.');
        return;
      }
      if (form.name && form.phone) {
        setAuthLoading(true);
        try {
          const err = await onAuth(form.name, form.phone, 'Secretaria de IA');
          if (err) setAuthError(err);
        } catch {
          setAuthError('Erro ao conectar. Verifique sua internet e tente novamente.');
        } finally {
          setAuthLoading(false);
        }
      }
      return;
    }
    if (form.name && form.phone && form.school) {
      setAuthLoading(true);
      try {
        const err = await onAuth(form.name, form.phone, form.school);
        if (err) setAuthError(err);
      } catch {
        setAuthError('Erro ao conectar. Verifique sua internet e tente novamente.');
      } finally {
        setAuthLoading(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const err = await onLogin(loginPhone.replace(/\D/g, ''));
    setLoginLoading(false);
    if (err) setLoginError(err);
  };

  const leftPanel = (
    <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-purple-700 via-indigo-700 to-slate-900 flex-col items-center justify-between p-12 text-white">
      <div />
      <div className="flex flex-col items-center">
        <img src="/logos/logo-evento.png" alt="Piauí para o Mundo" className="h-40 w-auto object-contain mb-8 drop-shadow-2xl" />
        <p className="text-white/60 text-center text-base max-w-xs">
          {mode === 'login' ? 'Digite seu WhatsApp para retomar a batalha.' : 'Faça seu cadastro uma vez e participe da maior Batalha de Prompts do Piauí!'}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <img src="/logos/logo-soberania.svg" alt="Soberania IA" className="h-8 w-auto object-contain opacity-80" />
        <img src="/logos/logo-pit.png" alt="PIT" className="h-16 w-auto object-contain opacity-80 rounded-lg" />
      </div>
    </div>
  );

  const mobileTopLogo = (
    <>
      <div className="flex justify-center md:hidden w-full mb-8">
        <img src="/logos/logo-evento.png" alt="Piauí para o Mundo" className="h-24 w-auto object-contain drop-shadow-lg" />
      </div>
      <div className="hidden md:flex justify-center w-full mb-6">
        <img src="/logos/logo-sia.svg" alt="SIA" className="h-20 w-auto object-contain opacity-90" />
      </div>
    </>
  );

  const mobileFooter = (
    <div className="flex justify-center items-center space-x-4 md:hidden w-full pt-4 border-t border-slate-200 mt-4">
      <img src="/logos/logo-sia.svg" alt="SIA" className="h-10 w-auto object-contain opacity-80" />
      <img src="/logos/logo-soberania-escuro.png" alt="Soberania IA" className="h-14 w-auto object-contain opacity-90" />
      <img src="/logos/logo-pit-preta.png" alt="PIT" className="h-16 w-auto object-contain opacity-80 rounded-lg" />
    </div>
  );

  if (mode === 'login') {
    return (
      <div className="flex flex-col h-full md:flex-row md:h-full">
        {leftPanel}
        <div className="flex flex-col flex-1 overflow-y-auto p-6 md:p-12 bg-slate-50">
          <div className="flex flex-col md:my-auto">
            {mobileTopLogo}

            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-1">
                <LogIn className="w-5 h-5 text-purple-500" />
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Já tenho cadastro</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800">Bem-vindo(a) de volta!</h2>
              <p className="text-slate-500 mt-1">Digite seu WhatsApp para entrar e jogar novamente.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 w-full md:max-w-md">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600 ml-1">WhatsApp cadastrado</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-slate-400" />
                  </div>
                  <input required type="tel" placeholder="(86) 99999-9999"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    value={loginPhone}
                    onChange={e => setLoginPhone(formatPhone(e.target.value))} />
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">⚠️ {loginError}</div>
              )}

              <button type="submit" disabled={loginLoading}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold text-sm shadow transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-60">
                <ArrowRight className="w-5 h-5" />
                <span>{loginLoading ? 'Buscando...' : 'Entrar'}</span>
              </button>

              <button type="button" onClick={() => { setMode('register'); setLoginError(''); }}
                className="w-full py-2 bg-white border-2 border-slate-100 text-slate-600 hover:border-purple-200 hover:bg-purple-50 rounded-lg font-semibold text-sm transition-all">
                Fazer novo cadastro
              </button>

              <button type="button" onClick={onRanking}
                className="w-full py-2 bg-white border-2 border-slate-100 text-slate-700 hover:border-purple-200 hover:bg-purple-50 rounded-lg font-semibold text-sm transition-all flex items-center justify-center space-x-2 active:scale-95">
                <Trophy className="w-5 h-5 text-purple-500" />
                <span>Ver Ranking</span>
              </button>
            </form>
            {mobileFooter}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full md:flex-row md:h-full">
      {leftPanel}

      <div className="flex flex-col flex-1 overflow-y-auto p-6 md:p-12 bg-slate-50">
        <div className="flex flex-col md:my-auto">
          {mobileTopLogo}

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
                    className={`w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all${type === 'text' ? ' uppercase' : ''}`}
                    value={form[key as keyof typeof form]}
                    onChange={e => {
                      const val = key === 'phone' ? formatPhone(e.target.value) : e.target.value.toUpperCase();
                      setForm(f => ({ ...f, [key]: val }));
                    }} />
                </div>
              </div>
            ))}

            {isAdminPhone && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600 ml-1">Senha de acesso</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="w-5 h-5 text-yellow-400" />
                  </div>
                  <input required type="password" placeholder="••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-white border-2 border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                {passwordError && (
                  <p className="text-red-600 text-xs ml-1 font-medium">⚠️ {passwordError}</p>
                )}
              </div>
            )}

            {isAdminPhone && (
              <input type="hidden" value="Secretaria de IA"
                onChange={() => setForm(f => ({ ...f, school: 'Secretaria de IA' }))} />
            )}

            {!isAdminPhone && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Proteção de Dados — LGPD</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ao participar, você autoriza a <strong>Secretaria de Inteligência Artificial (SIA)</strong> a coletar seu <strong>nome, WhatsApp e escola</strong> exclusivamente para organização e exibição do ranking da <em>Batalha de Prompts — Piauí para o Mundo</em>, conforme a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>. Os dados serão usados somente durante o evento e não serão compartilhados com terceiros.
                </p>
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input type="checkbox" required checked={lgpdAccepted}
                    onChange={e => setLgpdAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-purple-600 shrink-0 cursor-pointer" />
                  <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                    Li e concordo com o uso dos meus dados conforme descrito acima.
                  </span>
                </label>
              </div>
            )}

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">⚠️ {authError}</div>
            )}

            <button type="submit"
              disabled={authLoading || (!isAdminPhone && !lgpdAccepted)}
              className={`w-full py-2 rounded-lg font-bold text-sm shadow transition-all flex items-center justify-center space-x-2 active:scale-95 mt-2 ${
                isAdminPhone
                  ? 'bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white disabled:opacity-60'
                  : lgpdAccepted
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-60'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}>
              {isAdminPhone ? <Shield className="w-5 h-5 text-yellow-400" /> : <ArrowRight className="w-5 h-5" />}
              <span>{authLoading ? 'Verificando...' : isAdminPhone ? 'Acessar Painel Admin' : 'Entrar na Batalha'}</span>
            </button>

            {!isAdminPhone && (
              <button type="button" onClick={() => { setMode('login'); setPasswordError(''); }}
                className="w-full py-2 bg-white border-2 border-slate-100 text-slate-600 hover:border-purple-200 hover:bg-purple-50 rounded-lg font-semibold text-sm transition-all flex items-center justify-center space-x-2 active:scale-95">
                <LogIn className="w-5 h-5 text-purple-400" />
                <span>Já tenho cadastro</span>
              </button>
            )}

            <button type="button" onClick={onRanking}
              className="w-full py-2 bg-white border-2 border-slate-100 text-slate-700 hover:border-purple-200 hover:bg-purple-50 rounded-lg font-semibold text-sm transition-all flex items-center justify-center space-x-2 active:scale-95">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span>Ver Ranking</span>
            </button>
          </form>
          {mobileFooter}
        </div>
      </div>
    </div>
  );
}
