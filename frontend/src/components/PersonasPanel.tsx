'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase, API_URL } from '@/lib/supabaseClient';
import { useBrand } from '@/context/BrandContext';
import { Cpu, AlertCircle, Sparkles, Star, ChevronDown, Copy, Dumbbell } from 'lucide-react';

interface PersonaMatch {
  id: string;
  name: string;
  score: number; // 0–100
}

interface PersonasResult {
  score?: number;
  matches?: PersonaMatch[];
  explanation?: string;
  suggestedStudentId?: string;
}

interface MatchStudent {
  id: string;
  name: string;
  birthdate: string | null;
  goal: string | null;
  weightKg: number | null;
  heightCm: number | null;
  weeklyFrequency: number | null;
}

interface MatchWorkout {
  id: string;
  name: string;
  label: string | null;
  exercises: {
    id: string;
    exerciseId: string;
    order: number | null;
    sets: number | null;
    reps: string | null;
    loadKg: number | null;
    restSec: number | null;
    notes: string | null;
    exercise: { name: string; muscleGroup: string | null };
  }[];
}

interface PersonasPanelProps {
  /** Aluno atual (cujas personas vemos e para quem copiamos treinos). */
  studentId: string | undefined;
  /** Chamado após copiar um treino para o aluno atual (para atualizar listas). */
  onWorkoutCopied?: () => void;
}

function pct(score: number): number {
  if (typeof score !== 'number' || isNaN(score)) return 0;
  return Math.round(Math.min(100, Math.max(0, score)));
}

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

