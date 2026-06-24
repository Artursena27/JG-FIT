'use client';

import React, { useState, useEffect } from 'react';
import { useBrand } from '@/context/BrandContext';
import Logo from '@/components/Logo';
import { supabase, API_URL } from '@/lib/supabaseClient';
import PeriodizationBuilder from '@/components/PeriodizationBuilder';
import PersonasPanel from '@/components/PersonasPanel';
import StudentDetail from '@/components/StudentDetail';

import { 
  Users, 
  Dumbbell, 
  Calendar, 
  MessageSquare, 
  Search, 
  UserPlus, 
  Cpu, 
  Flame, 
  Plus, 
  Check, 
  AlertCircle,
  FileText,
  Send,
  Sparkles,
  ArrowRight,
  TrendingUp,
  LogOut,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

type ActiveTab = 'dashboard' | 'students' | 'periodization' | 'chat';

interface Student {
  id: number;
  name: string;
  age: number;
  sex: 'M' | 'F';
  weight: number;
  height: number;
  goal: string;
  frequency: number;
  attendance: number;
  status: 'Ativo' | 'Pendente';
  lastWorkout: string;
}

const initialStudents: Student[] = [
  { id: 1, name: 'João Silva', age: 23, sex: 'M', weight: 72.8, height: 1.76, goal: 'Hipertrofia', frequency: 5, attendance: 94, status: 'Ativo', lastWorkout: 'Treino B (Costas) - Hoje' },
  { id: 2, name: 'Pedro Ramos', age: 18, sex: 'M', weight: 72, height: 1.78, goal: 'Hipertrofia', frequency: 5, attendance: 90, status: 'Ativo', lastWorkout: 'Treino A (Peito) - Ontem' },
  { id: 3, name: 'Gabriel Santos', age: 20, sex: 'M', weight: 68, height: 1.74, goal: 'Hipertrofia', frequency: 4, attendance: 85, status: 'Ativo', lastWorkout: 'Treino C (Ombros) - 2 dias atrás' },
  { id: 4, name: 'Matheus Costa', age: 22, sex: 'M', weight: 75, height: 1.82, goal: 'Hipertrofia', frequency: 5, attendance: 88, status: 'Ativo', lastWorkout: 'Cardio - 3 dias atrás' },
  { id: 5, name: 'Lucas Pinho', age: 25, sex: 'M', weight: 88, height: 1.85, goal: 'Emagrecimento', frequency: 4, attendance: 92, status: 'Ativo', lastWorkout: 'Treino B (Costas) - Hoje' },
];

// ---- Dados REAIS vindos do backend (aba Alunos) ----
type ApiStatus = 'PENDING' | 'APPROVED' | 'ONBOARDED' | 'REJECTED';

interface ApiStudent {
  id: string;
  name: string;
  status: ApiStatus;
  birthdate: string | null;
  sex: 'MASCULINO' | 'FEMININO' | 'OUTRO' | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  weeklyFrequency: number | null;
  createdAt: string;
}

const STATUS_LABEL: Record<ApiStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aguardando onboarding',
  ONBOARDED: 'Ativo',
  REJECTED: 'Rejeitado',
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

/** Resumo "23 anos · Hipertrofia" tolerante a campos faltando. */
function studentSummary(s: ApiStudent): string {
  const age = ageFrom(s.birthdate);
  const parts: string[] = [];
  if (age !== null) parts.push(`${age} anos`);
  if (s.goal) parts.push(titleCase(s.goal));
  return parts.length ? parts.join(' · ') : 'Perfil ainda não preenchido';
}

export default function ProfessorDashboard() {
  const { brand } = useBrand();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMounted, setIsMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ---- Dados reais de alunos (aba Alunos) ----
  const [activeStudents, setActiveStudents] = useState<ApiStudent[]>([]);
  const [pendingStudents, setPendingStudents] = useState<ApiStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  // Selected student details view
  const [selectedStudent, setSelectedStudent] = useState<ApiStudent | null>(null);
  // Aluno aberto em tela cheia (detalhe completo)
  const [detailStudent, setDetailStudent] = useState<ApiStudent | null>(null);
  
  // "New Student" modal/form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAge, setNewStudentAge] = useState('');
  const [newStudentSex, setNewStudentSex] = useState<'M' | 'F'>('M');
  const [newStudentWeight, setNewStudentWeight] = useState('');
  const [newStudentHeight, setNewStudentHeight] = useState('');
  const [newStudentGoal, setNewStudentGoal] = useState('Hipertrofia');
  const [newStudentFreq, setNewStudentFreq] = useState('5');
  
  // Live Persona Engine output (movido para PersonasPanel)

  // Periodization Editor State
  const [selectedWorkoutTemplate, setSelectedWorkoutTemplate] = useState('ABCDE Standard');
  const [periodizationSuccess, setPeriodizationSuccess] = useState(false);

  // Chat State
  const [selectedChatStudent, setSelectedChatStudent] = useState<ApiStudent | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});
  const [chatInput, setChatInput] = useState('');

  // Fetch chat for selected student
  useEffect(() => {
    if (!selectedChatStudent) return;
    const fetchChat = async () => {
      try {
        const res = await authedFetch(`/api/chat/${selectedChatStudent.id}`);
        if (res.ok) {
          const msgs = await res.json();
          setChatMessages(prev => ({ ...prev, [selectedChatStudent.id]: msgs }));
        }
      } catch (e) {
        console.error('Failed to fetch chat', e);
      }
    };
    fetchChat();
  }, [selectedChatStudent]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Chamada autenticada ao backend (injeta o JWT do Supabase).
  const authedFetch = async (path: string, options: RequestInit = {}) => {
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
  };

  // Carrega alunos ativos + fila de pendentes do backend.
  const loadStudents = async () => {
    setLoadingStudents(true);
    setStudentsError('');
    try {
      const [activeRes, pendingRes] = await Promise.all([
        authedFetch('/api/professor/students'),
        authedFetch('/api/professor/students/pending'),
      ]);
      if (!activeRes.ok || !pendingRes.ok) throw new Error('request failed');
      setActiveStudents(await activeRes.json());
      setPendingStudents(await pendingRes.json());
    } catch {
      setStudentsError('Não foi possível carregar os alunos. Tente novamente.');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aprova / rejeita um aluno da fila e recarrega as listas.
  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    setActingId(id);
    try {
      const res = await authedFetch(`/api/professor/students/${id}/${action}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('request failed');
      if (selectedStudent?.id === id) setSelectedStudent(null);
      await loadStudents();
    } catch {
      setStudentsError('Não foi possível concluir a ação. Tente novamente.');
    } finally {
      setActingId(null);
    }
  };

  // A lógica de cálculo de personas foi movida para PersonasPanel

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentAge || !newStudentWeight || !newStudentHeight) return;

    const newStudent: Student = {
      id: students.length + 1,
      name: newStudentName,
      age: parseInt(newStudentAge),
      sex: newStudentSex,
      weight: parseFloat(newStudentWeight),
      height: parseFloat(newStudentHeight),
      goal: newStudentGoal,
      frequency: parseInt(newStudentFreq),
      attendance: 100,
      status: 'Ativo',
      lastWorkout: 'Sem treinos registrados'
    };

    setStudents([newStudent, ...students]);
    
    // Clear form
    setNewStudentName('');
    setNewStudentAge('');
    setNewStudentWeight('');
    setNewStudentHeight('');
    setShowAddForm(false);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedChatStudent) return;

    const studentId = selectedChatStudent.id;
    const currentMsgs = chatMessages[studentId] || [];
    
    const newMsg = {
      id: Date.now(),
      sender: 'teacher',
      text: chatInput,
      time: 'Agora'
    };

    setChatMessages({
      ...chatMessages,
      [studentId]: [...currentMsgs, newMsg]
    });
    
    const msgText = chatInput;
    setChatInput('');

    try {
      await authedFetch(`/api/chat/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msgText })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics Chart Mock
  const attendanceData = [
    { name: 'Seg', presenca: 88 },
    { name: 'Ter', presenca: 92 },
    { name: 'Qua', presenca: 94 },
    { name: 'Qui', presenca: 85 },
    { name: 'Sex', presenca: 79 },
    { name: 'Sáb', presenca: 64 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-main text-text-main pb-10 select-none">
      
      {/* Top Navbar */}
      <header className="sticky top-0 bg-bg-card/90 backdrop-blur-md border-b border-border-custom px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center transition-all duration-300">
            <img src="/logo.jpg" alt="Logo" className="w-9 h-9 object-contain rounded-lg border border-border-custom" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight uppercase leading-none">{brand.name}</h1>
            <span className="text-[10px] text-text-sub font-semibold tracking-widest mt-1 block">PAINEL DO PROFESSOR</span>
          </div>
        </div>

        {/* Top Navigation Options */}
        <div className="hidden md:flex items-center gap-5">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'students', label: 'Alunos', icon: Users },
            { id: 'periodization', label: 'Periodização', icon: Calendar },
            { id: 'chat', label: 'Chat', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className="flex items-center gap-2 text-sm font-semibold transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5 cursor-pointer"
                style={activeTab === tab.id ? { color: brand.colors.primary } : { color: brand.colors.textSecondary }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="flex items-center gap-2 px-3 py-1.5 border border-border-custom rounded-xl hover:bg-red-500/10 hover:border-red-500/20 text-text-sub hover:text-red-400 text-xs font-bold transition-all cursor-pointer"
        >
          <img src="/personal-photo.jpg" alt="João Guilherme" className="w-5 h-5 rounded-full object-cover border border-white/10" />
          Sair
        </button>
      </header>

      {/* Main Grid container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-6">
        
        {/* Tab 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-text-sub uppercase font-bold tracking-wider">Alunos Ativos</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black">{activeStudents.length}</span>
                  {pendingStudents.length > 0 && (
                    <button
                      onClick={() => setActiveTab('students')}
                      className="text-[10px] text-amber-400 font-bold flex items-center cursor-pointer hover:underline"
                    >
                      {pendingStudents.length} na fila
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-text-sub uppercase font-bold tracking-wider">Média Assiduidade</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black">90.2%</span>
                  <span className="text-[10px] text-primary font-bold" style={{ color: brand.colors.primary }}>Meta &gt; 85%</span>
                </div>
              </div>

              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-text-sub uppercase font-bold tracking-wider">Feedbacks Pendentes</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-amber-400">2</span>
                  <span className="text-[10px] text-text-sub">Treinos de hoje</span>
                </div>
              </div>

              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-text-sub uppercase font-bold tracking-wider">Alunos Inativos</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-red-400">0</span>
                  <span className="text-[10px] text-text-sub">Nesta semana</span>
                </div>
              </div>
            </div>

            {/* Grid Charts & AI Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Weekly Attendance Chart */}
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm lg:col-span-2">
                <span className="text-xs font-bold text-text-sub uppercase tracking-wider block mb-5">Frequência Semanal Geral (% de Presença)</span>
                <div className="h-56 w-full text-xs">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#182235" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis unit="%" stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0c111e', 
                            borderColor: '#182235',
                            borderRadius: '12px',
                            color: '#fff'
                          }} 
                        />
                        <Bar dataKey="presenca" fill={brand.colors.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Avisos Rápidos Panel */}
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border-custom">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Avisos Rápidos</span>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-black/20 p-3 rounded-xl border border-border-custom space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-white">Treino Vencendo</span>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Alerta</span>
                    </div>
                    <p className="text-[11px] text-text-sub leading-relaxed">
                      O treino de 2 alunos vence em menos de 3 dias. Revise a periodização na aba correspondente.
                    </p>
                  </div>

                  <div className="bg-black/20 p-3 rounded-xl border border-border-custom space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-white">Faltas Recorrentes</span>
                      <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Atenção</span>
                    </div>
                    <p className="text-[11px] text-text-sub leading-relaxed">
                      1 aluno não registra conclusão de treinos há mais de 10 dias. Considere enviar uma mensagem no Chat.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: STUDENTS — detalhe completo do aluno (ao clicar) */}
        {activeTab === 'students' && detailStudent && (
          <StudentDetail
            student={detailStudent}
            onBack={() => setDetailStudent(null)}
            onChat={(s) => {
              setSelectedChatStudent(s as ApiStudent);
              setActiveTab('chat');
            }}
          />
        )}

        {/* Tab 2: STUDENTS — lista */}
        {activeTab === 'students' && !detailStudent && (
          <div className="space-y-6 animate-fade-in">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-bg-card border border-border-custom p-4 rounded-2xl">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 w-4 h-4 text-text-sub" />
                <input 
                  type="text" 
                  placeholder="Buscar aluno por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black/35 border border-border-custom rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs"
                />
              </div>
              
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-4 font-bold rounded-xl text-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                style={{ backgroundColor: brand.colors.primary, color: brand.colors.accent }}
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Aluno (IA)
              </button>
            </div>

            {/* Erro de carregamento */}
            {studentsError && (
              <div className="flex items-center justify-between gap-3 text-xs rounded-xl px-4 py-3 border border-red-500/25 bg-red-500/10 text-red-300">
                <span>{studentsError}</span>
                <button
                  onClick={loadStudents}
                  className="font-bold underline hover:no-underline cursor-pointer shrink-0"
                >
                  Tentar de novo
                </button>
              </div>
            )}

            {/* Fila de aprovação (pendentes) */}
            {pendingStudents.length > 0 && (
              <div className="bg-bg-card border border-amber-500/25 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border-custom bg-amber-500/5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Aguardando aprovação ({pendingStudents.length})
                  </span>
                </div>

                <div className="divide-y divide-border-custom">
                  {pendingStudents.map((student) => (
                    <div key={student.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-sm shrink-0">
                          {initials(student.name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">{student.name}</h4>
                          <span className="text-xs text-text-sub">{studentSummary(student)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDecision(student.id, 'reject')}
                          disabled={actingId === student.id}
                          className="px-3 py-2 rounded-xl text-xs font-bold border border-border-custom text-text-sub hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Rejeitar
                        </button>
                        <button
                          onClick={() => handleDecision(student.id, 'approve')}
                          disabled={actingId === student.id}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          style={{ backgroundColor: brand.colors.primary, color: brand.colors.accent }}
                        >
                          {actingId === student.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Aprovar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List and Details Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Students List */}
              <div className="bg-bg-card border border-border-custom rounded-2xl overflow-hidden shadow-sm lg:col-span-2">
                <div className="px-5 py-4 border-b border-border-custom bg-black/10">
                  <span className="text-xs font-bold text-text-sub uppercase tracking-wider">
                    Alunos ({activeStudents.length})
                  </span>
                </div>

                <div className="divide-y divide-border-custom">
                  {loadingStudents ? (
                    <div className="p-8 flex items-center justify-center gap-2 text-text-sub text-xs">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Carregando alunos...
                    </div>
                  ) : (
                    activeStudents
                      .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((student) => (
                        <div
                          key={student.id}
                          onClick={() => { setSelectedStudent(student); setDetailStudent(student); }}
                          className={`p-4 flex items-center justify-between hover:bg-white/2 transition-colors cursor-pointer ${
                            selectedStudent?.id === student.id ? 'bg-primary/3' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-sm shrink-0">
                              {initials(student.name)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-white truncate">{student.name}</h4>
                              <span className="text-xs text-text-sub">{studentSummary(student)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded hidden sm:block"
                              style={
                                student.status === 'ONBOARDED'
                                  ? { color: brand.colors.primary, backgroundColor: `${brand.colors.primary}1f` }
                                  : { color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.12)' }
                              }
                            >
                              {STATUS_LABEL[student.status]}
                            </span>
                            <ChevronRight className="w-4 h-4 text-text-sub" />
                          </div>
                        </div>
                      ))
                  )}

                  {!loadingStudents &&
                    activeStudents.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <div className="p-8 text-center text-text-sub text-xs">
                        {activeStudents.length === 0
                          ? 'Nenhum aluno ativo ainda. Aprove alunos na fila acima.'
                          : 'Nenhum aluno encontrado com este nome.'}
                      </div>
                    )}
                </div>
              </div>

              {/* Student Detail Panel */}
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm h-fit">
                {selectedStudent ? (
                  <div className="space-y-5">
                    <div className="text-center space-y-2 pb-4 border-b border-border-custom">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-xl font-bold border border-white/5">
                        {initials(selectedStudent.name)}
                      </div>
                      <h3 className="font-bold text-base">{selectedStudent.name}</h3>
                      <p className="text-xs text-text-sub">
                        Objetivo: <span className="text-white font-semibold">{titleCase(selectedStudent.goal)}</span>
                      </p>
                      <span
                        className="inline-block text-[10px] font-bold px-2 py-0.5 rounded"
                        style={
                          selectedStudent.status === 'ONBOARDED'
                            ? { color: brand.colors.primary, backgroundColor: `${brand.colors.primary}1f` }
                            : { color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.12)' }
                        }
                      >
                        {STATUS_LABEL[selectedStudent.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center text-xs">
                      <div className="bg-black/20 p-3 rounded-xl border border-border-custom">
                        <span className="text-text-sub text-[10px] block">Peso Atual</span>
                        <span className="font-extrabold text-white mt-1 block">
                          {selectedStudent.weightKg ? `${selectedStudent.weightKg} kg` : '—'}
                        </span>
                      </div>
                      <div className="bg-black/20 p-3 rounded-xl border border-border-custom">
                        <span className="text-text-sub text-[10px] block">Altura</span>
                        <span className="font-extrabold text-white mt-1 block">
                          {selectedStudent.heightCm ? `${selectedStudent.heightCm} cm` : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      <div className="text-xs space-y-1">
                        <span className="text-text-sub block">Idade:</span>
                        <span className="font-semibold text-white block">
                          {ageFrom(selectedStudent.birthdate) !== null
                            ? `${ageFrom(selectedStudent.birthdate)} anos`
                            : 'Não informado'}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <span className="text-text-sub block">Frequência Semanal:</span>
                        <span className="font-semibold text-white block">
                          {selectedStudent.weeklyFrequency
                            ? `${selectedStudent.weeklyFrequency}x na semana`
                            : 'Não informado'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border-custom hover:border-white/10 bg-black/20 hover:bg-black/40 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWorkoutTemplate('ABCDE Standard');
                          setActiveTab('periodization');
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        style={{ backgroundColor: brand.colors.primary, color: brand.colors.accent }}
                      >
                        <Dumbbell className="w-3.5 h-3.5" />
                        Prescrever
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-border-custom">
                      <PersonasPanel studentId={selectedStudent.id} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-sub text-xs">
                    Selecione um aluno na lista para ver o perfil detalhado.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: PERIODIZATION */}
        {activeTab === 'periodization' && (
          <div className="space-y-6 animate-fade-in">
            <PeriodizationBuilder studentId={selectedStudent?.id} />
          </div>
        )}

        {/* Tab 4: CHAT */}
        {activeTab === 'chat' && (
          <div className="bg-bg-card border border-border-custom rounded-2xl h-[530px] flex overflow-hidden shadow-md animate-fade-in">
            {/* Students roster left side */}
            <div className="w-1/3 border-r border-border-custom flex flex-col bg-black/10">
              <div className="p-3 border-b border-border-custom">
                <span className="text-[10px] font-bold text-text-sub uppercase tracking-wider block">Conversas</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border-custom">
                {activeStudents.map((student) => {
                  const hasChat = chatMessages[student.id];
                  const lastMsg = hasChat ? hasChat[hasChat.length - 1]?.text : 'Sem mensagens...';
                  const isSelected = selectedChatStudent?.id === student.id;
                  
                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedChatStudent(student)}
                      className={`p-3 cursor-pointer hover:bg-white/2 transition-colors ${
                        isSelected ? 'bg-primary/3' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                          {student.name.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-white truncate leading-none">{student.name}</h5>
                          <p className="text-[10px] text-text-sub truncate mt-1 leading-none">{lastMsg}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat dialog right side */}
            <div className="flex-1 flex flex-col">
              {selectedChatStudent ? (
                <>
                  {/* Dialog Header */}
                  <div className="px-4 py-3 border-b border-border-custom bg-black/25 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-white/5">
                      {selectedChatStudent.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white leading-none">{selectedChatStudent.name}</h4>
                      <span className="text-[9px] text-text-sub block mt-0.5">Aluno de Hipertrofia</span>
                    </div>
                  </div>

                  {/* Dialogue Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-black/5">
                    {(chatMessages[selectedChatStudent.id] || []).map((msg) => {
                      const isMe = msg.sender === 'teacher';
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                              className="text-[8px] text-right mt-1.5 block opacity-60"
                              style={{ color: isMe ? brand.colors.accent : brand.colors.textSecondary }}
                            >
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {(chatMessages[selectedChatStudent.id] || []).length === 0 && (
                      <div className="text-center py-20 text-text-sub text-xs">
                        Envie uma mensagem para iniciar a conversa.
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendChatMessage} className="p-3 border-t border-border-custom bg-black/10 flex gap-2">
                    <input 
                      type="text" 
                      placeholder={`Enviar mensagem para ${selectedChatStudent.name.split(' ')[0]}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-black/30 border border-border-custom rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text-main placeholder-text-sub/50"
                    />
                    <button 
                      type="submit"
                      className="p-2.5 rounded-xl transition-transform active:scale-95 cursor-pointer shadow-md"
                      style={{ backgroundColor: brand.colors.primary, color: brand.colors.accent }}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-text-sub text-xs">
                  Selecione uma conversa na barra lateral.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Student Modal (Interactive with AI Persona Engine) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-bg-card border border-border-custom rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col lg:flex-row overflow-hidden max-h-[90vh]">
            
            {/* Form Left Side */}
            <form onSubmit={handleAddStudent} className="flex-1 p-6 space-y-4 overflow-y-auto border-r border-border-custom">
              <div className="flex justify-between items-center border-b border-border-custom pb-3 mb-4">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5 uppercase">
                  <UserPlus className="w-4 h-4" style={{ color: brand.colors.primary }} />
                  Cadastro de Novo Aluno
                </h3>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-text-sub hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-sub">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nome do aluno"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-4.5 py-2.5 bg-black/30 border border-border-custom rounded-xl focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-sub">Idade</label>
                  <input 
                    type="number" 
                    required
                    placeholder="Anos"
                    value={newStudentAge}
                    onChange={(e) => setNewStudentAge(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-border-custom rounded-xl focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-sub">Sexo</label>
                  <select 
                    value={newStudentSex}
                    onChange={(e) => setNewStudentSex(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 bg-black/30 border border-border-custom rounded-xl focus:outline-none focus:border-primary text-xs text-white"
                  >
                    <option value="M" className="bg-bg-card">Masculino</option>
                    <option value="F" className="bg-bg-card">Feminino</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-sub">Freq. Semanal</label>
                  <select 
                    value={newStudentFreq}
                    onChange={(e) => setNewStudentFreq(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-border-custom rounded-xl focus:outline-none focus:border-primary text-xs text-white"
                  >
                    <option value="3" className="bg-bg-card">3x na semana</option>
                    <option value="4" className="bg-bg-card">4x na semana</option>
                    <option value="5" className="bg-bg-card">5x na semana</option>
                    <option value="6" className="bg-bg-card">6x na semana</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-sub">Peso (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    placeholder="Ex: 74.5"
                    value={newStudentWeight}
                    onChange={(e) => setNewStudentWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-border-custom rounded-xl focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-sub">Altura (m)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="Ex: 1.80"
                    value={newStudentHeight}
                    onChange={(e) => setNewStudentHeight(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-border-custom rounded-xl focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-sub">Objetivo Principal</label>
                <select 
                  value={newStudentGoal}
                  onChange={(e) => setNewStudentGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-border-custom rounded-xl focus:outline-none focus:border-primary text-xs text-white"
                >
                  <option value="Hipertrofia" className="bg-bg-card">Hipertrofia (Ganho de Massa)</option>
                  <option value="Emagrecimento" className="bg-bg-card">Emagrecimento (Perda de Gordura)</option>
                  <option value="Condicionamento" className="bg-bg-card">Condicionamento Físico Geral</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 px-4 font-bold rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.01] text-xs flex items-center justify-center gap-2 cursor-pointer mt-6"
                style={{ 
                  backgroundColor: brand.colors.primary, 
                  color: brand.colors.accent,
                  boxShadow: `0 4px 20px ${brand.colors.primary}33`
                }}
              >
                Cadastrar Aluno
              </button>
            </form>

            {/* Persona IA Right Side */}
            <div className="w-full lg:w-96 bg-black/30 p-6 flex flex-col justify-center items-center text-center text-text-sub border-l border-border-custom">
              <Cpu className="w-8 h-8 opacity-20 mb-3" />
              <p className="text-xs">
                O Motor de Personas foi movido para o painel de detalhes do aluno.<br/><br/>
                Após cadastrar e aprovar o aluno, você poderá visualizar suas compatibilidades com a base de dados em tempo real.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav for Mobile view */}
      <nav className="fixed bottom-0 inset-x-0 bg-bg-card/90 backdrop-blur-md border-t border-border-custom py-2 flex justify-around items-center z-40 md:hidden">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'students', label: 'Alunos', icon: Users },
          { id: 'periodization', label: 'Treinos', icon: Calendar },
          { id: 'chat', label: 'Chat', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id ? 'text-primary font-bold' : 'text-text-sub hover:text-white'
              }`}
              style={activeTab === tab.id ? { color: brand.colors.primary } : {}}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[9px] tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
