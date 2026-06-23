'use client';

import React, { useState, useEffect } from 'react';
import { useBrand } from '@/context/BrandContext';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabaseClient';

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

export default function ProfessorDashboard() {
  const { brand } = useBrand();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMounted, setIsMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected student details view
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // "New Student" modal/form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAge, setNewStudentAge] = useState('');
  const [newStudentSex, setNewStudentSex] = useState<'M' | 'F'>('M');
  const [newStudentWeight, setNewStudentWeight] = useState('');
  const [newStudentHeight, setNewStudentHeight] = useState('');
  const [newStudentGoal, setNewStudentGoal] = useState('Hipertrofia');
  const [newStudentFreq, setNewStudentFreq] = useState('5');
  
  // Live Persona Engine output
  const [personas, setPersonas] = useState<any[]>([]);
  const [isComputingPersonas, setIsComputingPersonas] = useState(false);

  // Periodization Editor State
  const [selectedWorkoutTemplate, setSelectedWorkoutTemplate] = useState('ABCDE Standard');
  const [periodizationSuccess, setPeriodizationSuccess] = useState(false);

  // Chat State
  const [selectedChatStudent, setSelectedChatStudent] = useState<Student | null>(initialStudents[0]);
  const [chatMessages, setChatMessages] = useState<Record<number, any[]>>({
    1: [
      { id: 1, sender: 'teacher', text: 'Fala, João! Vi seu feedback do último treino. Como sentiu o ombro na elevação lateral?', time: 'Ontem 09:30' },
      { id: 2, sender: 'student', text: 'E aí, mestre! Sentiu um pouco no começo, mas depois que aqueci bem melhorou. Mantive a carga de 10kg.', time: 'Ontem 10:15' },
      { id: 3, sender: 'teacher', text: 'Boa! Próximo treino vamos focar mais no aquecimento do manguito. Hoje é dia de costas e bíceps, foca na amplitude!', time: 'Hoje 09:30' }
    ],
    2: [
      { id: 1, sender: 'student', text: 'Professor, posso trocar o agachamento livre por leg press hoje? Estou com um leve desconforto na lombar.', time: 'Hoje 08:00' },
      { id: 2, sender: 'teacher', text: 'Pode sim, Pedro. Faça no Leg Press 45º e controle bem a amplitude. Evite travar os joelhos no final.', time: 'Hoje 08:15' }
    ]
  });
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Live calculation of Personas based on form input
  useEffect(() => {
    if (!newStudentAge || !newStudentWeight || !newStudentHeight) {
      setPersonas([]);
      return;
    }
    
    setIsComputingPersonas(true);
    const timer = setTimeout(() => {
      // Simulating similarity logic
      // Compare to Pedro (18, Hipertrofia, 72kg, 1.78m), Gabriel (20, Hipertrofia, 68kg, 1.74m), Matheus (22, Hipertrofia, 75kg, 1.82m)
      const inputAge = parseInt(newStudentAge);
      const inputWeight = parseFloat(newStudentWeight);
      const inputHeight = parseFloat(newStudentHeight);
      
      const results = [
        { 
          id: 2, 
          name: 'Pedro Ramos', 
          match: 92, 
          age: 18, 
          weight: 72, 
          height: 1.78, 
          goal: 'Hipertrofia', 
          strategy: 'Periodização ABCDE (Volume Moderado)',
          explanation: 'Apresentou 27% mais ganho de massa magra com volume de 16-20 séries semanais por grupamento. Responde melhor a repetições na faixa de 10-12.' 
        },
        { 
          id: 3, 
          name: 'Gabriel Santos', 
          match: 87, 
          age: 20, 
          weight: 68, 
          height: 1.74, 
          goal: 'Hipertrofia', 
          strategy: 'Periodização ABC (Treino Híbrido)',
          explanation: 'Adesão fantástica a treinos de 45 minutos. Evoluiu bem com cargas progressivas focadas em multiarticulares.' 
        },
        { 
          id: 4, 
          name: 'Matheus Costa', 
          match: 84, 
          age: 22, 
          weight: 75, 
          height: 1.82, 
          goal: 'Hipertrofia', 
          strategy: 'Periodização ABCD (Alta Intensidade)',
          explanation: 'Teve excelente resposta com técnicas avançadas (Rest-Pause, Drop-set) nas últimas séries.' 
        }
      ];

      // Alter scores slightly based on inputs to simulate calculation
      const calculated = results.map(p => {
        const ageDiff = Math.abs(p.age - inputAge);
        const weightDiff = Math.abs(p.weight - inputWeight);
        const heightDiff = Math.abs(p.height - inputHeight);
        const penalty = (ageDiff * 1) + (weightDiff * 1.5) + (heightDiff * 10);
        const finalMatch = Math.max(50, Math.min(98, p.match - Math.round(penalty)));
        return { ...p, match: finalMatch };
      }).sort((a, b) => b.match - a.match);

      setPersonas(calculated);
      setIsComputingPersonas(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [newStudentAge, newStudentWeight, newStudentHeight, newStudentGoal]);

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

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedChatStudent) return;

    const studentId = selectedChatStudent.id;
    const currentMsgs = chatMessages[studentId] || [];
    
    const newMsg = {
      id: currentMsgs.length + 1,
      sender: 'teacher',
      text: chatInput,
      time: 'Agora'
    };

    setChatMessages({
      ...chatMessages,
      [studentId]: [...currentMsgs, newMsg]
    });
    setChatInput('');
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
                  <span className="text-3xl font-black">5</span>
                  <span className="text-[10px] text-green-400 font-bold flex items-center">↑ 100%</span>
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
                <span className="text-xs text-text-sub uppercase font-bold tracking-wider">Consultas IA</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black" style={{ color: brand.colors.primary }}>v1</span>
                  <span className="text-[10px] text-text-sub">Motor de Personas</span>
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

              {/* AI Assistant Alerts Panel */}
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border-custom">
                  <Sparkles className="w-5 h-5" style={{ color: brand.colors.primary }} />
                  <span className="text-xs font-bold uppercase tracking-wider">Alertas da IA</span>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-black/20 p-3 rounded-xl border border-border-custom space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-white">Luis Lima (Pendente)</span>
                      <span className="text-[9px] font-bold bg-primary/20 px-2 py-0.5 rounded" style={{ color: brand.colors.primary }}>92% Compatibilidade</span>
                    </div>
                    <p className="text-[11px] text-text-sub leading-relaxed">
                      Perfil compatível com Pedro Ramos. Sugerido aplicar periodização baseada em volume moderado e divisão ABCDE.
                    </p>
                    <button 
                      onClick={() => {
                        setSelectedWorkoutTemplate('ABCDE Standard');
                        setActiveTab('periodization');
                      }}
                      className="text-[10px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      style={{ color: brand.colors.primary }}
                    >
                      Ver Periodização Sugerida
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="bg-black/20 p-3 rounded-xl border border-border-custom space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-white">Gabriel Santos</span>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Alerta Volume</span>
                    </div>
                    <p className="text-[11px] text-text-sub leading-relaxed">
                      Evolução de peso estagnada há 3 semanas. IA recomenda recalcular cargas ou aplicar semana de Deload.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: STUDENTS */}
        {activeTab === 'students' && (
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

            {/* List and Details Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Students List */}
              <div className="bg-bg-card border border-border-custom rounded-2xl overflow-hidden shadow-sm lg:col-span-2">
                <div className="px-5 py-4 border-b border-border-custom bg-black/10">
                  <span className="text-xs font-bold text-text-sub uppercase tracking-wider">Lista de Alunos</span>
                </div>
                
                <div className="divide-y divide-border-custom">
                  {filteredStudents.map((student) => (
                    <div 
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`p-4 flex items-center justify-between hover:bg-white/2 transition-colors cursor-pointer ${
                        selectedStudent?.id === student.id ? 'bg-primary/3' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-sm">
                          {student.name.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{student.name}</h4>
                          <span className="text-xs text-text-sub">{student.age} anos · {student.goal}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-text-sub uppercase block">Assiduidade</span>
                          <span className="text-xs font-extrabold text-white mt-0.5 block">{student.attendance}%</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-sub" />
                      </div>
                    </div>
                  ))}

                  {filteredStudents.length === 0 && (
                    <div className="p-8 text-center text-text-sub text-xs">
                      Nenhum aluno encontrado com este nome.
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
                        {selectedStudent.name.split(' ').map(w => w[0]).join('')}
                      </div>
                      <h3 className="font-bold text-base">{selectedStudent.name}</h3>
                      <p className="text-xs text-text-sub">{selectedStudent.age} anos · Objetivo: <span className="text-white font-semibold">{selectedStudent.goal}</span></p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center text-xs">
                      <div className="bg-black/20 p-3 rounded-xl border border-border-custom">
                        <span className="text-text-sub text-[10px] block">Peso Atual</span>
                        <span className="font-extrabold text-white mt-1 block">{selectedStudent.weight} kg</span>
                      </div>
                      <div className="bg-black/20 p-3 rounded-xl border border-border-custom">
                        <span className="text-text-sub text-[10px] block">Altura</span>
                        <span className="font-extrabold text-white mt-1 block">{selectedStudent.height} m</span>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      <div className="text-xs space-y-1">
                        <span className="text-text-sub block">Frequência Semanal:</span>
                        <span className="font-semibold text-white block">{selectedStudent.frequency} vezes na semana</span>
                      </div>

                      <div className="text-xs space-y-1">
                        <span className="text-text-sub block">Último treino registrado:</span>
                        <span className="font-semibold text-white block flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          {selectedStudent.lastWorkout}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => {
                          setSelectedChatStudent(selectedStudent);
                          setActiveTab('chat');
                        }}
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
            <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base">Prescrição & Montagem de Ficha</h3>
                <p className="text-xs text-text-sub mt-0.5">Monte periodizações semanais com auxílio de modelos inteligentes.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-text-sub font-semibold">Modelo:</span>
                <select 
                  value={selectedWorkoutTemplate}
                  onChange={(e) => setSelectedWorkoutTemplate(e.target.value)}
                  className="bg-black/30 border border-border-custom rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="ABCDE Standard">ABCDE Standard (Hipertrofia Foco)</option>
                  <option value="ABC Iniciante">ABC Iniciante (Geral)</option>
                  <option value="Deload Semanal">Deload Semanal (Recuperação)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Weekly Periodization Builder */}
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
                <span className="text-xs font-bold text-text-sub uppercase tracking-wider block">Estrutura da Semana</span>
                
                <div className="space-y-3">
                  {[
                    { day: 'Segunda-feira', type: 'Treino A', target: 'Peito e Tríceps', exercises: 5 },
                    { day: 'Terça-feira', type: 'Cardio', target: 'Cardio Livre (30-40 min)', exercises: 1 },
                    { day: 'Quarta-feira', type: 'Treino B', target: 'Costas e Bíceps', exercises: 5 },
                    { day: 'Quinta-feira', type: 'Descanso', target: 'Recuperação Ativa', exercises: 0 },
                    { day: 'Sexta-feira', type: 'Treino C', target: 'Pernas Completo', exercises: 6 },
                    { day: 'Sábado-feira', type: 'Cardio', target: 'Corrida/Funcional', exercises: 1 },
                    { day: 'Domingo-feira', type: 'Descanso', target: 'Recuperação Passiva', exercises: 0 },
                  ].map((d, idx) => (
                    <div key={idx} className="bg-black/25 border border-border-custom rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-white">{d.day}</span>
                        <div className="flex gap-2 items-center mt-1 text-text-sub">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 font-semibold text-[10px]">{d.type}</span>
                          <span>{d.target}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-text-sub">{d.exercises} exercícios</span>
                        <button 
                          className="px-2.5 py-1 rounded border border-border-custom hover:border-white/10 hover:bg-white/5 font-bold cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border-custom flex justify-end gap-3">
                  <button 
                    onClick={() => {
                      setPeriodizationSuccess(true);
                      setTimeout(() => setPeriodizationSuccess(false), 3000);
                    }}
                    className="py-3 px-6 font-bold rounded-xl text-xs transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-md"
                    style={{ backgroundColor: brand.colors.primary, color: brand.colors.accent }}
                  >
                    Salvar e Enviar Ficha
                  </button>
                </div>

                {periodizationSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl text-center font-bold">
                    ✓ Periodização enviada ao aplicativo do aluno!
                  </div>
                )}
              </div>

              {/* Template details / catalogue */}
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm h-fit space-y-4">
                <span className="text-xs font-bold text-text-sub uppercase tracking-wider block">Catálogo de Exercícios</span>
                
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-sub" />
                  <input 
                    type="text" 
                    placeholder="Filtrar por grupo muscular..."
                    className="w-full pl-9 pr-4 py-2 bg-black/35 border border-border-custom rounded-xl focus:outline-none text-[11px]"
                  />
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {[
                    { name: 'Supino Reto com Barra', cat: 'Peitoral' },
                    { name: 'Puxada no Pulldown', cat: 'Dorsais' },
                    { name: 'Agachamento Livre', cat: 'Quadríceps' },
                    { name: 'Elevação Lateral Halter', cat: 'Deltoides' },
                    { name: 'Rosca Direta Barra W', cat: 'Bíceps' },
                    { name: 'Tríceps Corda Polia', cat: 'Tríceps' },
                  ].map((ex, idx) => (
                    <div key={idx} className="p-2.5 bg-black/20 hover:bg-black/45 border border-border-custom rounded-xl flex items-center justify-between text-xs transition-colors">
                      <div>
                        <span className="font-semibold text-white">{ex.name}</span>
                        <span className="text-[10px] text-text-sub block mt-0.5">{ex.cat}</span>
                      </div>
                      <button 
                        className="p-1 rounded bg-primary/15 hover:bg-primary/25 text-primary cursor-pointer transition-colors"
                        style={{ color: brand.colors.primary }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                {students.map((student) => {
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
            <div className="w-full lg:w-96 bg-black/30 p-6 flex flex-col overflow-y-auto max-h-[45vh] lg:max-h-full">
              <div className="flex items-center gap-2 border-b border-border-custom pb-3 mb-4">
                <Cpu className="w-5 h-5" style={{ color: brand.colors.primary }} />
                <div>
                  <h4 className="font-extrabold text-xs uppercase leading-none">Motor de Personas v1</h4>
                  <span className="text-[9px] text-text-sub font-semibold tracking-wider block mt-1">INTELIGÊNCIA COLETIVA ATIVA</span>
                </div>
              </div>

              {isComputingPersonas ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-text-sub text-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" style={{ borderColor: brand.colors.primary, borderTopColor: 'transparent' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Analisando histórico de alunos...</span>
                </div>
              ) : personas.length > 0 ? (
                <div className="space-y-4 flex-1">
                  <span className="text-[10px] font-bold text-text-sub uppercase tracking-wider block">Personas Similares Encontradas</span>
                  
                  <div className="space-y-3">
                    {personas.map((persona, idx) => (
                      <div key={idx} className="bg-bg-card border border-border-custom rounded-xl p-3.5 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-white">{persona.name}</span>
                          <span className="text-[9px] font-black bg-primary/20 px-2 py-0.5 rounded" style={{ color: brand.colors.primary }}>
                            {persona.match}% compatível
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-text-sub space-y-1.5">
                          <p><span className="font-semibold text-white/90">Estratégia bem sucedida:</span> {persona.strategy}</p>
                          <p className="leading-relaxed bg-black/25 p-2 rounded-lg border border-border-custom">{persona.explanation}</p>
                        </div>

                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedWorkoutTemplate(persona.strategy.includes('ABCDE') ? 'ABCDE Standard' : 'ABC Iniciante');
                            // Simulating applying the template
                            alert(`Modelo de Periodização Sugerido por IA (${persona.strategy}) aplicado com sucesso!`);
                          }}
                          className="w-full text-center text-[10px] font-bold py-1.5 border border-border-custom hover:border-primary rounded-lg transition-colors cursor-pointer"
                        >
                          Aplicar Divisão Sugerida
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-text-sub text-xs">
                  <AlertCircle className="w-8 h-8 opacity-30 mb-2" />
                  Preencha os dados de Idade, Peso e Altura do formulário para o Motor de Personas identificar similaridades.
                </div>
              )}
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
