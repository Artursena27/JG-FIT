'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import Logo from '@/components/Logo';
import { Clock, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function AguardandoAprovacao() {
  const { brand } = useBrand();
  const router = useRouter();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.status === 'APPROVED') {
          router.push('/aluno/onboarding');
        } else if (data.status === 'ONBOARDED') {
          router.push('/aluno/dashboard');
        }
      } catch (err) {
        // ignore errors in silence
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 8000);

    return () => clearInterval(intervalId);
  }, [router]);

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

      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        <div className="w-20 h-20 bg-black/30 border border-border-custom rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <Clock className="w-10 h-10 text-text-sub animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-black mb-3">Sua solicitação foi recebida!</h1>
        <p className="text-sm text-text-sub leading-relaxed mb-4">
          Sua conta foi criada com sucesso. Para garantir a qualidade do acompanhamento, 
          o treinador <strong className="text-white">{brand.name.split(' ')[0]}</strong> precisa aprovar sua entrada.
        </p>
        
        <div className="flex items-center gap-2 text-xs text-primary/80 mb-8 animate-pulse font-medium">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          Aguardando aprovação...
        </div>

        <div className="bg-bg-card border border-border-custom p-5 rounded-2xl w-full text-left shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-sub mb-2">O que acontece agora?</h3>
          <ul className="text-xs space-y-3 mt-4 text-text-sub/80">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Seu perfil está na fila de aprovação. Esta tela atualizará automaticamente.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Assim que aprovado, você será redirecionado para preencher sua avaliação.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Você pode sair e voltar mais tarde se preferir.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
