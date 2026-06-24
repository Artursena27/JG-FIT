'use client';

import React, { useState, useEffect } from 'react';
import { supabase, API_URL } from '@/lib/supabaseClient';
import { useBrand } from '@/context/BrandContext';
import { Cpu, AlertCircle } from 'lucide-react';

interface PersonasPanelProps {
  studentId: string | undefined;
}

export default function PersonasPanel({ studentId }: PersonasPanelProps) {
  const { brand } = useBrand();
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) {
      setPersonas([]);
      return;
    }

    const fetchPersonas = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${API_URL}/api/students/${studentId}/personas`, {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        });
        if (!res.ok) throw new Error('Falha ao buscar personas');
        const data = await res.json();
        
        console.log('--- PERSONAS API RESULT FOR STUDENT', studentId, '---');
        console.log(JSON.stringify(data, null, 2));
        
        // Formato esperado de acordo com a API: data.matches (Array) e data.student.
        // Adaptaremos dependendo de como logar
        setPersonas(data.matches || data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonas();
  }, [studentId]);

  if (!studentId) {
    return (
      <div className="bg-black/30 p-5 rounded-2xl border border-border-custom text-center text-xs text-text-sub flex flex-col items-center justify-center min-h-[200px]">
        <AlertCircle className="w-8 h-8 opacity-30 mb-2" />
        Selecione um aluno para analisar compatibilidade.
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-border-custom pb-3">
        <Cpu className="w-5 h-5" style={{ color: brand.colors.primary }} />
        <div>
          <h4 className="font-extrabold text-xs uppercase leading-none">Motor de Personas v1</h4>
          <span className="text-[9px] text-text-sub font-semibold tracking-wider block mt-1">INTELIGÊNCIA COLETIVA ATIVA</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 text-text-sub gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" style={{ borderColor: brand.colors.primary, borderTopColor: 'transparent' }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Analisando histórico...</span>
        </div>
      ) : error ? (
        <div className="text-red-400 text-xs p-3 bg-red-500/10 rounded-xl">{error}</div>
      ) : personas.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {personas.map((persona, idx) => (
            <div key={idx} className="bg-black/25 border border-border-custom rounded-xl p-3.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-white">
                  {persona.persona?.name || persona.name || 'Persona'}
                </span>
                <span className="text-[9px] font-black bg-primary/20 px-2 py-0.5 rounded" style={{ color: brand.colors.primary }}>
                  {persona.score ? Math.round(persona.score * 100) : persona.match || 0}%
                </span>
              </div>
              <div className="text-[10px] text-text-sub space-y-1.5">
                <p className="leading-relaxed bg-black/40 p-2 rounded-lg border border-border-custom">
                  {persona.explanation || 'Nenhuma explicação disponível.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-text-sub text-xs">Nenhuma persona similar encontrada ainda.</div>
      )}
    </div>
  );
}
