'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase, API_URL } from '@/lib/supabaseClient';
import { useBrand } from '@/context/BrandContext';
import { Search, Plus, Trash2, Pencil, X } from 'lucide-react';

interface ApiExercise {
  id: string;
  name: string;
  muscleGroup: string | null;
}

interface SelectedExercise {
  exerciseId: string;
  name: string;
  muscleGroup: string | null;
  sets: number;
  reps: string;
  loadKg?: number;
  restSec?: number;
  notes?: string;
}

interface ApiWorkout {
  id: string;
  name: string;
  label: string | null;
  exercises: {
    id: string;
    exerciseId: string;
    sets: number | null;
    reps: string | null;
    loadKg: number | null;
    restSec: number | null;
    notes: string | null;
    exercise: { name: string; muscleGroup: string | null };
  }[];
}

interface PeriodizationBuilderProps {
  studentId: string | undefined;
  /** Muda este valor para forçar recarregar as fichas (ex.: após copiar treino). */
  reloadKey?: number;
}

const DAYS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
const DAY_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda',
  TERCA: 'Terça',
  QUARTA: 'Quarta',
  QUINTA: 'Quinta',
  SEXTA: 'Sexta',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

export default function PeriodizationBuilder({ studentId, reloadKey }: PeriodizationBuilderProps) {
  const { brand } = useBrand();
  const c = brand.colors;

  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  // Adicionar exercício ao catálogo
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');
  const [newExVideo, setNewExVideo] = useState('');
  const [addingExercise, setAddingExercise] = useState(false);

  // Estado do treino (criar OU editar)
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutLabel, setWorkoutLabel] = useState('A');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);

  // Fichas existentes do aluno (com exercícios)
  const [studentWorkouts, setStudentWorkouts] = useState<ApiWorkout[]>([]);

  // Agenda da semana
  const [schedule, setSchedule] = useState<Record<string, { type: string; workoutId?: string; notes?: string }>>(
    DAYS.reduce((acc, day) => ({ ...acc, [day]: { type: 'DESCANSO' } }), {}),
  );

  const authedFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...(options.headers ?? {}), Authorization: `Bearer ${session?.access_token ?? ''}` },
    });
  }, []);

  const fetchExercises = useCallback(async () => {
    try {
      const res = await authedFetch('/api/exercises');
      if (res.ok) setExercises(await res.json());
    } catch {
      /* silencioso */
    }
  }, [authedFetch]);

  const fetchWorkouts = useCallback(async () => {
    if (!studentId) return;
    try {
      const res = await authedFetch(`/api/workouts?studentId=${studentId}`);
      if (res.ok) setStudentWorkouts(await res.json());
    } catch {
      /* silencioso */
    }
  }, [authedFetch, studentId]);

  const fetchSchedule = useCallback(async () => {
    if (!studentId) return;
    try {
      const res = await authedFetch(`/api/students/${studentId}/schedule`);
      if (!res.ok) return;
      const items: { dayOfWeek: string; type: string; workoutId: string | null; notes: string | null }[] =
        await res.json();
      if (Array.isArray(items) && items.length > 0) {
        setSchedule((prev) => {
          const next = { ...prev };
          items.forEach((it) => {
            next[it.dayOfWeek] = { type: it.type, workoutId: it.workoutId ?? '', notes: it.notes ?? '' };
          });
          return next;
        });
      }
    } catch {
      /* silencioso */
    }
  }, [authedFetch, studentId]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    fetchWorkouts();
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchWorkouts, fetchSchedule, reloadKey]);

  const handleAddExercise = (ex: ApiExercise) => {
    setSelectedExercises((prev) => [
      ...prev,
      { exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscleGroup, sets: 4, reps: '10-12' },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: any) => {
    setSelectedExercises((prev) => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  };

  const resetForm = () => {
    setEditingWorkoutId(null);
    setWorkoutName('');
    setWorkoutLabel('A');
    setSelectedExercises([]);
    setError('');
  };

  // Carrega uma ficha existente para edição
  const loadWorkoutForEdit = (w: ApiWorkout) => {
    setEditingWorkoutId(w.id);
    setWorkoutName(w.name);
    setWorkoutLabel(w.label ?? 'A');
    setSelectedExercises(
      w.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.exercise.name,
        muscleGroup: ex.exercise.muscleGroup,
        sets: ex.sets ?? 4,
        reps: ex.reps ?? '10-12',
        loadKg: ex.loadKg ?? undefined,
        restSec: ex.restSec ?? undefined,
        notes: ex.notes ?? undefined,
      })),
    );
    setSuccessMsg('');
    setError('');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cria um novo exercício no catálogo (POST /exercises) e recarrega a lista.
  const createExercise = async () => {
    if (!newExName.trim()) return setError('Dê um nome ao exercício.');
    setAddingExercise(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await authedFetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newExName.trim(),
          muscleGroup: newExMuscle.trim() || null,
          videoUrl: newExVideo.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Erro ao adicionar exercício ao catálogo.');
      setSuccessMsg('Exercício adicionado ao catálogo!');
      setNewExName('');
      setNewExMuscle('');
      setNewExVideo('');
      setShowNewExercise(false);
      await fetchExercises();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingExercise(false);
    }
  };

  const saveWorkout = async () => {
    if (!studentId) return setError('Selecione um aluno primeiro.');
    if (!workoutName) return setError('Dê um nome ao treino.');
    if (selectedExercises.length === 0) return setError('Adicione exercícios ao treino.');

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        name: workoutName,
        label: workoutLabel,
        studentId,
        exercises: selectedExercises.map((e, idx) => ({
          exerciseId: e.exerciseId,
          order: idx + 1,
          sets: e.sets,
          reps: e.reps,
          loadKg: e.loadKg || null,
          restSec: e.restSec || null,
          notes: e.notes || null,
        })),
      };

      const editing = !!editingWorkoutId;
      const res = await authedFetch(editing ? `/api/workouts/${editingWorkoutId}` : '/api/workouts', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erro ao salvar treino');
      setSuccessMsg(editing ? 'Treino atualizado com sucesso!' : 'Treino criado com sucesso!');
      resetForm();
      await fetchWorkouts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (id: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await authedFetch(`/api/workouts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir treino (pode estar em uso na agenda).');
      if (editingWorkoutId === id) resetForm();
      setSuccessMsg('Treino excluído.');
      await fetchWorkouts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const saveSchedule = async () => {
    if (!studentId) return setError('Selecione um aluno primeiro.');
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        items: DAYS.map((day) => ({
          dayOfWeek: day,
          type: schedule[day].type,
          workoutId: schedule[day].workoutId || null,
          notes: schedule[day].notes || null,
        })),
      };
      const res = await authedFetch(`/api/students/${studentId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao salvar agenda');
      setSuccessMsg('Agenda atualizada com sucesso!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!studentId) {
    return (
      <div className="text-center py-10 text-text-sub text-xs">
        Selecione um aluno para prescrever treinos.
      </div>
    );
  }

  const filteredExercises = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.muscleGroup && e.muscleGroup.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-xs">{error}</div>}
      {successMsg && <div className="p-3 bg-green-500/10 text-green-400 rounded-xl text-xs">{successMsg}</div>}

      {/* Fichas já prescritas (editar / excluir) */}
      {studentWorkouts.length > 0 && (
        <div className="bg-bg-card border border-border-custom p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="font-bold text-sm uppercase text-text-sub">Fichas prescritas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {studentWorkouts.map((w) => (
              <div
                key={w.id}
                className="bg-black/25 border rounded-xl p-3 flex items-center justify-between gap-2"
                style={{ borderColor: editingWorkoutId === w.id ? c.primary : 'rgba(255,255,255,0.08)' }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded"
                      style={{ color: c.accent, backgroundColor: c.primary }}
                    >
                      {w.label ?? '—'}
                    </span>
                    <span className="font-bold text-xs text-white truncate">{w.name}</span>
                  </div>
                  <span className="text-[10px] text-text-sub">{w.exercises.length} exercícios</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => loadWorkoutForEdit(w)}
                    title="Editar ficha"
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 cursor-pointer"
                    style={{ color: c.primary }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteWorkout(w.id)}
                    title="Excluir ficha"
                    className="p-1.5 rounded bg-white/5 hover:bg-red-500/15 text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Criar / Editar ficha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border-custom p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase text-text-sub">
              {editingWorkoutId ? 'Editar ficha' : '1. Criar ficha de treino'}
            </h3>
            {editingWorkoutId && (
              <button
                onClick={resetForm}
                className="flex items-center gap-1 text-[11px] text-text-sub hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar edição
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nome do Treino (ex: Peito e Tríceps)"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="flex-1 bg-black/30 border border-border-custom rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            />
            <select
              value={workoutLabel}
              onChange={(e) => setWorkoutLabel(e.target.value)}
              className="bg-black/30 border border-border-custom rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            >
              {['A', 'B', 'C', 'D', 'E'].map((l) => (
                <option key={l} value={l}>
                  Letra {l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {selectedExercises.map((ex, idx) => (
              <div key={idx} className="bg-black/25 p-3 rounded-xl border border-border-custom text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">
                    {idx + 1}. {ex.name}
                  </span>
                  <button onClick={() => handleRemoveExercise(idx)} className="text-red-400 hover:text-red-300 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input type="number" value={ex.sets} onChange={(e) => updateExercise(idx, 'sets', parseInt(e.target.value))} className="w-16 bg-black/30 border border-border-custom rounded px-2 py-1 text-white" placeholder="Séries" title="Séries" />
                  <input type="text" value={ex.reps} onChange={(e) => updateExercise(idx, 'reps', e.target.value)} className="w-20 bg-black/30 border border-border-custom rounded px-2 py-1 text-white" placeholder="Reps" title="Repetições" />
                  <input type="number" value={ex.loadKg ?? ''} onChange={(e) => updateExercise(idx, 'loadKg', e.target.value ? parseFloat(e.target.value) : undefined)} className="w-20 bg-black/30 border border-border-custom rounded px-2 py-1 text-white" placeholder="Carga kg" />
                  <input type="number" value={ex.restSec ?? ''} onChange={(e) => updateExercise(idx, 'restSec', e.target.value ? parseInt(e.target.value) : undefined)} className="w-20 bg-black/30 border border-border-custom rounded px-2 py-1 text-white" placeholder="Desc. (s)" />
                </div>
              </div>
            ))}
            {selectedExercises.length === 0 && <div className="text-text-sub text-xs">Adicione exercícios do catálogo →</div>}
          </div>

          <button
            onClick={saveWorkout}
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: c.primary, color: c.accent }}
          >
            {editingWorkoutId ? 'Salvar alterações' : 'Salvar treino'}
          </button>
        </div>

        {/* Catálogo */}
        <div className="bg-bg-card border border-border-custom p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase text-text-sub">Catálogo</h3>
            <button
              onClick={() => setShowNewExercise((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              style={{ color: c.primary }}
            >
              <Plus className="w-3.5 h-3.5" />
              {showNewExercise ? 'Fechar' : 'Novo exercício'}
            </button>
          </div>

          {showNewExercise && (
            <div className="bg-black/25 border border-border-custom rounded-xl p-3 space-y-2">
              <input
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="Nome do exercício *"
                className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
              />
              <input
                value={newExMuscle}
                onChange={(e) => setNewExMuscle(e.target.value)}
                placeholder="Grupo muscular (ex: Peito)"
                className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
              />
              <input
                value={newExVideo}
                onChange={(e) => setNewExVideo(e.target.value)}
                placeholder="URL do vídeo (opcional)"
                className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
              />
              <button
                onClick={createExercise}
                disabled={addingExercise}
                className="w-full py-2 rounded-lg font-bold text-xs disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: c.primary, color: c.accent }}
              >
                {addingExercise ? 'Adicionando...' : 'Adicionar ao catálogo'}
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-sub" />
            <input
              type="text"
              placeholder="Buscar exercício..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/35 border border-border-custom rounded-xl focus:outline-none text-[11px] text-white"
            />
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredExercises.map((ex) => (
              <div key={ex.id} className="p-2.5 bg-black/20 hover:bg-black/45 border border-border-custom rounded-xl flex items-center justify-between text-xs transition-colors">
                <div>
                  <span className="font-semibold text-white">{ex.name}</span>
                  <span className="text-[10px] text-text-sub block mt-0.5">{ex.muscleGroup || 'Geral'}</span>
                </div>
                <button
                  onClick={() => handleAddExercise(ex)}
                  className="p-1.5 rounded bg-primary/15 hover:bg-primary/25 cursor-pointer transition-colors"
                  style={{ color: c.primary }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agenda da semana */}
      <div className="bg-bg-card border border-border-custom p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm uppercase text-text-sub">2. Montar agenda da semana</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DAYS.map((day) => (
            <div key={day} className="bg-black/25 p-3 rounded-xl border border-border-custom space-y-2">
              <span className="font-bold text-xs text-white">{DAY_LABEL[day]}</span>
              <select
                value={schedule[day].type}
                onChange={(e) => setSchedule({ ...schedule, [day]: { ...schedule[day], type: e.target.value, workoutId: '' } })}
                className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="TREINO">Treino (Ficha)</option>
                <option value="CARDIO">Cardio</option>
                <option value="DESCANSO">Descanso</option>
              </select>

              {schedule[day].type === 'TREINO' && (
                <select
                  value={schedule[day].workoutId || ''}
                  onChange={(e) => setSchedule({ ...schedule, [day]: { ...schedule[day], workoutId: e.target.value } })}
                  className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none mt-1"
                >
                  <option value="">Selecione um Treino...</option>
                  {studentWorkouts.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label} - {w.name}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                placeholder="Observação (opcional)"
                value={schedule[day].notes || ''}
                onChange={(e) => setSchedule({ ...schedule, [day]: { ...schedule[day], notes: e.target.value } })}
                className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none mt-1"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={saveSchedule}
            disabled={loading}
            className="py-2.5 px-6 rounded-xl font-bold text-xs disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: c.primary, color: c.accent }}
          >
            Salvar agenda completa
          </button>
        </div>
      </div>
    </div>
  );
}
