'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase, API_URL } from '@/lib/supabaseClient';
import { useBrand } from '@/context/BrandContext';
import PeriodizationBuilder from '@/components/PeriodizationBuilder';
import PersonasPanel from '@/components/PersonasPanel';
import {
  ArrowLeft,
  MessageSquare,
  Dumbbell,
  Flame,
  Award,
  CreditCard,
  Apple,
  Image as ImageIcon,
  Save,
  CalendarDays,
} from 'lucide-react';

type ApiStatus = 'PENDING' | 'APPROVED' | 'ONBOARDED' | 'REJECTED';

export interface DetailStudent {
  id: string;
  name: string;
  status: ApiStatus;
  birthdate: string | null;
  sex: 'MASCULINO' | 'FEMININO' | 'OUTRO' | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  weeklyFrequency: number | null;
}

interface StudentDetailProps {
  student: DetailStudent;
  onBack: () => void;
  onChat: (student: DetailStudent) => void;
}

interface Subscription {
  status: 'ACTIVE' | 'OVERDUE' | 'CANCELED';
  planName: string | null;
  dueDate: string | null;
}

interface Gamification {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
  badges: { key: string; label: string; description: string; earned: boolean }[];
}

interface Diet {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  waterLiters: number | null;
  notes: string | null;
}

interface Workout {
  id: string;
  name: string;
  label: string | null;
  exercises: {
    id: string;
    sets: number | null;
    reps: string | null;
    loadKg: number | null;
    exercise: { name: string; muscleGroup: string | null };
  }[];
}

interface ScheduleItem {
  dayOfWeek: string;
  type: 'TREINO' | 'CARDIO' | 'DESCANSO';
  workoutId: string | null;
  notes: string | null;
}

interface ProgressPhoto {
  id: string;
  date: string;
  angle: string | null;
  signedUrl: string | null;
}

const SUB_LABEL: Record<Subscription['status'], string> = {
  ACTIVE: 'Em dia',
  OVERDUE: 'Inadimplente',
  CANCELED: 'Cancelada',
};

const DAYS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
const DAY_SHORT: Record<string, string> = {
  SEGUNDA: 'SEG',
  TERCA: 'TER',
  QUARTA: 'QUA',
  QUINTA: 'QUI',
  SEXTA: 'SEX',
  SABADO: 'SÁB',
  DOMINGO: 'DOM',
};

const DAY_FULL: Record<string, string> = {
  SEGUNDA: 'Segunda-feira',
  TERCA: 'Terça-feira',
  QUARTA: 'Quarta-feira',
  QUINTA: 'Quinta-feira',
  SEXTA: 'Sexta-feira',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

function ageFrom(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 3.15576e10);
}

