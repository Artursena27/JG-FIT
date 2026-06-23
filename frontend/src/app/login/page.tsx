'use client';

import React, { useState, useEffect } from 'react';
import { useBrand } from '@/context/BrandContext';
import { Mail, Lock } from 'lucide-react';
import { supabase, API_URL } from '@/lib/supabaseClient';

/**
 * Tela de login JG-FIT.
 * Layout responsivo com DOIS desenhos (escolha do cliente):
 *  - Mobile  -> "Foto Imersiva": foto do personal em tela cheia + form embaixo.
 *  - Desktop -> "Banner Hero": copy grande à esquerda + card de form à direita.
 * Mantém o sistema white-label (useBrand) e o roteamento por papel.
 */
export default function LoginPage() {
  const { brand } = useBrand();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const c = brand.colors;
  const firstName = brand.name.split(' ')[0];
  const lastName = brand.name.split(' ').slice(1).join(' ');

  // Redireciona o usuário caso ele já esteja logado (ex: retorno do Google OAuth)
  useEffect(() => {
    const checkUserAndRedirect = async (session: any) => {
      if (!session) return;
      setIsLoading(true);
      
      let role = 'ALUNO';
      let status = 'PENDING';
      
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const me = await res.json();
          role = me.role ?? 'ALUNO';
          status = me.status ?? 'PENDING';
        }
      } catch {
        // Fallback
      }

      const slug = brand.name.toLowerCase().replace(/\s+/g, '-');
      
      if (role === 'PROFESSOR') {
        window.location.href = `/professor/dashboard?personal=${slug}`;
      } else {
        if (status === 'PENDING') {
          window.location.href = `/aluno/aguardando?personal=${slug}`;
        } else if (status === 'APPROVED') {
          window.location.href = `/aluno/onboarding?personal=${slug}`;
        } else {
          window.location.href = `/aluno/dashboard?personal=${slug}`;
        }
      }
    };

    // Escuta mudanças de estado (como o retorno do redirecionamento do Google)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        checkUserAndRedirect(session);
      }
    });

    // Checa se já tem sessão ativa ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserAndRedirect(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [brand.name]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setError('');
    setIsLoading(true);

    // 1) Autentica no Supabase Auth (e-mail/senha real)
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError || !data.session) {
      setError('E-mail ou senha incorretos.');
      setIsLoading(false);
      return;
    }

    // 2) Descobre o papel (Professor/Aluno) consultando o backend
    let role = 'ALUNO';
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (res.ok) {
        const me = await res.json();
        role = me.role ?? 'ALUNO';
      }
    } catch {
      // se o backend nao responder, segue como ALUNO
    }

    // 3) Roteia pro painel certo
    const slug = brand.name.toLowerCase().replace(/\s+/g, '-');
    window.location.href = `/${role === 'PROFESSOR' ? 'professor' : 'aluno'}/dashboard?personal=${slug}`;
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    if (authError) {
      setError('Erro ao entrar com Google.');
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Preencha e-mail e senha para se cadastrar.');
      return;
    }
    setError('');
    setIsLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) {
      setError(authError.message || 'Erro ao cadastrar.');
      setIsLoading(false);
      return;
    }
    setError('Cadastro realizado com sucesso! Faça login ou verifique seu e-mail.');
    setIsLoading(false);
  };

  /** Lockup logo + nome (reutilizado nos dois layouts). */
  const renderLockup = (light = false) => (
    <div className="flex items-center gap-3">
      <img src="/logo-g.png" alt={brand.name} className="w-11 h-11 object-contain" />
      <div>
        <div
          className="font-extrabold leading-none text-base tracking-wide uppercase"
          style={{ color: light ? '#fff' : c.text }}
        >
          {firstName} {lastName}
        </div>
        <div
          className="text-[9px] tracking-[0.32em] uppercase mt-1 font-semibold"
          style={{ color: c.primary }}
        >
          Personal Trainer
        </div>
      </div>
    </div>
  );

  /** Formulário (reutilizado nos dois layouts). */
  const renderForm = () => (
    <form onSubmit={handleLogin} className="space-y-4 text-left">
      {error && (
        <div className="text-xs rounded-lg px-3 py-2.5 border border-red-500/25 bg-red-500/10 text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium" style={{ color: c.textSecondary }}>
          E-mail
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3.5 top-3.5 w-4 h-4"
            style={{ color: c.textSecondary }}
          />
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-1"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${c.border}`,
              color: c.text,
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-medium" style={{ color: c.textSecondary }}>
            Senha
          </label>
          <button
            type="button"
            className="text-xs font-medium hover:underline cursor-pointer"
            style={{ color: c.primary }}
          >
            Esqueci minha senha
          </button>
        </div>
        <div className="relative">
          <Lock
            className="absolute left-3.5 top-3.5 w-4 h-4"
            style={{ color: c.textSecondary }}
          />
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-1"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${c.border}`,
              color: c.text,
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl font-extrabold text-[13px] uppercase tracking-[0.08em] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          style={{
            backgroundColor: c.primary,
            color: c.accent,
            boxShadow: `0 10px 30px ${c.primary}33`,
          }}
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            'Entrar'
          )}
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl font-extrabold text-[13px] uppercase tracking-[0.08em] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer border border-white/10"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: c.text,
          }}
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Entrar com Google
        </button>
      </div>

      <p className="text-center text-xs pt-2" style={{ color: c.textSecondary }}>
        Não tem conta?{' '}
        <button type="button" onClick={handleSignUp} disabled={isLoading} className="font-bold hover:underline cursor-pointer" style={{ color: c.primary }}>
          Cadastrar agora
        </button>
      </p>
    </form>
  );

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: c.bg, color: c.text }}>
      {/* ============================ MOBILE: G Watermark ============================ */}
      <div
        className="lg:hidden relative min-h-screen flex flex-col justify-center overflow-hidden px-7 py-10"
        style={{ backgroundColor: c.bg }}
      >
        {/* G gigante de marca d'agua */}
        <img
          src="/logo-g.png"
          alt=""
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[135%] max-w-none object-contain opacity-[0.06] pointer-events-none"
        />
        <div className="relative z-10 text-center">
          <img
            src="/logo-g.png"
            alt={brand.name}
            className="w-14 h-14 object-contain mx-auto mb-4"
            style={{ filter: `drop-shadow(0 8px 22px ${c.primary}59)` }}
          />
          <div
            className="text-[10px] font-semibold tracking-[0.42em] uppercase mb-1"
            style={{ color: c.primary }}
          >
            {brand.name}
          </div>
          <h1 className="text-3xl font-extrabold mb-1">Entrar</h1>
          <div
            className="text-[11px] tracking-[0.26em] uppercase mb-6"
            style={{ color: c.textSecondary }}
          >
            Área do Aluno
          </div>
          {renderForm()}
        </div>
      </div>

      {/* ============================ DESKTOP: Diagonal ============================ */}
      <div
        className="hidden lg:grid grid-cols-2 min-h-screen relative overflow-hidden"
        style={{ backgroundColor: c.bg }}
      >
        {/* Painel lime com corte diagonal */}
        <div
          className="relative flex flex-col justify-center px-16"
          style={{
            backgroundColor: c.primary,
            clipPath: 'polygon(0 0, 100% 0, 76% 100%, 0 100%)',
          }}
        >
          <img src="/logo-g-navy.png" alt={brand.name} className="w-28 object-contain mb-7" />
          <div className="font-black leading-[1.02] text-5xl uppercase" style={{ color: c.accent }}>
            {firstName}
            <br />
            {lastName}
          </div>
          <div
            className="mt-3 text-xs font-semibold tracking-[0.3em] uppercase"
            style={{ color: c.accent, opacity: 0.7 }}
          >
            Personal Trainer
          </div>
        </div>

        {/* Formulário (lado navy) */}
        <div className="flex items-center justify-center px-12">
          <div className="w-full max-w-sm">
            <h2 className="text-3xl font-extrabold mb-1">Entrar</h2>
            <p className="text-sm mb-6" style={{ color: c.textSecondary }}>
              Bora pro treino de hoje.
            </p>
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
}
