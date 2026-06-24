'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useBrand } from '@/context/BrandContext';
import { supabase, API_URL } from '@/lib/supabaseClient';
import StudentDetail from '@/components/StudentDetail';
import NotificationsBell from '@/components/NotificationsBell';
import Skeleton, { SkeletonRow } from '@/components/Skeleton';

import {
  Users,
  MessageSquare,
  Search,
  UserPlus,
  Check,
  AlertCircle,
  Send,
  TrendingUp,
  Clock,
  ChevronRight,
  CreditCard,
  ClipboardCheck,
  Copy,
  X,
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'students' | 'chat';

// ---- Dados REAIS vindos do backend ----
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

interface DashboardStats {
  activeStudents: number;
  onboardedStudents: number;
  pendingStudents: number;
  totalStudents: number;
  adherencePct: number | null;
  workoutsCount: number;
  recentAssessments: { id: string; date: string; weightKg: number | null; bodyFatPct: number | null; studentName: string }[];
  pendingApprovals: { id: string; name: string; createdAt: string }[];
}

interface OverdueSub {
  id: string;
  studentId: string;
  planName: string | null;
  dueDate: string | null;
  student?: { name: string };
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
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function studentSummary(s: ApiStudent): string {
  const age = ageFrom(s.birthdate);
  const parts: string[] = [];
  if (age !== null) parts.push(`${age} anos`);
  if (s.goal) parts.push(titleCase(s.goal));
  return parts.length ? parts.join(' · ') : 'Perfil ainda não preenchido';
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function ProfessorDashboard() {
  const { brand } = useBrand();
  const c = brand.colors;
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Alunos
  const [activeStudents, setActiveStudents] = useState<ApiStudent[]>([]);
  const [pendingStudents, setPendingStudents] = useState<ApiStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [detailStudent, setDetailStudent] = useState<ApiStudent | null>(null);

  // Dashboard (stats reais)
  const [dash, setDash] = useState<DashboardStats | null>(null);
  const [overdue, setOverdue] = useState<OverdueSub[]>([]);
  const [loadingDash, setLoadingDash] = useState(true);

  // Convite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Chat
  const [selectedChatStudent, setSelectedChatStudent] = useState<ApiStudent | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});
  const [chatInput, setChatInput] = useState('');
  const [myUserId, setMyUserId] = useState('');

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
    setIsMounted(true);
    supabase.auth.getUser().then(({ data }) => setMyUserId(data.user?.id ?? ''));
  }, []);

  const loadStudents = useCallback(async () => {
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
  }, [authedFetch]);

  const loadDashboard = useCallback(async () => {
    setLoadingDash(true);
    try {
      const [dRes, oRes] = await Promise.all([
        authedFetch('/api/professor/dashboard'),
        authedFetch('/api/professor/subscriptions?status=OVERDUE'),
      ]);
      if (dRes.ok) setDash(await dRes.json());
      if (oRes.ok) setOverdue(await oRes.json());
    } catch {
      /* silencioso */
    } finally {
      setLoadingDash(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    loadStudents();
    loadDashboard();
  }, [loadStudents, loadDashboard]);

  // Carrega todas as conversas (para badges de não-lidas) e faz polling enquanto no chat.
  const refreshAllChats = useCallback(async () => {
    if (activeStudents.length === 0) return;
    try {
      const entries = await Promise.all(
        activeStudents.map(async (s) => {
          const res = await authedFetch(`/api/chat/${s.id}`);
          return [s.id, res.ok ? await res.json() : []] as const;
        }),
      );
      setChatMessages(Object.fromEntries(entries));
    } catch {
      /* silencioso */
    }
  }, [activeStudents, authedFetch]);

  useEffect(() => {
    if (activeTab !== 'chat') return;
    refreshAllChats();
    const t = setInterval(refreshAllChats, 20000);
    return () => clearInterval(t);
  }, [activeTab, refreshAllChats]);

  const openConversation = async (student: ApiStudent) => {
    setSelectedChatStudent(student);
    try {
      const res = await authedFetch(`/api/chat/${student.id}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => ({ ...prev, [student.id]: data }));
      }
      await authedFetch(`/api/chat/${student.id}/read`, { method: 'POST' });
    } catch {
      /* silencioso */
    }
  };

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    setActingId(id);
    try {
      const res = await authedFetch(`/api/professor/students/${id}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error('request failed');
      await Promise.all([loadStudents(), loadDashboard()]);
      toast.success(action === 'approve' ? 'Aluno aprovado!' : 'Aluno rejeitado.');
    } catch {
      toast.error('Não foi possível concluir a ação.');
    } finally {
      setActingId(null);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedChatStudent) return;
    const studentId = selectedChatStudent.id;
    const msgText = chatInput.trim();
    setChatInput('');
    try {
      await authedFetch(`/api/chat/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: msgText }),
      });
      const res = await authedFetch(`/api/chat/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => ({ ...prev, [studentId]: data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/cadastro` : '/cadastro';
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const unreadFor = (studentId: string) =>
    (chatMessages[studentId] || []).filter((m) => m.fromUserId && m.fromUserId !== myUserId && !m.readAt).length;

  const filteredActive = activeStudents.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'students', label: 'Alunos', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-bg-main text-text-main pb-10 select-none">
      {/* Top Navbar */}
      <header className="sticky top-0 bg-bg-card/90 backdrop-blur-md border-b border-border-custom px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-9 h-9 object-contain rounded-lg border border-border-custom" />
          <div>
            <h1 className="text-base font-black tracking-tight uppercase leading-none">{brand.name}</h1>
            <span className="text-[10px] text-text-sub font-semibold tracking-widest mt-1 block">PAINEL DO PROFESSOR</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-5">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 text-sm font-semibold transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5 cursor-pointer"
                style={activeTab === tab.id ? { color: c.primary } : { color: c.textSecondary }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <NotificationsBell />
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="flex items-center gap-2 px-3 py-1.5 border border-border-custom rounded-xl hover:bg-red-500/10 hover:border-red-500/20 text-text-sub hover:text-red-400 text-xs font-bold transition-all cursor-pointer"
          >
            <img src="/personal-photo.jpg" alt="Sair" className="w-5 h-5 rounded-full object-cover border border-white/10" />
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-6">
        {/* ====================== DASHBOARD ====================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-text-sub uppercase font-bold tracking-wider">Alunos Ativos</span>
                <div className="flex items-baseline gap-2 mt-2">
                  {loadingDash ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <span className="text-3xl font-black">{dash ? dash.activeStudents : '—'}</span>
                  )}
                  {!!dash?.pendingStudents && (
                    <button onClick={() => setActiveTab('students')} className="text-[10px] text-amber-400 font-bold cursor-pointer hover:underline">
                      {dash.pendingStudents} na fila
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-text-sub uppercase font-bold tracking-wider">Assiduidade (30d)</span>
                <div className="flex items-baseline gap-2 mt-2">
                  {loadingDash ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <span className="text-3xl font-black">{dash?.adherencePct != null ? `${dash.adherencePct}%` : '—'}</span>
                  )}
                  <span className="text-[10px] font-bold" style={{ color: c.primary }}>dos treinos</span>
                </div>
              </div>

              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-text-sub uppercase font-bold tracking-wider">Inadimplentes</span>
                <div className="flex items-baseline gap-2 mt-2">
                  {loadingDash ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <span className={`text-3xl font-black ${overdue.length ? 'text-red-400' : ''}`}>{overdue.length}</span>
                  )}
                  <span className="text-[10px] text-text-sub">mensalidades</span>
                </div>
              </div>

              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-text-sub uppercase font-bold tracking-wider">Fichas criadas</span>
                <div className="flex items-baseline gap-2 mt-2">
                  {loadingDash ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <span className="text-3xl font-black">{dash ? dash.workoutsCount : '—'}</span>
                  )}
                  <span className="text-[10px] text-text-sub">treinos</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Avaliações recentes */}
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm lg:col-span-2">
                <div className="flex items-center gap-2 pb-3 border-b border-border-custom mb-3">
                  <ClipboardCheck className="w-5 h-5" style={{ color: c.primary }} />
                  <span className="text-xs font-bold uppercase tracking-wider">Avaliações recentes</span>
                </div>
                {loadingDash ? (
                  <div className="py-8 text-center text-text-sub text-xs">Carregando...</div>
                ) : dash && dash.recentAssessments.length > 0 ? (
                  <div className="divide-y divide-border-custom">
                    {dash.recentAssessments.map((a) => (
                      <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {initials(a.studentName || '?')}
                          </div>
                          <span className="font-bold text-white truncate">{a.studentName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-text-sub shrink-0">
                          {a.weightKg != null && <span>{a.weightKg} kg</span>}
                          {a.bodyFatPct != null && <span>{a.bodyFatPct}% gordura</span>}
                          <span>{fmtDate(a.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-text-sub text-xs">Nenhuma avaliação registrada ainda.</div>
                )}
              </div>

              {/* Pendências: aprovações + inadimplentes */}
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border-custom">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Pendências</span>
                </div>

                <button
                  onClick={() => setActiveTab('students')}
                  className="w-full text-left bg-black/20 p-3 rounded-xl border border-border-custom hover:border-amber-500/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-white">Aprovações na fila</span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {dash?.pendingStudents ?? 0}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-sub mt-1">Alunos aguardando sua aprovação na aba Alunos.</p>
                </button>

                <div className="bg-black/20 p-3 rounded-xl border border-border-custom space-y-2">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-red-400" />
                    <span className="font-extrabold text-[11px] text-white">Inadimplentes ({overdue.length})</span>
                  </div>
                  {overdue.length === 0 ? (
                    <p className="text-[11px] text-text-sub">Todas as mensalidades em dia. 🎉</p>
                  ) : (
                    <div className="space-y-1">
                      {overdue.slice(0, 5).map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-white truncate">{o.student?.name ?? 'Aluno'}</span>
                          <span className="text-red-400 shrink-0 ml-2">venceu {fmtDate(o.dueDate)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================== ALUNOS — detalhe ====================== */}
        {activeTab === 'students' && detailStudent && (
          <StudentDetail
            student={detailStudent}
            onBack={() => {
              setDetailStudent(null);
              loadDashboard();
            }}
            onChat={(s) => {
              openConversation(s as ApiStudent);
              setActiveTab('chat');
            }}
          />
        )}

        {/* ====================== ALUNOS — lista ====================== */}
        {activeTab === 'students' && !detailStudent && (
          <div className="space-y-6 animate-fade-in">
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
                onClick={() => setShowInvite(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-4 font-bold rounded-xl text-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                style={{ backgroundColor: c.primary, color: c.accent }}
              >
                <UserPlus className="w-4 h-4" />
                Convidar aluno
              </button>
            </div>

            {studentsError && (
              <div className="flex items-center justify-between gap-3 text-xs rounded-xl px-4 py-3 border border-red-500/25 bg-red-500/10 text-red-300">
                <span>{studentsError}</span>
                <button onClick={loadStudents} className="font-bold underline hover:no-underline cursor-pointer shrink-0">
                  Tentar de novo
                </button>
              </div>
            )}

            {/* Fila de aprovação */}
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
                          style={{ backgroundColor: c.primary, color: c.accent }}
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

            {/* Lista de alunos (clique abre o detalhe completo) */}
            <div className="bg-bg-card border border-border-custom rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border-custom bg-black/10">
                <span className="text-xs font-bold text-text-sub uppercase tracking-wider">Alunos ({activeStudents.length})</span>
              </div>
              <div className="divide-y divide-border-custom">
                {loadingStudents ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : (
                  filteredActive.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => setDetailStudent(student)}
                      className="p-4 flex items-center justify-between hover:bg-white/2 transition-colors cursor-pointer"
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
                              ? { color: c.primary, backgroundColor: `${c.primary}1f` }
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
                {!loadingStudents && filteredActive.length === 0 && (
                  <div className="p-8 text-center text-text-sub text-xs">
                    {activeStudents.length === 0
                      ? 'Nenhum aluno ativo ainda. Aprove alunos na fila acima.'
                      : 'Nenhum aluno encontrado com este nome.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================== CHAT ====================== */}
        {activeTab === 'chat' && (
          <div className="bg-bg-card border border-border-custom rounded-2xl h-[530px] flex overflow-hidden shadow-md animate-fade-in">
            <div className="w-1/3 border-r border-border-custom flex flex-col bg-black/10">
              <div className="p-3 border-b border-border-custom">
                <span className="text-[10px] font-bold text-text-sub uppercase tracking-wider block">Conversas</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border-custom">
                {activeStudents.map((student) => {
                  const msgs = chatMessages[student.id];
                  const lastMsg = msgs && msgs.length ? msgs[msgs.length - 1]?.body : 'Sem mensagens...';
                  const unread = unreadFor(student.id);
                  const isSelected = selectedChatStudent?.id === student.id;
                  return (
                    <div
                      key={student.id}
                      onClick={() => openConversation(student)}
                      className={`p-3 cursor-pointer hover:bg-white/2 transition-colors ${isSelected ? 'bg-primary/3' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {initials(student.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-white truncate leading-none">{student.name}</h5>
                          <p className="text-[10px] text-text-sub truncate mt-1 leading-none">{lastMsg}</p>
                        </div>
                        {unread > 0 && (
                          <span
                            className="text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shrink-0"
                            style={{ backgroundColor: c.primary, color: c.accent }}
                          >
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {activeStudents.length === 0 && (
                  <div className="p-6 text-center text-text-sub text-xs">Nenhum aluno ativo.</div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedChatStudent ? (
                <>
                  <div className="px-4 py-3 border-b border-border-custom bg-black/25 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-white/5">
                      {initials(selectedChatStudent.name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white leading-none">{selectedChatStudent.name}</h4>
                      <span className="text-[9px] text-text-sub block mt-0.5">{titleCase(selectedChatStudent.goal)}</span>
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-black/5">
                    {(chatMessages[selectedChatStudent.id] || []).map((msg) => {
                      const isMe = msg.fromUserId === myUserId;
                      const time = msg.sentAt
                        ? new Date(msg.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : '';
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                              isMe ? 'text-accent' : 'bg-black/35 text-text-main border border-border-custom'
                            }`}
                            style={isMe ? { backgroundColor: c.primary, color: c.accent } : {}}
                          >
                            <p>{msg.body}</p>
                            <span
                              className="text-[8px] text-right mt-1.5 block opacity-60"
                              style={{ color: isMe ? c.accent : c.textSecondary }}
                            >
                              {time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {(chatMessages[selectedChatStudent.id] || []).length === 0 && (
                      <div className="text-center py-20 text-text-sub text-xs">Envie uma mensagem para iniciar a conversa.</div>
                    )}
                  </div>

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
                      style={{ backgroundColor: c.primary, color: c.accent }}
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

      {/* Modal: Convidar aluno */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-bg-card border border-border-custom rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 uppercase">
                <UserPlus className="w-4 h-4" style={{ color: c.primary }} />
                Convidar aluno
              </h3>
              <button onClick={() => setShowInvite(false)} className="text-text-sub hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-text-sub leading-relaxed">
              Peça para o aluno se cadastrar pelo link abaixo. Assim que ele criar a conta, aparecerá na sua{' '}
              <span className="text-white font-semibold">fila de aprovação</span> aqui na aba Alunos.
            </p>
            <div className="flex items-center gap-2 bg-black/30 border border-border-custom rounded-xl p-2">
              <span className="text-[11px] text-white truncate flex-1">{inviteLink}</span>
              <button
                onClick={copyInvite}
                className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer"
                style={{ backgroundColor: c.primary, color: c.accent }}
              >
                <Copy className="w-3 h-3" />
                {inviteCopied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav (mobile) */}
      <nav className="fixed bottom-0 inset-x-0 bg-bg-card/90 backdrop-blur-md border-t border-border-custom py-2 flex justify-around items-center z-40 md:hidden">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id ? 'font-bold' : 'text-text-sub hover:text-white'
              }`}
              style={activeTab === tab.id ? { color: c.primary } : {}}
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