function titleCase(s: string | null): string {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function isoToDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function StudentDetail({ student, onBack, onChat }: StudentDetailProps) {
  const { brand } = useBrand();
  const c = brand.colors;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [gamification, setGamification] = useState<Gamification | null>(null);
  const [diet, setDiet] = useState<Diet | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [openDay, setOpenDay] = useState<string | null>(null);

  // Edição da mensalidade
  const [subStatus, setSubStatus] = useState<Subscription['status']>('ACTIVE');
  const [subPlan, setSubPlan] = useState('');
  const [subDue, setSubDue] = useState('');
  const [savingSub, setSavingSub] = useState(false);
  const [subMsg, setSubMsg] = useState('');

  const authedFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
    });
  }, []);

  const loadSubscription = useCallback(async () => {
    try {
      const res = await authedFetch(`/api/students/${student.id}/subscription`);
      if (!res.ok) return;
      const data: Subscription | null = await res.json();
      setSubscription(data);
      if (data) {
        setSubStatus(data.status);
        setSubPlan(data.planName ?? '');
        setSubDue(isoToDateInput(data.dueDate));
      }
    } catch {
      /* silencioso por seção */
    }
  }, [authedFetch, student.id]);

  useEffect(() => {
    loadSubscription();
    authedFetch(`/api/students/${student.id}/gamification`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setGamification(d))
      .catch(() => {});
    authedFetch(`/api/students/${student.id}/diet`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDiet(d))
      .catch(() => {});
    authedFetch(`/api/workouts?studentId=${student.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setWorkouts(Array.isArray(d) ? d : []))
      .catch(() => {});
    authedFetch(`/api/students/${student.id}/schedule`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSchedule(Array.isArray(d) ? d : []))
      .catch(() => {});
    authedFetch(`/api/students/${student.id}/photos`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPhotos(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [authedFetch, student.id, loadSubscription]);

  const saveSubscription = async () => {
    setSavingSub(true);
    setSubMsg('');
    try {
      const res = await authedFetch(`/api/students/${student.id}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: subStatus,
          planName: subPlan || null,
          dueDate: subDue || null,
        }),
      });
      if (!res.ok) throw new Error();
      setSubMsg('Mensalidade atualizada!');
      await loadSubscription();
    } catch {
      setSubMsg('Erro ao salvar.');
    } finally {
      setSavingSub(false);
    }
  };

  const age = ageFrom(student.birthdate);
  const workoutById = (id: string | null) => workouts.find((w) => w.id === id);

  const subColor =
    subscription?.status === 'OVERDUE'
      ? '#f87171'
      : subscription?.status === 'CANCELED'
        ? '#94a3b8'
        : c.primary;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Voltar */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-text-sub hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a lista
      </button>

      {/* Cabeçalho */}
      <div className="bg-bg-card border border-border-custom rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div
            className="w-20 h-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-2xl font-black shrink-0"
            style={{ color: c.primary }}
          >
            {initials(student.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black text-white">{student.name}</h2>
            <p className="text-sm text-text-sub mt-0.5">
              Objetivo: <span className="text-white font-semibold">{titleCase(student.goal)}</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-black/30 border border-border-custom">
                <span className="text-text-sub">Peso </span>
                <span className="font-bold text-white">{student.weightKg ? `${student.weightKg} kg` : '—'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/30 border border-border-custom">
                <span className="text-text-sub">Altura </span>
                <span className="font-bold text-white">{student.heightCm ? `${student.heightCm} cm` : '—'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/30 border border-border-custom">
                <span className="text-text-sub">Idade </span>
                <span className="font-bold text-white">{age !== null ? `${age} anos` : '—'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/30 border border-border-custom">
                <span className="text-text-sub">Frequência </span>
                <span className="font-bold text-white">
                  {student.weeklyFrequency ? `${student.weeklyFrequency}x/sem` : '—'}
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={() => onChat(student)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 border border-border-custom hover:border-white/20 bg-black/20 hover:bg-black/40 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            Conversar
          </button>
        </div>
      </div>

      {/* Linha: Mensalidade · Gamificação · Dieta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mensalidade */}
        <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-border-custom pb-3">
            <CreditCard className="w-5 h-5" style={{ color: subColor }} />
            <span className="text-xs font-bold uppercase tracking-wider">Mensalidade</span>
            {subscription && (
              <span
                className="ml-auto text-[10px] font-black px-2 py-0.5 rounded"
                style={{ color: subColor, backgroundColor: `${subColor}1f` }}
              >
                {SUB_LABEL[subscription.status]}
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <label className="block">
              <span className="text-text-sub text-[10px] block mb-1">Situação</span>
              <select
                value={subStatus}
                onChange={(e) => setSubStatus(e.target.value as Subscription['status'])}
                className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-primary"
              >
                <option value="ACTIVE">Em dia (ACTIVE)</option>
                <option value="OVERDUE">Inadimplente (OVERDUE)</option>
                <option value="CANCELED">Cancelada (CANCELED)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-text-sub text-[10px] block mb-1">Plano</span>
              <input
                type="text"
                value={subPlan}
                onChange={(e) => setSubPlan(e.target.value)}
                placeholder="Ex.: Mensal"
                className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-text-sub text-[10px] block mb-1">Vencimento</span>
              <input
                type="date"
                value={subDue}
                onChange={(e) => setSubDue(e.target.value)}
                className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={saveSubscription}
              disabled={savingSub}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: c.primary, color: c.accent }}
            >
              <Save className="w-3.5 h-3.5" />
              Salvar
            </button>
            {subMsg && <span className="text-[10px] text-text-sub">{subMsg}</span>}
          </div>
        </div>

        {/* Gamificação */}
        <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-border-custom pb-3">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Ofensiva & Conquistas</span>
          </div>
          {gamification ? (
            <>
              <div className="flex gap-3 text-center">
                <div className="flex-1 bg-black/25 rounded-xl py-2 border border-border-custom">
                  <div className="text-2xl font-black text-orange-400">{gamification.currentStreak}</div>
                  <div className="text-[9px] text-text-sub uppercase">Ofensiva atual</div>
                </div>
                <div className="flex-1 bg-black/25 rounded-xl py-2 border border-border-custom">
                  <div className="text-2xl font-black text-white">{gamification.longestStreak}</div>
                  <div className="text-[9px] text-text-sub uppercase">Recorde</div>
                </div>
                <div className="flex-1 bg-black/25 rounded-xl py-2 border border-border-custom">
                  <div className="text-2xl font-black text-white">{gamification.totalWorkouts}</div>
                  <div className="text-[9px] text-text-sub uppercase">Treinos</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {gamification.badges.map((b) => (
                  <span
                    key={b.key}
                    title={b.description}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border"
                    style={
                      b.earned
                        ? { color: c.primary, backgroundColor: `${c.primary}1f`, borderColor: `${c.primary}55` }
                        : { color: '#64748b', backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.06)' }
                    }
                  >
                    <Award className="w-3 h-3" />
                    {b.label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="text-text-sub text-xs py-4 text-center">Sem dados de treino ainda.</div>
          )}
        </div>

        {/* Dieta */}
        <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-border-custom pb-3">
            <Apple className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Plano Alimentar</span>
          </div>
          {diet ? (
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-black/25 rounded-xl py-2 border border-border-custom">
                <div className="font-black text-white">{diet.calories ?? '—'}</div>
                <div className="text-[9px] text-text-sub uppercase">kcal</div>
              </div>
              <div className="bg-black/25 rounded-xl py-2 border border-border-custom">
                <div className="font-black text-white">{diet.protein ?? '—'}g</div>
                <div className="text-[9px] text-text-sub uppercase">Proteína</div>
              </div>
              <div className="bg-black/25 rounded-xl py-2 border border-border-custom">
                <div className="font-black text-white">{diet.carbs ?? '—'}g</div>
                <div className="text-[9px] text-text-sub uppercase">Carbo</div>
              </div>
              <div className="bg-black/25 rounded-xl py-2 border border-border-custom">
                <div className="font-black text-white">{diet.fat ?? '—'}g</div>
                <div className="text-[9px] text-text-sub uppercase">Gordura</div>
              </div>
              {diet.waterLiters != null && (
                <div className="col-span-2 bg-black/25 rounded-xl py-2 border border-border-custom">
                  <div className="font-black text-white">{diet.waterLiters} L</div>
                  <div className="text-[9px] text-text-sub uppercase">Água / dia</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-text-sub text-xs py-4 text-center">Nenhum plano alimentar definido.</div>
          )}
        </div>
      </div>

      {/* Agenda atual da semana — clique num dia para ver o treino completo */}
      <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-border-custom pb-3">
          <CalendarDays className="w-5 h-5" style={{ color: c.primary }} />
          <span className="text-xs font-bold uppercase tracking-wider">Semana atual</span>
          <span className="text-[10px] text-text-sub ml-auto">Clique num dia para ver o treino</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const item = schedule.find((s) => s.dayOfWeek === day);
            const type = item?.type ?? 'DESCANSO';
            const w = item?.workoutId ? workoutById(item.workoutId) : null;
            const isTraining = type === 'TREINO';
            const isOpen = openDay === day;
            return (
              <button
                key={day}
                onClick={() => setOpenDay(isOpen ? null : day)}
                className="rounded-xl p-2 border text-center cursor-pointer transition-transform hover:-translate-y-0.5"
                style={{
                  outline: isOpen ? `2px solid ${c.primary}` : 'none',
                  ...(isTraining
                    ? { borderColor: `${c.primary}55`, backgroundColor: `${c.primary}12` }
                    : type === 'CARDIO'
                      ? { borderColor: 'rgba(96,165,250,0.4)', backgroundColor: 'rgba(96,165,250,0.08)' }
                      : { borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(0,0,0,0.2)' }),
                }}
              >
                <div className="text-[9px] font-bold text-text-sub">{DAY_SHORT[day]}</div>
                <div
                  className="text-[10px] font-bold mt-1 truncate"
                  style={{ color: isTraining ? c.primary : type === 'CARDIO' ? '#60a5fa' : '#64748b' }}
                >
                  {isTraining ? w?.label ?? 'Treino' : type === 'CARDIO' ? 'Cardio' : 'Folga'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalhe do dia selecionado */}
        {openDay &&
          (() => {
            const item = schedule.find((s) => s.dayOfWeek === openDay);
            const type = item?.type ?? 'DESCANSO';
            const w = item?.workoutId ? workoutById(item.workoutId) : null;
            return (
              <div className="bg-black/25 border border-border-custom rounded-xl p-4 mt-1 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{DAY_FULL[openDay]}</span>
                  {type === 'TREINO' && w && (
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded"
                      style={{ color: c.accent, backgroundColor: c.primary }}
                    >
                      Ficha {w.label ?? ''} · {w.name}
                    </span>
                  )}
                </div>

                {type === 'TREINO' ? (
                  w ? (
                    <ul className="divide-y divide-border-custom">
                      {w.exercises.map((ex, i) => (
                        <li key={ex.id} className="flex justify-between py-1.5 text-xs">
                          <span className="text-white">
                            {i + 1}. {ex.exercise.name}
                            <span className="text-text-sub"> · {ex.exercise.muscleGroup ?? 'Geral'}</span>
                          </span>
                          <span className="text-text-sub shrink-0 ml-2">
                            {ex.sets ?? '-'}x{ex.reps ?? '-'}
                            {ex.loadKg ? ` · ${ex.loadKg}kg` : ''}
                            {ex.restSec ? ` · ${ex.restSec}s` : ''}
                          </span>
                        </li>
                      ))}
                      {w.exercises.length === 0 && (
                        <li className="py-2 text-xs text-text-sub">Esta ficha ainda não tem exercícios.</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-sub">Nenhuma ficha atribuída a este dia ainda.</p>
                  )
                ) : type === 'CARDIO' ? (
                  <p className="text-xs" style={{ color: '#60a5fa' }}>Dia de cardio.</p>
                ) : (
                  <p className="text-xs text-text-sub">Dia de descanso.</p>
                )}

                {item?.notes && <p className="text-[11px] text-text-sub italic">Obs.: {item.notes}</p>}
              </div>
            );
          })()}
      </div>

      {/* Treinos atuais (leitura) */}
      <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-border-custom pb-3">
          <Dumbbell className="w-5 h-5" style={{ color: c.primary }} />
          <span className="text-xs font-bold uppercase tracking-wider">Treinos do aluno ({workouts.length})</span>
        </div>
        {workouts.length === 0 ? (
          <div className="text-text-sub text-xs py-4 text-center">
            Nenhum treino ainda. Monte a ficha na prescrição abaixo.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workouts.map((w) => (
              <div key={w.id} className="bg-black/25 border border-border-custom rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded"
                    style={{ color: c.accent, backgroundColor: c.primary }}
                  >
                    {w.label ?? '—'}
                  </span>
                  <span className="font-bold text-sm text-white">{w.name}</span>
                </div>
                <ul className="space-y-1">
                  {w.exercises.map((ex) => (
                    <li key={ex.id} className="flex justify-between text-[11px] text-text-sub">
                      <span className="text-white truncate">{ex.exercise.name}</span>
                      <span className="shrink-0 ml-2">
                        {ex.sets ?? '-'}x{ex.reps ?? '-'}
                        {ex.loadKg ? ` · ${ex.loadKg}kg` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fotos de progresso */}
      <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-border-custom pb-3">
          <ImageIcon className="w-5 h-5" style={{ color: c.primary }} />
          <span className="text-xs font-bold uppercase tracking-wider">Fotos de progresso</span>
        </div>
        {photos.length === 0 ? (
          <div className="text-text-sub text-xs py-4 text-center">Nenhuma foto de evolução enviada ainda.</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="aspect-square rounded-xl overflow-hidden border border-border-custom bg-black/30">
                {p.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.signedUrl} alt={p.angle ?? 'foto'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-sub text-[10px]">sem url</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescrição: criar ficha + calendário semanal editável */}
      <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border-custom pb-3">
          <Dumbbell className="w-5 h-5" style={{ color: c.primary }} />
          <span className="text-xs font-bold uppercase tracking-wider">Prescrição do treino</span>
        </div>
        <PeriodizationBuilder studentId={student.id} />
      </div>

      {/* Personas da IA */}
      <PersonasPanel studentId={student.id} />
    </div>
  );
}