export default function PersonasPanel({ studentId, onWorkoutCopied }: PersonasPanelProps) {
  const { brand } = useBrand();
  const c = brand.colors;

  const [result, setResult] = useState<PersonasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Persona expandida (match clicado)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [matchStudent, setMatchStudent] = useState<MatchStudent | null>(null);
  const [matchWorkouts, setMatchWorkouts] = useState<MatchWorkout[]>([]);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState('');

  const authedFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...(options.headers ?? {}), Authorization: `Bearer ${session?.access_token ?? ''}` },
    });
  }, []);

  useEffect(() => {
    if (!studentId) {
      setResult(null);
      return;
    }
    let active = true;
    const fetchPersonas = async () => {
      setLoading(true);
      setError('');
      setExpandedId(null);
      try {
        const res = await authedFetch(`/api/students/${studentId}/personas`);
        if (!res.ok) throw new Error('Falha ao buscar personas');
        const data: PersonasResult = await res.json();
        if (active) setResult(data);
      } catch (err: any) {
        if (active) setError(err.message ?? 'Erro ao buscar personas');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPersonas();
    return () => {
      active = false;
    };
  }, [studentId, authedFetch]);

  const toggleMatch = async (matchId: string) => {
    setCopyMsg('');
    if (expandedId === matchId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(matchId);
    setLoadingMatch(true);
    setMatchStudent(null);
    setMatchWorkouts([]);
    try {
      const [sRes, wRes] = await Promise.all([
        authedFetch(`/api/professor/students/${matchId}`),
        authedFetch(`/api/workouts?studentId=${matchId}`),
      ]);
      if (sRes.ok) setMatchStudent(await sRes.json());
      if (wRes.ok) setMatchWorkouts(await wRes.json());
    } catch {
      /* silencioso */
    } finally {
      setLoadingMatch(false);
    }
  };

  const copyWorkout = async (w: MatchWorkout) => {
    if (!studentId) return;
    setCopyingId(w.id);
    setCopyMsg('');
    try {
      const payload = {
        name: w.name,
        label: w.label ?? undefined,
        studentId,
        exercises: w.exercises.map((ex, i) => ({
          exerciseId: ex.exerciseId,
          order: ex.order ?? i + 1,
          sets: ex.sets ?? undefined,
          reps: ex.reps ?? undefined,
          loadKg: ex.loadKg ?? undefined,
          restSec: ex.restSec ?? undefined,
          notes: ex.notes ?? undefined,
        })),
      };
      const res = await authedFetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setCopyMsg(`Treino "${w.name}" copiado para o aluno!`);
      onWorkoutCopied?.();
    } catch {
      setCopyMsg('Erro ao copiar o treino.');
    } finally {
      setCopyingId(null);
    }
  };

  if (!studentId) {
    return (
      <div className="bg-black/30 p-5 rounded-2xl border border-border-custom text-center text-xs text-text-sub flex flex-col items-center justify-center min-h-[160px]">
        <AlertCircle className="w-8 h-8 opacity-30 mb-2" />
        Selecione um aluno para analisar compatibilidade.
      </div>
    );
  }

  const matches = result?.matches ?? [];

  return (
    <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-border-custom pb-3">
        <Cpu className="w-5 h-5" style={{ color: c.primary }} />
        <div>
          <h4 className="font-extrabold text-xs uppercase leading-none">Motor de Personas v1</h4>
          <span className="text-[9px] text-text-sub font-semibold tracking-wider block mt-1">
            ALUNOS PARECIDOS · IA
          </span>
        </div>
      </div>

      {copyMsg && (
        <div className="text-xs p-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">{copyMsg}</div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 text-text-sub gap-2">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: c.primary, borderTopColor: 'transparent' }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Analisando histórico...</span>
        </div>
      ) : error ? (
        <div className="text-red-400 text-xs p-3 bg-red-500/10 rounded-xl">{error}</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-6 text-text-sub text-xs">
          Nenhuma persona similar encontrada ainda. (É preciso ter outros alunos com perfil completo.)
        </div>
      ) : (
        <div className="space-y-3">
          {result?.explanation && (
            <div className="flex gap-2 text-[11px] text-text-sub leading-relaxed bg-black/30 p-3 rounded-xl border border-border-custom">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: c.primary }} />
              <p>{result.explanation}</p>
            </div>
          )}

          <div className="space-y-2">
            {matches.map((m) => {
              const suggested = m.id === result?.suggestedStudentId;
              const open = expandedId === m.id;
              return (
                <div key={m.id} className="rounded-xl border overflow-hidden" style={{ borderColor: open || suggested ? c.primary : 'rgba(255,255,255,0.08)' }}>
                  {/* Cabeçalho clicável do match */}
                  <button
                    onClick={() => toggleMatch(m.id)}
                    className="w-full bg-black/25 hover:bg-black/40 transition-colors p-3 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="font-bold text-xs text-white flex items-center gap-1 truncate">
                          {m.name}
                          {suggested && <Star className="w-3 h-3" style={{ color: c.primary }} />}
                        </span>
                        <span className="text-[9px] text-text-sub">Ver treinos e dados</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-black px-2 py-1 rounded" style={{ color: c.primary, backgroundColor: `${c.primary}1f` }}>
                        {pct(m.score)}%
                      </span>
                      <ChevronDown className={`w-4 h-4 text-text-sub transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Conteúdo expandido: dados + treinos + copiar */}
                  {open && (
                    <div className="p-3 space-y-3 bg-black/10 border-t border-border-custom">
                      {loadingMatch ? (
                        <div className="flex items-center gap-2 text-text-sub text-[11px] py-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Carregando persona...
                        </div>
                      ) : (
                        <>
                          {matchStudent && (
                            <div className="flex flex-wrap gap-1.5 text-[10px]">
                              <span className="px-2 py-0.5 rounded bg-black/30 border border-border-custom">
                                <span className="text-text-sub">Objetivo </span>
                                <span className="text-white font-semibold">{titleCase(matchStudent.goal)}</span>
                              </span>
                              {ageFrom(matchStudent.birthdate) !== null && (
                                <span className="px-2 py-0.5 rounded bg-black/30 border border-border-custom">
                                  <span className="text-text-sub">Idade </span>
                                  <span className="text-white font-semibold">{ageFrom(matchStudent.birthdate)}a</span>
                                </span>
                              )}
                              {matchStudent.weightKg && (
                                <span className="px-2 py-0.5 rounded bg-black/30 border border-border-custom">
                                  <span className="text-text-sub">Peso </span>
                                  <span className="text-white font-semibold">{matchStudent.weightKg}kg</span>
                                </span>
                              )}
                              {matchStudent.weeklyFrequency && (
                                <span className="px-2 py-0.5 rounded bg-black/30 border border-border-custom">
                                  <span className="text-text-sub">Freq </span>
                                  <span className="text-white font-semibold">{matchStudent.weeklyFrequency}x</span>
                                </span>
                              )}
                            </div>
                          )}

                          {matchWorkouts.length === 0 ? (
                            <div className="text-[11px] text-text-sub py-1">Este aluno não tem treinos cadastrados.</div>
                          ) : (
                            <div className="space-y-2">
                              {matchWorkouts.map((w) => (
                                <div key={w.id} className="bg-black/25 border border-border-custom rounded-lg p-2.5">
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Dumbbell className="w-3.5 h-3.5 shrink-0" style={{ color: c.primary }} />
                                      <span className="font-bold text-[11px] text-white truncate">
                                        {w.label ? `${w.label} · ` : ''}{w.name}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => copyWorkout(w)}
                                      disabled={copyingId === w.id}
                                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded shrink-0 disabled:opacity-50 cursor-pointer"
                                      style={{ backgroundColor: c.primary, color: c.accent }}
                                      title="Copiar este treino para o aluno atual"
                                    >
                                      <Copy className="w-3 h-3" />
                                      {copyingId === w.id ? 'Copiando...' : 'Copiar'}
                                    </button>
                                  </div>
                                  <ul className="space-y-0.5">
                                    {w.exercises.map((ex) => (
                                      <li key={ex.id} className="flex justify-between text-[10px] text-text-sub">
                                        <span className="text-white/90 truncate">{ex.exercise.name}</span>
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
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
