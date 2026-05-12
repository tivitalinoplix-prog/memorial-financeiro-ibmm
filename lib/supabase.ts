import { createClient } from '@supabase/supabase-js';

// Supabase client — funciona em browser e server
// Se as vars não estiverem configuradas, retorna null e o app usa fallback JSON
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client para uso no browser (anon key)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Client server-side com service role key (para edge functions e API routes)
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

// Helper para checar se Supabase está configurado
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Tipos das tabelas
export type TransactionRow = {
  id: string;
  date: string;         // ISO date YYYY-MM-DD
  description: string | null;
  amount: number;       // positivo = crédito, negativo = débito
  category: string | null;
  supplier: string | null;
  cnpj: string | null;
  document_source: string | null;
  cost_center: string | null;
  payment_method: string | null;
  account: string | null;
  entry_type: 'crédito' | 'débito' | null;
  operation_type: string | null;
  status: 'pendente' | 'confirmado' | 'rejeitado';
  confidence: number | null;
  source_type: 'ocr' | 'comunion' | 'manual' | 'csv_import' | 'json_import';
  created_at: string;
  raw_data: Record<string, unknown> | null;
};

export type ComunionSyncLog = {
  id: string;
  synced_at: string;
  account_id: number;
  account_name: string;
  date_from: string;
  date_to: string;
  total_found: number;
  new_inserted: number;
  duplicates_skipped: number;
  errors: string | null;
  status: 'success' | 'partial' | 'error';
};
