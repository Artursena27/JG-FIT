'use client';

import React, { useState, useEffect } from 'react';
import { useBrand } from '@/context/BrandContext';
import Logo from '@/components/Logo';
import { 
  Dumbbell, 
  TrendingUp, 
  MessageSquare, 
  Home, 
  Calendar, 
  Play, 
  Check, 
  User, 
  Plus, 
  Clock, 
  Flame, 
  LogOut,
  ChevronRight,
  Send,
  Video
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

type ActiveTab = 'home' | 'workout' | 'evolution' | 'chat';

const initialWorkout = [
  { id: 1, name: 'Puxada Alta (Pulldown)', sets: 4, reps: '10-12', currentLoad: 55, prevLoad: 50, video: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-in-a-gym-4848-large.mp4', done: false },
  { id: 2, name: 'Remada Curvada Pronada', sets: 4, reps: '10', currentLoad: 45, prevLoad: 40, video: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-in-a-gym-4848-large.mp4', done: false },
  { id: 3, name: 'Rosca Direta Barra W', sets: 3, reps: '12', currentLoad: 24, prevLoad: 20, video: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-in-a-gym-4848-large.mp4', done: false },
  { id: 4, name: 'Rosca Martelo Halteres', sets: 3, reps: '12', currentLoad: 12, prevLoad: 12, video: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-in-a-gym-4848-large.mp4', done: false },
  { id: 5, name: 'Abdominal Supra na Polia', sets: 4, reps: '15', currentLoad: 35, prevLoad: 30, video: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-in-a-gym-4848-large.mp4', done: false },
];

const mockChatMessages = [
  { id: 1, sender: 'teacher', text: 'Fala, João! Vi seu feedback do último treino. Como sentiu o ombro na elevação lateral?', time: 'Ontem' },
  { id: 2, sender: 'student', text: 'E aí, mestre! Sentiu um pouco no começo, mas depois que aqueci bem melhorou. Mantive a carga de 10kg.', time: 'Ontem' },
  { id: 3, sender: 'teacher', text: 'Boa! Próximo treino vamos focar mais no aquecimento do manguito. Hoje é dia de costas e bíceps, foca na amplitude!', time: '09:30' }
];

export default function AlunoDashboard() {
  const { brand } = useBrand();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState(2); // Quarta (index 2)
  const [workout, setWorkout] = useState(initialWorkout);
  const [timerSec, setTimerSec] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');
  
  // Hold-to-finish checkin states
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  // Video modal states
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Timer runner
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Hold-to-complete logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHolding && holdProgress < 100) {
      interval = setInterval(() => {
        setHoldProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setWorkoutCompleted(true);
            setIsHolding(false);
            return 100;
          }
          return p + 5;
        });
      }, 50);
    } else if (!isHolding && holdProgress > 0) {
      setHoldProgress(0);
    }
    return () => clearInterval(interval);
  }, [isHolding, holdProgress]);

  const handleToggleDone = (id: number) => {
    setWorkout(workout.map(ex => ex.id === id ? { ...ex, done: !ex.done } : ex));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = {
      id: messages.length + 1,
      sender: 'student',
      text: newMessage,
      time: 'Agora'
    };
    setMessages([...messages, msg]);
    setNewMessage('');

    // Mock teacher auto-reply
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'teacher',
          text: 'Show! Continue registrando as cargas que estou acompanhando tudo por aqui.',
          time: 'Agora'
        }
      ]);
    }, 1500);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Evolution data
  const weightData = [
    { name: 'Jan', peso: 75.2 },
    { name: 'Fev', peso: 74.8 },
    { name: 'Mar', peso: 74.3 },
    { name: 'Abr', peso: 73.9 },
    { name: 'Mai', peso: 73.5 },
    { name: 'Jun', peso: 72.8 },
  ];

  const weekSchedule = [
    { day: 'Seg', type: 'Treino A', title: 'Peito e Ombros', status: 'Concluído' },
    { day: 'Ter', type: 'Cardio', title: 'Corrida 30 min', status: 'Concluído' },
    { day: 'Qua', type: 'Treino B', title: 'Costas e Bíceps', status: 'Hoje' },
    { day: 'Qui', type: 'Descanso', title: 'Recuperação', status: 'Pendente' },
    { day: 'Sex', type: 'Treino C', title: 'Pernas', status: 'Pendente' },
    { day: 'Sáb', type: 'Cardio', title: 'Funcional', status: 'Pendente' },
    { day: 'Dom', type: 'Descanso', title: 'Recuperação', status: 'Pendente' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-main text-text-main pb-20 select-none">
      {/* Real Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] select-none pointer-events-none z-0">
        <img src="/logo.jpg" alt="Logo Watermark" className="w-[50vmin] h-[50vmin] object-contain" />
      </div>

      {/* Header */}
      <header className="sticky top-0 bg-bg-card/85 backdrop-blur-md border-b border-border-custom px-5 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center transition-all duration-300">
            <img src="/logo.jpg" alt="Logo" className="w-9 h-9 object-contain rounded-lg border border-border-custom" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight uppercase leading-none">{brand.name}</h2>
            <span className="text-[10px] text-text-sub font-semibold tracking-wide mt-1 block">ÁREA DO ALUNO</span>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = '/login'}
          className="p-2 hover:bg-white/5 rounded-lg text-text-sub hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-5 relative z-10">
        
        {/* Tab 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-5 animate-fade-in">
            {/* Student Welcoming Info */}
            <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                <Flame className="w-36 h-36" style={{ color: brand.colors.primary }} />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold text-lg">
                  JS
                </div>
                <div>
                  <h3 className="text-lg font-bold">Olá, João Silva 👋</h3>
                  <p className="text-xs text-text-sub mt-0.5">Seu objetivo: <span className="font-semibold text-white">Hipertrofia</span></p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border-custom text-center">
                <div>
                  <span className="text-xs text-text-sub block">Peso Atual</span>
                  <span className="text-lg font-extrabold text-white mt-1 block">72.8 kg</span>
                </div>
                <div>
                  <span className="text-xs text-text-sub block">Assiduidade</span>
                  <span className="text-lg font-extrabold text-white mt-1 block" style={{ color: brand.colors.primary }}>94%</span>
                </div>
                <div>
                  <span className="text-xs text-text-sub block">Frequência</span>
                  <span className="text-lg font-extrabold text-white mt-1 block">5x / sem</span>
                </div>
              </div>
            </div>

            {/* Week Panel */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold tracking-wider text-text-sub uppercase">Cronograma da Semana</h4>
              <div className="grid grid-cols-7 gap-1.5">
                {weekSchedule.map((item, idx) => {
                  const isToday = item.status === 'Hoje';
                  const isDone = item.status === 'Concluído';
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDay(idx);
                        if (item.type.startsWith('Treino')) {
                          setActiveTab('workout');
                        }
                      }}
                      className={`flex flex-col items-center py-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                        isToday 
                          ? 'border-primary bg-primary/5 text-white scale-102' 
                          : isDone 
                            ? 'border-border-custom bg-black/20 text-text-sub' 
                            : 'border-border-custom bg-black/40 text-text-sub/70 hover:border-white/10'
                      }`}
                      style={isToday ? { borderColor: brand.colors.primary, boxShadow: `0 0 12px ${brand.colors.primary}18` } : {}}
                    >
                      <span className="text-[10px] font-semibold tracking-wider uppercase opacity-75">{item.day}</span>
                      <Dumbbell 
                        className="w-4 h-4 my-2" 
                        style={{ 
                          color: isToday ? brand.colors.primary : isDone ? brand.colors.primary + '77' : 'currentColor' 
                        }} 
                      />
                      {isDone ? (
                        <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-green-500/10 text-green-400 border border-green-500/20 text-[8px] font-bold">
                          ✓
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold">{item.type.replace('Treino ', '')}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day preview */}
            <div className="bg-bg-card border border-border-custom rounded-2xl p-5 flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub" style={{ color: brand.colors.primary }}>
                  {weekSchedule[selectedDay].status === 'Hoje' ? 'Hoje' : 'Dia selecionado'}
                </span>
                <h4 className="font-bold text-base text-white">{weekSchedule[selectedDay].type}</h4>
                <p className="text-xs text-text-sub">{weekSchedule[selectedDay].title}</p>
              </div>
              {weekSchedule[selectedDay].type.startsWith('Treino') && (
                <button
                  onClick={() => setActiveTab('workout')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer"
                  style={{ backgroundColor: brand.colors.primary, color: brand.colors.accent }}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Iniciar Ficha
                </button>
              )}
            </div>

            {/* hydration and tips card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-card border border-border-custom rounded-2xl p-4 flex flex-col justify-between shadow-md">
                <span className="text-xs font-bold text-text-sub uppercase">Meta de Água</span>
                <div className="my-4 text-center">
                  <span className="text-3xl font-black block">1.8 <span className="text-sm font-normal text-text-sub">/ 3L</span></span>
                </div>
                <button 
                  className="w-full py-1.5 rounded-lg border border-border-custom hover:border-white/10 bg-black/20 text-[11px] font-bold transition-colors cursor-pointer"
                  onClick={() => {}}
                >
                  + Adicionar 250ml
                </button>
              </div>

              <div className="bg-bg-card border border-border-custom rounded-2xl p-4 flex flex-col justify-between shadow-md">
                <span className="text-xs font-bold text-text-sub uppercase">Dica do Personal</span>
                <p className="my-2 text-[11px] text-text-sub leading-relaxed">
                  "No treino de hoje, foque na descida (fase excêntrica) bem controlada. Isso otimiza o recrutamento de fibras!"
                </p>
                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider justify-end" style={{ color: brand.colors.primary }}>
                  <img src="/personal-photo.jpg" alt="João Guilherme" className="w-4 h-4 rounded-full object-cover border border-primary/20" />
                  <span>— {brand.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: WORKOUT */}
        {activeTab === 'workout' && (
          <div className="space-y-5 animate-fade-in">
            {/* Workout Tracker & Stats */}
            <div className="bg-bg-card border border-border-custom rounded-2xl p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary" style={{ color: brand.colors.primary }}>
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Treino B — Costas e Bíceps</h3>
                  <p className="text-[11px] text-text-sub mt-0.5">5 Exercícios · Foco em Puxar</p>
                </div>
              </div>

              {/* Workout Timer */}
              <div className="flex items-center gap-2 border border-border-custom px-3 py-1.5 rounded-xl bg-black/30">
                <Clock className="w-4 h-4 text-text-sub" />
                <span className="text-xs font-mono font-bold">{formatTime(timerSec)}</span>
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="text-[10px] font-semibold uppercase tracking-wider ml-1 cursor-pointer hover:underline"
                  style={{ color: brand.colors.primary }}
                >
                  {isTimerRunning ? 'Pausar' : 'Iniciar'}
                </button>
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
              {workout.map((ex) => (
                <div 
                  key={ex.id}
                  className={`bg-bg-card border rounded-2xl p-4 transition-all duration-300 flex flex-col gap-3.5 shadow-sm ${
                    ex.done ? 'border-primary/20 bg-primary/2' : 'border-border-custom'
                  }`}
                  style={ex.done ? { borderColor: brand.colors.primary + '22' } : {}}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => handleToggleDone(ex.id)}
                        className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer mt-0.5 transition-colors ${
                          ex.done 
                            ? 'bg-primary border-primary text-accent' 
                            : 'border-border-custom bg-black/40 hover:border-text-sub/50'
                        }`}
                        style={ex.done ? { backgroundColor: brand.colors.primary, borderColor: brand.colors.primary, color: brand.colors.accent } : {}}
                      >
                        {ex.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <div>
                        <h4 className={`font-bold text-sm ${ex.done ? 'text-text-sub line-through' : 'text-white'}`}>
                          {ex.name}
                        </h4>
                        <span className="text-xs text-text-sub mt-0.5 block">
                          {ex.sets} séries × {ex.reps} reps
                        </span>
                      </div>
                    </div>

                    {/* Demonstration Video Trigger */}
                    <button 
                      onClick={() => setActiveVideo(ex.video)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-custom bg-black/20 text-[10px] font-semibold text-text-sub hover:text-white hover:border-white/10 transition-colors cursor-pointer"
                    >
                      <Video className="w-3 h-3" />
                      Vídeo
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-custom text-xs">
                    <div className="bg-black/20 p-2.5 rounded-xl border border-border-custom flex items-center justify-between">
                      <span className="text-text-sub">Anterior:</span>
                      <span className="font-extrabold text-white">{ex.prevLoad} kg</span>
                    </div>
                    <div className="bg-black/35 p-2.5 rounded-xl border border-border-custom flex items-center justify-between">
                      <span className="text-text-sub">Atual:</span>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="number"
                          value={ex.currentLoad}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setWorkout(workout.map(item => item.id === ex.id ? { ...item, currentLoad: val } : item));
                          }}
                          className="w-12 bg-transparent text-right font-black focus:outline-none focus:text-primary text-white"
                          style={{ color: ex.done ? brand.colors.textSecondary : 'inherit' }}
                        />
                        <span className="text-text-sub font-semibold">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Hold to Complete Workout */}
            {!workoutCompleted ? (
              <button 
                onMouseDown={() => { setIsTimerRunning(false); setIsHolding(true); }}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={() => { setIsTimerRunning(false); setIsHolding(true); }}
                onTouchEnd={() => setIsHolding(false)}
                className="w-full relative overflow-hidden py-4 px-6 rounded-2xl font-black text-center transition-all duration-300 transform active:scale-98 cursor-pointer select-none text-sm bg-black/40 border border-border-custom shadow-lg"
              >
                {/* Visual loading bar inside the button */}
                <div 
                  className="absolute inset-y-0 left-0 transition-all duration-75 pointer-events-none"
                  style={{ 
                    width: `${holdProgress}%`, 
                    backgroundColor: brand.colors.primary, 
                    opacity: 0.15 
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2" style={{ color: isHolding ? '#fff' : brand.colors.primary }}>
                  {isHolding ? 'Segure para concluir...' : 'Segure para Concluir Treino'}
                </span>
              </button>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-5 rounded-2xl text-center space-y-2 animate-bounce">
                <Check className="w-8 h-8 mx-auto" />
                <h4 className="font-extrabold text-sm">Treino Concluído com Sucesso!</h4>
                <p className="text-xs text-text-sub">Muito bom! Os dados de cargas e tempo foram salvos e enviados ao seu Personal.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: EVOLUTION */}
        {activeTab === 'evolution' && (
          <div className="space-y-5 animate-fade-in">
            {/* Weight Chart (Recharts) */}
            <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-md">
              <span className="text-xs font-bold text-text-sub uppercase tracking-wider block mb-4">Evolução do Peso</span>
              <div className="h-48 w-full text-xs">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#182235" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0c111e', 
                          borderColor: '#182235',
                          borderRadius: '12px',
                          color: '#fff'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="peso" 
                        stroke={brand.colors.primary} 
                        strokeWidth={3} 
                        dot={{ fill: brand.colors.primary, r: 5 }} 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Circumferences Table */}
            <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-md">
              <span className="text-xs font-bold text-text-sub uppercase tracking-wider block mb-4">Medidas Corporais</span>
              
              <div className="space-y-2.5">
                {[
                  { label: 'Tórax (Peitoral)', val: 98, prev: 96, unit: 'cm' },
                  { label: 'Braço Direito', val: 36.5, prev: 35.8, unit: 'cm' },
                  { label: 'Braço Esquerdo', val: 36.2, prev: 35.5, unit: 'cm' },
                  { label: 'Cintura (Abdômen)', val: 82, prev: 84, unit: 'cm' },
                  { label: 'Quadril', val: 94, prev: 95, unit: 'cm' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border-custom last:border-b-0 text-sm">
                    <span className="text-text-sub">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-sub/50">Antes: {item.prev}{item.unit}</span>
                      <span className="font-extrabold text-white">{item.val}{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evolution Photos (Before / After) */}
            <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-text-sub uppercase tracking-wider">Fotos de Progresso</span>
                <button 
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-custom bg-black/25 text-[10px] font-bold text-white hover:border-white/15 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Enviar Foto
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 relative overflow-hidden">
                <div className="relative aspect-[3/4] bg-slate-900 border border-border-custom rounded-xl overflow-hidden flex flex-col justify-end p-2.5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)] flex items-center justify-center">
                    <User className="w-16 h-16 text-text-sub opacity-20" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-center">
                    <span className="text-[10px] font-black text-white/90 uppercase tracking-widest bg-black/40 px-2 py-1 rounded border border-white/5">ANTERIOR</span>
                  </div>
                </div>

                <div className="relative aspect-[3/4] bg-slate-900 border border-border-custom rounded-xl overflow-hidden flex flex-col justify-end p-2.5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_0%,transparent_100%)] flex items-center justify-center">
                    <User className="w-16 h-16 text-primary opacity-30" style={{ color: brand.colors.primary }} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-primary/20 border border-primary/20" style={{ color: brand.colors.primary }}>ATUAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: CHAT */}
        {activeTab === 'chat' && (
          <div className="bg-bg-card border border-border-custom rounded-2xl h-[500px] flex flex-col overflow-hidden shadow-md animate-fade-in">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-border-custom bg-black/20 flex items-center gap-3">
              <img src="/personal-photo.jpg" alt="João Guilherme" className="w-8 h-8 rounded-full object-cover border border-primary/20" />
              <div>
                <h4 className="font-bold text-xs text-white">Treinador {brand.name.split(' ')[0]}</h4>
                <span className="text-[9px] text-green-400 font-semibold block mt-0.5">Online</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {messages.map((msg) => {
                const isMe = msg.sender === 'student';
                return (
                  <div 
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                        isMe 
                          ? 'text-accent' 
                          : 'bg-black/35 text-text-main border border-border-custom'
                      }`}
                      style={isMe ? { backgroundColor: brand.colors.primary, color: brand.colors.accent } : {}}
                    >
                      <p>{msg.text}</p>
                      <span 
                        className={`text-[8px] text-right mt-1.5 block opacity-60`}
                        style={{ color: isMe ? brand.colors.accent : brand.colors.textSecondary }}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border-custom bg-black/10 flex gap-2">
              <input 
                type="text" 
                placeholder="Digite sua mensagem para o Personal..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-black/30 border border-border-custom rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text-main placeholder-text-sub/50"
              />
              <button 
                type="submit"
                className="p-2.5 rounded-xl shrink-0 transition-transform active:scale-95 cursor-pointer shadow-md"
                style={{ backgroundColor: brand.colors.primary, color: brand.colors.accent }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Expandable video modal */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-bg-card border border-border-custom rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl relative">
            <div className="p-3 border-b border-border-custom flex justify-between items-center bg-black/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub">Demonstração de Exercício</span>
              <button 
                onClick={() => setActiveVideo(null)}
                className="text-xs text-text-sub hover:text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
            
            {/* Standard HTML5 Video Mock */}
            <div className="aspect-video bg-black flex flex-col items-center justify-center text-text-sub p-6 text-center">
              <Play className="w-12 h-12 text-primary opacity-50 mb-3" style={{ color: brand.colors.primary }} />
              <p className="text-xs font-semibold">Carregando vídeo demonstrativo...</p>
              <p className="text-[10px] opacity-60 mt-1">Simulação de vídeo demonstrativo de execução correta.</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Menu */}
      <nav className="fixed bottom-0 inset-x-0 bg-bg-card/90 backdrop-blur-md border-t border-border-custom py-2 flex justify-around items-center z-40">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-primary font-bold' : 'text-text-sub hover:text-white'
          }`}
          style={activeTab === 'home' ? { color: brand.colors.primary } : {}}
        >
          <Home className="w-4.5 h-4.5" />
          <span className="text-[9px] tracking-wide">Início</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('workout')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'workout' ? 'text-primary font-bold' : 'text-text-sub hover:text-white'
          }`}
          style={activeTab === 'workout' ? { color: brand.colors.primary } : {}}
        >
          <Dumbbell className="w-4.5 h-4.5" />
          <span className="text-[9px] tracking-wide">Treino</span>
        </button>

        <button 
          onClick={() => setActiveTab('evolution')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'evolution' ? 'text-primary font-bold' : 'text-text-sub hover:text-white'
          }`}
          style={activeTab === 'evolution' ? { color: brand.colors.primary } : {}}
        >
          <TrendingUp className="w-4.5 h-4.5" />
          <span className="text-[9px] tracking-wide">Evolução</span>
        </button>

        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'chat' ? 'text-primary font-bold' : 'text-text-sub hover:text-white'
          }`}
          style={activeTab === 'chat' ? { color: brand.colors.primary } : {}}
        >
          <MessageSquare className="w-4.5 h-4.5" />
          <span className="text-[9px] tracking-wide">Chat</span>
        </button>
      </nav>
    </div>
  );
}
