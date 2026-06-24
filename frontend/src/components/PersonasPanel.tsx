'use client';

import React, { useState, useEffect } from 'react';
import { supabase, API_URL } from '@/lib/supabaseClient';
import { useBrand } from '@/context/BrandContext';
import { Cpu, AlertCircle, Sparkles, Star } from 'lucide-react';

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

interface PersonasPanelProps {
  studentId: string | undefined;
}

/** Normaliza o score do backend (0–100) para um percentual seguro de exibir. */
function pct(score: number): number {
  if (typeof score !== 'number' || isNaN(score)) return 0;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export default function PersonasPanel({ studentId }: PersonasPanelProps) {
  const { brand } = useBrand();
  const [result, setResult] = useState<PersonasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) {
      setResult(null);
      return;
    }
    let active = true;
    const fetchPersonas = async () => {
      setLoading(true);
      setError('');
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(`${API_URL}/api/students/${studentId}/personas`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
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
  }, [studentId]);

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
        <Cpu className="w-5 h-5" style={{ color: brand.colors.primary }} />
        <div>
          <h4 className="font-extrabold text-xs uppercase leading-none">Motor de Personas v1</h4>
          <span className="text-[9px] text-text-sub font-semibold tracking-wider block mt-1">
            ALUNOS PARECIDOS · IA
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 text-text-sub gap-2">
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: brand.colors.primary, borderTopColor: 'transparent' }}
          />
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
          {/* Explicação geral da IA */}
          {result?.explanation && (
            <div className="flex gap-2 text-[11px] text-text-sub leading-relaxed bg-black/30 p-3 rounded-xl border border-border-custom">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: brand.colors.primary }} />
              <p>{result.explanation}</p>
            </div>
          )}

          {/* Lista de alunos parecidos */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {matches.map((m) => {
              const suggested = m.id === result?.suggestedStudentId;
              return (
                <div
                  key={m.id}
                  className="bg-black/25 border rounded-xl p-3 flex items-center justify-between gap-2"
                  style={{
                    borderColor: suggested ? brand.colors.primary : 'var(--border-custom, rgba(255,255,255,0.08))',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-white flex items-center gap-1 truncate">
                        {m.name}
                        {suggested && <Star className="w-3 h-3" style={{ color: brand.colors.primary }} />}
                      </span>
                      {suggested && (
                        <span className="text-[9px] font-semibold" style={{ color: brand.colors.primary }}>
                          Melhor match
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-black px-2 py-1 rounded shrink-0"
                    style={{ color: brand.colors.primary, backgroundColor: `${brand.colors.primary}1f` }}
                  >
                    {pct(m.score)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
