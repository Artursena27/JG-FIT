'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBrand } from '@/context/BrandContext';
import { Mail, Lock } from 'lucide-react';
import { supabase, API_URL } from '@/lib/supabaseClient';

/**
 * Tela de login JG-FIT.
 * Layout responsivo com DOIS desenhos (escolha do cliente):
 *  - Mobile  -> "G Watermark": G gigante de marca d'agua + form centralizado.
 *  - Desktop -> "Diagonal": painel lime com corte diagonal + card de form.
 * Mantém o sistema white-label (useBrand) e o roteamento por papel.
 *
 * Robustez do fluxo:
 *  - Erros de auth traduzidos (email não confirmado, credencial inválida, rate limit).
 *  - "Esqueci minha senha" funcional (envia link + form inline de nova senha).
 *  - Redirect só acontece com o perfil REAL do backend; se /api/auth/me falhar,
 *    mostra erro em vez de mandar o usuário pro lugar errado.
 */

type AuthErrorLike = { code?: string; message?: string } | null | undefined;

/** Traduz o erro do Supabase Auth para uma mensagem clara ao usuário. */
function friendlyAuthError(err: AuthErrorLike): string {
  const code = err?.code ?? '';
  const msg = (err?.message ?? '').toLowerCase();
  if (code === 'email_not_confirmed' || msg.includes('not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Confira sua caixa de entrada (e o spam).';
  }
  if (code === 'invalid_credentials' || msg.includes('invalid login')) {
    return 'E-mail ou senha incorretos.';
  }
  if (
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    msg.includes('rate limit')
  ) {
    return 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  return 'Não foi possível entrar. Tente novamente.';
}

export default function LoginPage() {
  const { brand } = useBrand();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  // Modo "definir nova senha" (chega via link de recuperação do e-mail).
  const [recoveryMode, setRecoveryMode] = useState(false);

  const c = brand.colors;
  const firstName = brand.name.split(' ')[0];
  const lastName = brand.name.split(' ').slice(1).join(' ');

  // Refs para ler o valor mais recente dentro de callbacks assíncronos.
  const recoveryRef = useRef(false);
  const redirectingRef = useRef(false);
  recoveryRef.current = recoveryMode;

  // Redireciona conforme papel/status REAIS vindos do backend.
  // Se não conseguir o perfil, NÃO chuta destino: mostra erro.
  const checkUserAndRedirect = async (session: { access_token: string } | null) => {
    if (!session || redirectingRef.current || recoveryRef.current) return;
    redirectingRef.current = true;
    setIsLoading(true);
    setError('');

    let me: { role?: string; status?: string } | null = null;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) me = await res.json();
    } catch {
      /* tratado abaixo */
    }

    if (!me) {
      // Autenticou no Supabase mas o backend não respondeu o perfil.
      redirectingRef.current = false;
      setIsLoading(false);
      setError(
        'Entramos na sua conta, mas não foi possível carregar seu perfil. Tente novamente em instantes.',
      );
      return;
    }

    const role = me.role ?? 'ALUNO';
    const status = me.status ?? 'PENDING';
    const slug = brand.name.toLowerCase().replace(/\s+/g, '-');

    if (role === 'PROFESSOR') {
      window.location.href = `/professor/dashboard?personal=${slug}`;
    } else if (status === 'PENDING') {
      window.location.href = `/aluno/aguardando?personal=${slug}`;
    } else if (status === 'APPROVED') {
      window.location.href = `/aluno/onboarding?personal=${slug}`;
    } else {
      window.location.href = `/aluno/dashboard?personal=${slug}`;
    }
  };

  useEffect(() => {
    // Link de recuperação chega com "type=recovery" no fragmento da URL.
    const isRecoveryLink =
      typeof window !== 'undefined' && window.location.hash.includes('type=recovery');
    if (isRecoveryLink) {
      setRecoveryMode(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        return;
      }
      if (event === 'SIGNED_IN' && session && !recoveryRef.current) {
        checkUserAndRedirect(session);
      }
    });

    // Sessão já ativa ao carregar (mas não durante recuperação de senha).
    if (!isRecoveryLink) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) checkUserAndRedirect(session);
      });
    }

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand.name]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setIsLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError || !data.session) {
      setError(friendlyAuthError(authError));
      setIsLoading(false);
      return;
    }
    // onAuthStateChange (SIGNED_IN) dispara o roteamento; spinner segue até navegar.
  };

  const handleGoogleLogin = async () => {
    setError('');
    setInfo('');
    setIsLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (authError) {
      setError('Erro ao entrar com Google. Tente o login por e-mail.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Digite seu e-mail no campo acima para receber o link de redefinição.');
      return;
    }
    setIsLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    setIsLoading(false);
    if (resetError) {
      setError(friendlyAuthError(resetError));
      return;
    }
    setInfo('Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.');
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (newPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(friendlyAuthError(updateError));
      setIsLoading(false);
      return;
    }
    // Senha trocada: sai do modo recovery e entra normalmente.
    setInfo('Senha alterada com sucesso! Entrando...');
    recoveryRef.current = false;
    setRecoveryMode(false);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    checkUserAndRedirect(session);
  };

  const handleSignUp = () => {
    window.location.href = '/cadastro';
  };

  /** Caixa de erro / info reutilizável. */
  const renderAlerts = () => (
    <>
      {error && (
        <div className="text-xs rounded-lg px-3 py-2.5 border border-red-500/25 bg-red-500/10 text-red-300">
          {error}
        </div>
      )}
      {info && (
        <div className="text-xs rounded-lg px-3 py-2.5 border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
          {info}
        </div>
      )}
    </>
  );

  /** Form de definir nova senha (modo recuperação). */
  const renderRecoveryForm = () => (
    <form onSubmit={handleSetNewPassword} className="space-y-4 text-left">
      {renderAlerts()}
      <p className="text-xs" style={{ color: c.textSecondary }}>
        Defina uma nova senha para sua conta.
      </p>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium" style={{ color: c.textSecondary }}>
          Nova senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 w-4 h-4" style={{ color: c.textSecondary }} />
          <input
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-1"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${c.border}`,
              color: c.text,
            }}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-xl font-extrabold text-[13px] uppercase tracking-[0.08em] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
        style={{ backgroundColor: c.primary, color: c.accent, boxShadow: `0 10px 30px ${c.primary}33` }}
      >
        {isLoading ? (
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          'Salvar nova senha'
        )}
      </button>
    </form>
  );

  /** Formulário de login (reutilizado nos dois layouts). */
  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4 text-left">
      {renderAlerts()}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium" style={{ color: c.textSecondary }}>
          E-mail
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3.5 w-4 h-4" style={{ color: c.textSecondary }} />
          <input
            type="email"
            autoComplete="email"
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
            onClick={handleForgotPassword}
            disabled={isLoading}
            className="text-xs font-medium hover:underline cursor-pointer disabled:opacity-60"
            style={{ color: c.primary }}
          >
            Esqueci minha senha
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 w-4 h-4" style={{ color: c.textSecondary }} />
          <input
            type="password"
            autoComplete="current-password"
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
          style={{ backgroundColor: c.primary, color: c.accent, boxShadow: `0 10px 30px ${c.primary}33` }}
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
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: c.text }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1S8.7 5.9 12 5.9c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.8 3.26 14.6 2.3 12 2.3 6.86 2.3 2.7 6.46 2.7 11.6S6.86 21 12 21c5.5 0 9.14-3.87 9.14-9.32 0-.63-.07-1.1-.16-1.58H12z" />
          </svg>
          Entrar com Google
        </button>
      </div>

      <p className="text-center text-xs pt-2" style={{ color: c.textSecondary }}>
        Não tem conta?{' '}
        <button
          type="button"
          onClick={handleSignUp}
          disabled={isLoading}
          className="font-bold hover:underline cursor-pointer"
          style={{ color: c.primary }}
        >
          Cadastrar agora
        </button>
      </p>
    </form>
  );

  const renderForm = () => (recoveryMode ? renderRecoveryForm() : renderLoginForm());
  const heading = recoveryMode ? 'Nova senha' : 'Entrar';

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: c.bg, color: c.text }}>
      {/* ============================ MOBILE: G Watermark ============================ */}
      <div
        className="lg:hidden relative min-h-screen flex flex-col justify-center overflow-hidden px-7 py-10"
        style={{ backgroundColor: c.bg }}
      >
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
          <div className="text-[10px] font-semibold tracking-[0.42em] uppercase mb-1" style={{ color: c.primary }}>
            {brand.name}
          </div>
          <h1 className="text-3xl font-extrabold mb-1">{heading}</h1>
          <div className="text-[11px] tracking-[0.26em] uppercase mb-6" style={{ color: c.textSecondary }}>
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
        <div
          className="relative flex flex-col justify-center px-16"
          style={{ backgroundColor: c.primary, clipPath: 'polygon(0 0, 100% 0, 76% 100%, 0 100%)' }}
        >
          <img src="/logo-g-navy.png" alt={brand.name} className="w-28 object-contain mb-7" />
          <div className="font-black leading-[1.02] text-5xl uppercase" style={{ color: c.accent }}>
            {firstName}
            <br />
            {lastName}
          </div>
          <div className="mt-3 text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: c.accent, opacity: 0.7 }}>
            Personal Trainer
          </div>
        </div>

        <div className="flex items-center justify-center px-12">
          <div className="w-full max-w-sm">
            <h2 className="text-3xl font-extrabold mb-1">{heading}</h2>
            <p className="text-sm mb-6" style={{ color: c.textSecondary }}>
              {recoveryMode ? 'Escolha uma senha nova e segura.' : 'Bora pro treino de hoje.'}
            </p>
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
}
