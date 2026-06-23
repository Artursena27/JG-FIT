'use client';

import React from 'react';
import { useBrand } from '@/context/BrandContext';
import Logo from '@/components/Logo';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Onboarding() {
  const { brand } = useBrand();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main p-6">
      <header className="flex justify-between items-center mb-10">
        <Logo size="small" />
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-white/5 rounded-lg text-text-sub hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-black mb-3">Bem-vindo, Aluno!</h1>
        <p className="text-sm text-text-sub leading-relaxed mb-8">
          Antes de começarmos os treinos com o {brand.name.split(' ')[0]}, precisamos conhecer um pouco mais sobre você.
        </p>
        
        <div className="bg-bg-card border border-border-custom p-6 rounded-2xl text-center shadow-lg">
          <p className="text-xs text-text-sub mb-4">
            (Formulário de Onboarding de 5 etapas em construção)
          </p>
          <button 
            className="w-full py-3 rounded-xl font-bold bg-primary text-accent hover:opacity-90 transition-opacity"
            onClick={() => window.location.href = '/aluno/dashboard'}
          >
            Pular por enquanto
          </button>
        </div>
      </main>
    </div>
  );
}
