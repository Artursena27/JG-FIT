import { createClient } from '@supabase/supabase-js';

// Variaveis NEXT_PUBLIC_* sao embutidas no build (lado do cliente).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Cliente Supabase (auth no browser). */
export const supabase = createClient(url, anonKey);

/** URL base do backend (API NestJS). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
