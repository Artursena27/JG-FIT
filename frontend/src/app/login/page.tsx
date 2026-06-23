'use client';

import React, { useState } from 'react';
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

      <p className="text-center text-xs pt-1" style={{ color: c.textSecondary }}>
        Não tem conta?{' '}
        <button type="button" className="font-bold hover:underline cursor-pointer" style={{ color: c.primary }}>
          Fale com seu personal
        </button>
      </p>
    </form>
  );

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: c.bg, color: c.text }}>
      {/* ============================ MOBILE: Foto Imersiva ============================ */}
      <div className="lg:hidden relative min-h-screen flex flex-col justify-end overflow-hidden">
        <img
          src="/personal-photo.jpg"
          alt={brand.name}
          className="absolute inset-0 w-full h-full object-cover object-[center_18%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 28%, ${c.bg}99 52%, ${c.bg} 88%)`,
          }}
        />
        <div className="relative z-10 px-6 pb-9 pt-10">
          <div className="mb-5">{renderLockup(true)}</div>
          <h1 className="text-2xl font-extrabold mb-1">Treine com energia</h1>
          <p className="text-sm mb-6" style={{ color: c.textSecondary }}>
            Entre e veja seu treino da semana.
          </p>
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
