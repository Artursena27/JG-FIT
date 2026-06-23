'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandConfig } from '@/types/brand';

const defaultBrand: BrandConfig = {
  name: "João Guilherme",
  slogan: "UM PERSONAL TRAINER COM HISTÓRIA, ENERGIA E UM NOVO COMEÇO.",
  colors: {
    primary: "#c6ff00",       // Lime Green elétrico das imagens
    primaryHover: "#b5eb00",
    accent: "#020c1b",        // Deep Navy Blue principal
    bg: "#020c1b",            // Deep Navy Blue
    bgSecondary: "#051329",   // Lighter navy card
    border: "#0a2246",        // Navy border
    text: "#ffffff",
    textSecondary: "#6482a6", // Muted slate-blue text
  }
};

// Exemplo de outro personal configurado via query params ou seleção para teste do White Label
const alternativeBrands: Record<string, BrandConfig> = {
  'carlos-performance': {
    name: "Carlos Performance",
    slogan: "FORÇA E HIPERTROFIA MÁXIMA",
    colors: {
      primary: "#f97316",       // Laranja elétrico
      primaryHover: "#ea580c",
      accent: "#180c05",
      bg: "#0c0603",            // Preto com toque de marrom
      bgSecondary: "#140a05",   // Card escuro marrom
      border: "#2b140b",
      text: "#fafaf9",
      textSecondary: "#a8a29e",
    }
  },
  'lucas-hypertrophy': {
    name: "Lucas Hypertrophy",
    slogan: "CIÊNCIA APLICADA AO SEU TREINO",
    colors: {
      primary: "#06b6d4",       // Cyan/Azul elétrico
      primaryHover: "#0891b2",
      accent: "#051319",
      bg: "#02080a",            // Preto azulado profundo
      bgSecondary: "#051318",   // Card azulado
      border: "#0e2933",
      text: "#f8fafc",
      textSecondary: "#94a3b8",
    }
  }
};

interface BrandContextType {
  brand: BrandConfig;
  setBrandByName: (name: string) => void;
  availableBrands: string[];
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<BrandConfig>(defaultBrand);

  const setBrandByName = (name: string) => {
    if (alternativeBrands[name]) {
      setBrand(alternativeBrands[name]);
    } else {
      setBrand(defaultBrand);
    }
  };

  // Efeito para aplicar as variáveis CSS no :root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', brand.colors.primary);
    root.style.setProperty('--primary-hover', brand.colors.primaryHover);
    root.style.setProperty('--accent', brand.colors.accent);
    root.style.setProperty('--bg', brand.colors.bg);
    root.style.setProperty('--bg-secondary', brand.colors.bgSecondary);
    root.style.setProperty('--border', brand.colors.border);
    root.style.setProperty('--text', brand.colors.text);
    root.style.setProperty('--text-secondary', brand.colors.textSecondary);
  }, [brand]);

  // Permitir trocar a marca usando query strings na URL (ex: ?personal=carlos-performance)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const personal = params.get('personal');
      if (personal) {
        setBrandByName(personal);
      }
    }
  }, []);

  return (
    <BrandContext.Provider value={{ brand, setBrandByName, availableBrands: ['default', ...Object.keys(alternativeBrands)] }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand deve ser usado dentro de um BrandProvider');
  }
  return context;
}
