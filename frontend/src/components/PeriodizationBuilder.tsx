'use client';

import React, { useState, useEffect } from 'react';
import { supabase, API_URL } from '@/lib/supabaseClient';
import { useBrand } from '@/context/BrandContext';
import { Search, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

interface ApiExercise {
  id: string;
  name: string;
  muscleGroup: string | null;
}

interface WorkoutExercise {
  exerciseId: string;
  name: string;
  muscleGroup: string | null;
  sets: number;
  reps: string;
  loadKg?: number;
  restSec?: number;
  notes?: string;
}

interface PeriodizationBuilderProps {
  studentId: string | undefined;
}

export default function PeriodizationBuilder({ studentId }: PeriodizationBuilderProps) {
  const { brand } = useBrand();
  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  // Workout state
  const [workoutName, setWorkoutName] = useState('');
  const [workoutLabel, setWorkoutLabel] = useState('A');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  
  // Existing workouts for schedule
  const [studentWorkouts, setStudentWorkouts] = useState<{id: string, name: string, label: string}[]>([]);

  // Schedule state
  const daysOfWeek = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
  const [schedule, setSchedule] = useState<Record<string, { type: string, workoutId?: string, notes?: string }>>(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: { type: 'DESCANSO' } }), {})
  );

  const fetchExercises = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/exercises`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) setExercises(await res.json());
    } catch (err) {}
  };

  const fetchWorkouts = async () => {
    if (!studentId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/workouts?studentId=${studentId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) setStudentWorkouts(await res.json());
    } catch (err) {}
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [studentId]);

  const handleAddExercise = (ex: ApiExercise) => {
    setSelectedExercises([...selectedExercises, {
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: 4,
      reps: '10-12'
    }]);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = [...selectedExercises];
    (updated[index] as any)[field] = value;
    setSelectedExercises(updated);
  };

  const saveWorkout = async () => {
    if (!studentId) return setError('Selecione um aluno primeiro.');
    if (!workoutName) return setError('Dê um nome ao treino.');
    if (selectedExercises.length === 0) return setError('Adicione exercícios ao treino.');
    
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
          notes: e.notes || null
        }))
      };

      const res = await fetch(`${API_URL}/api/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Erro ao salvar treino');
      setSuccessMsg('Treino salvo com sucesso!');
      setWorkoutName('');
      setSelectedExercises([]);
      await fetchWorkouts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    if (!studentId) return setError('Selecione um aluno primeiro.');
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const payload = {
        items: daysOfWeek.map(day => ({
          dayOfWeek: day,
          type: schedule[day].type,
          workoutId: schedule[day].workoutId || null,
          notes: schedule[day].notes || null
        }))
      };

      const res = await fetch(`${API_URL}/api/students/${studentId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
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
    return <div className="text-center py-10 text-text-sub text-xs">Vá para a aba Alunos e selecione um aluno para prescrever treinos.</div>;
  }

  const filteredExercises = exercises.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    (e.muscleGroup && e.muscleGroup.toLowerCase().includes(search.toLowerCase()))
  );

  const displayDays: Record<string, string> = {
    SEGUNDA: 'Segunda', TERCA: 'Terça', QUARTA: 'Quarta', QUINTA: 'Quinta', SEXTA: 'Sexta', SABADO: 'Sábado', DOMINGO: 'Domingo'
  };

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-xs">{error}</div>}
      {successMsg && <div className="p-3 bg-green-500/10 text-green-400 rounded-xl text-xs">{successMsg}</div>}
      
      {/* Criador de Treino */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border-custom p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm uppercase text-text-sub">1. Criar Ficha de Treino</h3>
          
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Nome do Treino (ex: Peito e Tríceps)"
              value={workoutName}
              onChange={e => setWorkoutName(e.target.value)}
              className="flex-1 bg-black/30 border border-border-custom rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            />
            <select
              value={workoutLabel}
              onChange={e => setWorkoutLabel(e.target.value)}
              className="bg-black/30 border border-border-custom rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="A">Letra A</option>
              <option value="B">Letra B</option>
              <option value="C">Letra C</option>
              <option value="D">Letra D</option>
              <option value="E">Letra E</option>
            </select>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedExercises.map((ex, idx) => (
              <div key={idx} className="bg-black/25 p-3 rounded-xl border border-border-custom text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{idx + 1}. {ex.name}</span>
                  <button onClick={() => handleRemoveExercise(idx)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input type="number" value={ex.sets} onChange={e => updateExercise(idx, 'sets', parseInt(e.target.value))} className="w-16 bg-black/30 border border-border-custom rounded px-2 py-1 text-white" placeholder="Séries" title="Séries" />
                  <input type="text" value={ex.reps} onChange={e => updateExercise(idx, 'reps', e.target.value)} className="w-20 bg-black/30 border border-border-custom rounded px-2 py-1 text-white" placeholder="Reps" title="Repetições" />
                  <input type="number" value={ex.loadKg || ''} onChange={e => updateExercise(idx, 'loadKg', parseFloat(e.target.value))} className="w-20 bg-black/30 border border-border-custom rounded px-2 py-1 text-white" placeholder="Carga kg" />
                  <input type="number" value={ex.restSec || ''} onChange={e => updateExercise(idx, 'restSec', parseInt(e.target.value))} className="w-20 bg-black/30 border border-border-custom rounded px-2 py-1 text-white" placeholder="Desc. (s)" />
                </div>
              </div>
            ))}
            {selectedExercises.length === 0 && <div className="text-text-sub text-xs">Adicione exercícios do catálogo.</div>}
          </div>

          <button 
            onClick={saveWorkout}
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: brand.colors.primary, color: brand.colors.accent }}
          >
            Salvar Treino
          </button>
        </div>

        {/* Catálogo de Exercícios */}
        <div className="bg-bg-card border border-border-custom p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm uppercase text-text-sub">Catálogo</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-sub" />
            <input 
              type="text" 
              placeholder="Buscar exercício..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/35 border border-border-custom rounded-xl focus:outline-none text-[11px] text-white"
            />
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredExercises.map(ex => (
              <div key={ex.id} className="p-2.5 bg-black/20 hover:bg-black/45 border border-border-custom rounded-xl flex items-center justify-between text-xs transition-colors">
                <div>
                  <span className="font-semibold text-white">{ex.name}</span>
                  <span className="text-[10px] text-text-sub block mt-0.5">{ex.muscleGroup || 'Geral'}</span>
                </div>
                <button 
                  onClick={() => handleAddExercise(ex)}
                  className="p-1.5 rounded bg-primary/15 hover:bg-primary/25 cursor-pointer transition-colors"
                  style={{ color: brand.colors.primary }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agenda da Semana */}
      <div className="bg-bg-card border border-border-custom p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm uppercase text-text-sub">2. Montar Agenda da Semana</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {daysOfWeek.map(day => (
            <div key={day} className="bg-black/25 p-3 rounded-xl border border-border-custom space-y-2">
              <span className="font-bold text-xs text-white">{displayDays[day]}</span>
              <select 
                value={schedule[day].type}
                onChange={e => setSchedule({ ...schedule, [day]: { ...schedule[day], type: e.target.value, workoutId: '' } })}
                className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="TREINO">Treino (Ficha)</option>
                <option value="CARDIO">Cardio</option>
                <option value="DESCANSO">Descanso</option>
              </select>

              {schedule[day].type === 'TREINO' && (
                <select 
                  value={schedule[day].workoutId || ''}
                  onChange={e => setSchedule({ ...schedule, [day]: { ...schedule[day], workoutId: e.target.value } })}
                  className="w-full bg-black/30 border border-border-custom rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none mt-1"
                >
                  <option value="">Selecione um Treino...</option>
                  {studentWorkouts.map(w => (
                    <option key={w.id} value={w.id}>{w.label} - {w.name}</option>
                  ))}
                </select>
              )}

              <input 
                type="text"
                placeholder="Observação (opcional)"
                value={schedule[day].notes || ''}
                onChange={e => setSchedule({ ...schedule, [day]: { ...schedule[day], notes: e.target.value } })}
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
            style={{ backgroundColor: brand.colors.primary, color: brand.colors.accent }}
          >
            Salvar Agenda Completa
          </button>
        </div>
      </div>
    </div>
  );
}
