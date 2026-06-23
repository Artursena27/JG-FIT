'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useBrand } from '@/context/BrandContext';
import { 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Activity, 
  Target, 
  HeartPulse,
  CheckCircle2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function OnboardingPage() {
  const router = useRouter();
  const { brand } = useBrand();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  
  const [session, setSession] = useState<any>(null);

  // Formulário State
  const [formData, setFormData] = useState({
    birthdate: '',
    sex: '',
    weightKg: '',
    heightCm: '',
    goal: '',
    trainingExperience: '',
    weeklyFrequency: 3,
    healthConditions: '',
    injuries: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }
      setSession(session);
      
      // Checar se já é ONBOARDED pra não deixar refazer se não quiser
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      .then(res => res.json())
      .then(user => {
        if (user.status === 'ONBOARDED') {
          router.replace('/aluno/dashboard');
        } else if (user.status === 'PENDING') {
          router.replace('/aluno/aguardando');
        } else {
          setIsFetching(false);
        }
      })
      .catch(() => setIsFetching(false));
    });
  }, [router]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      const payload: any = {};
      if (formData.birthdate) payload.birthdate = new Date(formData.birthdate).toISOString();
      if (formData.sex) payload.sex = formData.sex;
      if (formData.weightKg) payload.weightKg = parseFloat(formData.weightKg);
      if (formData.heightCm) payload.heightCm = parseFloat(formData.heightCm);
      if (formData.goal) payload.goal = formData.goal;
      if (formData.trainingExperience) payload.trainingExperience = formData.trainingExperience;
      if (formData.weeklyFrequency) payload.weeklyFrequency = parseInt(formData.weeklyFrequency as any, 10);
      if (formData.healthConditions) payload.healthConditions = formData.healthConditions;
      if (formData.injuries) payload.injuries = formData.injuries;

      const res = await fetch(`${API_URL}/api/students/me/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao salvar onboarding');
      }

      // Sucesso!
      setStep(5); // Tela de sucesso
      setTimeout(() => {
        router.replace('/aluno/dashboard');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    // Validações simples por passo
    if (step === 1 && (!formData.birthdate || !formData.sex)) return setError('Preencha os campos obrigatórios.');
    if (step === 2 && (!formData.weightKg || !formData.heightCm)) return setError('Preencha os campos obrigatórios.');
    if (step === 3 && (!formData.goal || !formData.trainingExperience)) return setError('Selecione seu objetivo e experiência.');
    
    setError('');
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const prevStep = () => {
    setError('');
    if (step > 1) setStep(step - 1);
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

  if (isFetching) {
    return <div className="min-h-screen bg-bg-main flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col items-center py-10 px-6">
      {renderLockup()}

      {step < 5 && (
        <div className="w-full max-w-xl mt-12 mb-6 flex justify-between items-center px-4 relative">
          {/* Linha de progresso de fundo */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-border-custom -z-10 translate-y-[-50%] rounded-full" />
          {/* Linha de progresso preenchida */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-primary -z-10 translate-y-[-50%] rounded-full transition-all duration-500" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all duration-300 ${
                step >= s 
                  ? 'bg-primary border-bg-main text-accent' 
                  : 'bg-bg-card border-border-custom text-text-sub'
              }`}
            >
              {s === 1 && <User size={18} />}
              {s === 2 && <Activity size={18} />}
              {s === 3 && <Target size={18} />}
              {s === 4 && <HeartPulse size={18} />}
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-xl bg-bg-card border border-border-custom p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {/* PASSO 1: DADOS BÁSICOS */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-black text-white mb-2">Quem é você?</h2>
            <p className="text-text-sub text-sm mb-8">Precisamos desses dados para calcular seu metabolismo base.</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2 block">Data de Nascimento</label>
                <input 
                  type="date" 
                  value={formData.birthdate}
                  onChange={(e) => handleChange('birthdate', e.target.value)}
                  className="w-full bg-black/20 border border-border-custom text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2 block">Sexo Biológico</label>
                <div className="grid grid-cols-3 gap-3">
                  {['MASCULINO', 'FEMININO', 'OUTRO'].map((sex) => (
                    <button
                      key={sex}
                      onClick={() => handleChange('sex', sex)}
                      className={`py-3 rounded-xl border font-bold text-xs transition-all ${
                        formData.sex === sex 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border-custom text-text-sub hover:border-text-sub/50'
                      }`}
                    >
                      {sex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 2: BIOMETRIA */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-black text-white mb-2">Sua Biometria</h2>
            <p className="text-text-sub text-sm mb-8">Dados cruciais para a matemática do seu treino.</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2 block">Altura (cm)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 175"
                  value={formData.heightCm}
                  onChange={(e) => handleChange('heightCm', e.target.value)}
                  className="w-full bg-black/20 border border-border-custom text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2 block">Peso Atual (kg)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 72.5"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={(e) => handleChange('weightKg', e.target.value)}
                  className="w-full bg-black/20 border border-border-custom text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3: OBJETIVO */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-black text-white mb-2">Seu Foco</h2>
            <p className="text-text-sub text-sm mb-8">O que você quer conquistar com {brand.name.split(' ')[0]}?</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2 block">Objetivo Principal</label>
                <div className="grid grid-cols-2 gap-3">
                  {['HIPERTROFIA', 'EMAGRECIMENTO', 'CONDICIONAMENTO', 'FORCA', 'SAUDE', 'REABILITACAO'].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleChange('goal', g)}
                      className={`py-3 rounded-xl border font-bold text-xs transition-all ${
                        formData.goal === g 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border-custom text-text-sub hover:border-text-sub/50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2 block">Experiência de Treino</label>
                <div className="grid grid-cols-3 gap-3">
                  {['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].map((exp) => (
                    <button
                      key={exp}
                      onClick={() => handleChange('trainingExperience', exp)}
                      className={`py-3 rounded-xl border font-bold text-xs transition-all ${
                        formData.trainingExperience === exp 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border-custom text-text-sub hover:border-text-sub/50'
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2 block">Dias por semana (Frequência)</label>
                <input 
                  type="range" 
                  min="1" max="7" 
                  value={formData.weeklyFrequency}
                  onChange={(e) => handleChange('weeklyFrequency', e.target.value)}
                  className="w-full accent-primary"
                />
                <div className="text-center font-bold text-primary text-xl mt-2">{formData.weeklyFrequency} dias</div>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 4: SAÚDE */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-black text-white mb-2">Histórico de Saúde</h2>
            <p className="text-text-sub text-sm mb-8">Nossa prioridade é a sua segurança (Opcional).</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2 block">Lesões ou Dores crônicas?</label>
                <textarea 
                  placeholder="Ex: Dor no joelho direito, Hérnia de disco L4-L5..."
                  value={formData.injuries}
                  onChange={(e) => handleChange('injuries', e.target.value)}
                  className="w-full bg-black/20 border border-border-custom text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2 block">Condições Médicas?</label>
                <textarea 
                  placeholder="Ex: Hipertensão, Asma, Diabetes..."
                  value={formData.healthConditions}
                  onChange={(e) => handleChange('healthConditions', e.target.value)}
                  className="w-full bg-black/20 border border-border-custom text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TELA 5: SUCESSO */}
        {step === 5 && (
          <div className="animate-in zoom-in-95 duration-500 text-center py-10">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Tudo Certo!</h2>
            <p className="text-text-sub mb-8 text-lg">
              Sua jornada começa agora. Gerando seu dashboard...
            </p>
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* CONTROLES / BOTÕES */}
        {step < 5 && (
          <div className="mt-10 flex gap-4">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="px-6 py-3.5 rounded-xl font-bold bg-black/20 text-text-main border border-border-custom hover:bg-black/40 transition-all flex items-center gap-2"
              >
                <ChevronLeft size={20} />
                Voltar
              </button>
            )}
            <button 
              onClick={nextStep}
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-xl font-bold bg-primary text-accent hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              ) : step === 4 ? (
                'Finalizar Cadastro'
              ) : (
                <>Próximo <ChevronRight size={20} /></>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
