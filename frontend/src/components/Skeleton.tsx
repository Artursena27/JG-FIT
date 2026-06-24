'use client';

import React from 'react';

/**
 * Skeleton de carregamento (caixa pulsante) — reduz a percepção de espera e
 * elimina layout shift. Use no lugar de spinners.
 *
 * <Skeleton className="h-4 w-32" />            // uma barra
 * <Skeleton className="h-10 w-10 rounded-full" /> // avatar
 */
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}

/** Linha de lista com avatar + duas barras (ex.: item de aluno/conversa). */
export function SkeletonRow() {
  return (
    <div className="p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}

/** Card retangular genérico (ex.: KPI / painel). */
export function SkeletonCard({ className = 'h-28' }: { className?: string }) {
  return (
    <div className={`bg-bg-card border border-border-custom rounded-2xl p-5 ${className}`}>
      <div className="space-y-3">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-7 w-1/3" />
      </div>
    </div>
  );
}
