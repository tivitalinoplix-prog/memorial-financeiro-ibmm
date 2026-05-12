/**
 * lib/db.ts — Data layer abstraction
 * Prioridade: Supabase > JSON estático
 * Se NEXT_PUBLIC_SUPABASE_URL não estiver configurado, usa o JSON local como fallback.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import type { TransactionRow } from './supabase';

// Importa o JSON estático como fallback
import unifiedDb from './data/unified_transactions.json';
import type { UnifiedTransaction } from './data-importer';

// ---- Tipos exportados ------------------------------------------------
export type { TransactionRow } from './supabase';

// ---- Helpers de normalização ----------------------------------------

/**
 * Converte registro UnifiedTransaction (JSON) para o formato TransactionRow (Supabase).
 */
export function jsonToTransactionRow(t: UnifiedTransaction): TransactionRow {
  const isoDate = (() => {
    // Formatos possíveis: DD/MM/YYYY, YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(t.date)) return t.date.slice(0, 10);
    const [d, m, y] = t.date.split('/');
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  })();
  return {
    id: t.id,
    date: isoDate,
    description: t.description ?? null,
    amount: t.entry_type === 'débito' ? -Math.abs(t.amount_absolute) : Math.abs(t.amount_absolute),
    category: t.category ?? null,
    supplier: t.counterparty ?? null,
    cnpj: null,
    document_source: t.document_source ?? null,
    cost_center: null,
    payment_method: t.payment_method ?? null,
    account_source: t.account_source ?? null,
    entry_type: t.entry_type ?? null,
    operation_type: t.operation_type ?? null,
    status: 'confirmado',
    confidence: t.confidence ?? null,
    source_type: 'json_import',
    created_at: new Date().toISOString(),
    raw_data: t as unknown as Record<string, unknown>,
  };
}

// ---- Leitura de transações ------------------------------------------

/**
 * Retorna todas as transações.
 * Se Supabase estiver configurado, busca de lá; senão usa JSON estático.
 */
export async function getTransactions(opts?: {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
  status?: string;
}): Promise<TransactionRow[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (opts?.dateFrom) query = query.gte('date', opts.dateFrom);
    if (opts?.dateTo)   query = query.lte('date', opts.dateTo);
    if (opts?.source)   query = query.eq('source_type', opts.source);
    if (opts?.status)   query = query.eq('status', opts.status);
    if (opts?.limit)    query = query.limit(opts.limit);
    if (opts?.offset)   query = (query as ReturnType<typeof supabase.from>).range(
      opts.offset, (opts.offset + (opts.limit ?? 100) - 1)
    );

    const { data, error } = await query;
    if (error) {
      console.error('[db] Supabase error:', error.message);
      return fallbackToJson(opts);
    }
    return data as TransactionRow[];
  }
  return fallbackToJson(opts);
}

function fallbackToJson(opts?: {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}): TransactionRow[] {
  let rows = (unifiedDb as UnifiedTransaction[]).map(jsonToTransactionRow);
  if (opts?.dateFrom) rows = rows.filter(r => r.date >= opts!.dateFrom!);
  if (opts?.dateTo)   rows = rows.filter(r => r.date <= opts!.dateTo!);
  rows.sort((a, b) => b.date.localeCompare(a.date));
  if (opts?.offset) rows = rows.slice(opts.offset);
  if (opts?.limit)  rows = rows.slice(0, opts.limit);
  return rows;
}

// ---- Escrita de transações -----------------------------------------

/**
 * Insere uma transação nova no Supabase.
 * Retorna o registro inserido ou lança erro se Supabase não estiver configurado.
 */
export async function insertTransaction(
  row: Omit<TransactionRow, 'id' | 'created_at'>
): Promise<TransactionRow> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase
    .from('transactions')
    .insert([row])
    .select()
    .single();
  if (error) throw new Error(`[db] Insert error: ${error.message}`);
  return data as TransactionRow;
}

/**
 * Upsert em lote — usa chave composta (date + amount + description + account_source) para deduplicar.
 * Retorna { inserted, duplicates }.
 */
export async function upsertTransactions(
  rows: Omit<TransactionRow, 'id' | 'created_at'>[]
): Promise<{ inserted: number; duplicates: number; errors: string[] }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não configurado.');
  }

  const errors: string[] = [];
  let inserted = 0;
  let duplicates = 0;

  // Batch em grupos de 50 para evitar limites da API
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    // onConflict na chave composta — a constraint será criada na migration SQL
    const { data, error } = await supabase
      .from('transactions')
      .upsert(batch, {
        onConflict: 'date,amount,description,account_source',
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      errors.push(error.message);
    } else {
      inserted += (data?.length ?? 0);
      duplicates += batch.length - (data?.length ?? 0);
    }
  }

  return { inserted, duplicates, errors };
}

// ---- Estatísticas rápidas ------------------------------------------

export async function getStats(): Promise<{
  total: number;
  pendentes: number;
  porFonte: Record<string, number>;
}> {
  if (isSupabaseConfigured && supabase) {
    const [total, pendentes, porFonte] = await Promise.all([
      supabase.from('transactions').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
      supabase.from('transactions').select('source_type'),
    ]);
    const fonteMap: Record<string, number> = {};
    (porFonte.data ?? []).forEach((r: { source_type: string }) => {
      fonteMap[r.source_type] = (fonteMap[r.source_type] ?? 0) + 1;
    });
    return {
      total: total.count ?? 0,
      pendentes: pendentes.count ?? 0,
      porFonte: fonteMap,
    };
  }
  // Fallback JSON
  return {
    total: (unifiedDb as UnifiedTransaction[]).length,
    pendentes: 0,
    porFonte: { json_import: (unifiedDb as UnifiedTransaction[]).length },
  };
}
