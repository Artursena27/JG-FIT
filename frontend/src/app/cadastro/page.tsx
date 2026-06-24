'use client';

import React, { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { Mail, Lock, Phone, User, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function CadastroPage() {
  const { brand } = useBrand();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const [firstName, ...rest] = brand.name.split(' ');
  const lastName = rest.join(' ');

  const renderLockup = () => (
    <div className="flex items-center justify-center gap-3">
      <img src="/logo-g.png" alt={brand.name} className="w-11 h-11 object-contain" />
      <div className="text-left">
        <div className="font-extrabold leading-none text-base tracking-wide uppercase text-white">
          {firstName} {lastName}
        </div>
        <div className="text-[9px] tracking-[0.32em] uppercase mt-1 font-semibold text-primary">
          Personal Trainer
        </div>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main p-4 sm:p-6 text-center text-text-main">
        {renderLockup()}
        <div className="mt-8 sm:mt-10 max-w-md w-full bg-bg-card border border-border-custom p-6 sm:p-8 rounded-3xl shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-4">Quase lá!</h2>
          <p className="text-text-sub mb-8 leading-relaxed">
            Acabamos de enviar um e-mail para <strong className="text-primary">{email}</strong> com um link de confirmação.
            <br /><br />
            Por favor, clique no link do e-mail para ativar sua conta e iniciar seu acompanhamento.
          </p>
          <Link href="/login" className="text-primary font-bold hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main p-4 sm:p-6 text-text-main">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          {renderLockup()}
        </div>

        <div className="bg-bg-card border border-border-custom p-6 sm:p-8 rounded-3xl shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-white">Criar Conta</h1>
            <p className="text-sm text-text-sub mt-2">
              Comece seu acompanhamento com {brand.name.split(' ')[0]}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold text-text-sub ml-1 uppercase tracking-wider">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-sub/50" />
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/20 border border-border-custom text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-sub/30"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-text-sub ml-1 uppercase tracking-wider">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-sub/50" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-border-custom text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-sub/30"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="text-xs font-semibold text-text-sub ml-1 uppercase tracking-wider">Celular (WhatsApp)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-sub/50" />
                <input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/20 border border-border-custom text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-sub/30"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold text-text-sub ml-1 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-sub/50" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-border-custom text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-sub/30"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold bg-primary text-accent hover:opacity-90 transition-opacity mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              ) : (
                'Criar minha conta'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-custom text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-text-sub hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Já tenho uma conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
