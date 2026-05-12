import unifiedDb from './data/unified_transactions.json';

export type TransactionSource = "TESOURARIA" | "SICOOB_CC" | "SICOOB_CREDITO" | "ITAU";

export interface UnifiedTransaction {
  id: string;
  date: string;
  year: number;
  month: number;
  month_label: string;
  account_source: string;
  account_group: string;
  document_source: string;
  entry_type: 'crédito' | 'débito';
  operation_type: string;
  category: string;
  description: string;
  counterparty: string;
  amount: number;
  amount_absolute: number;
  direction: 'in' | 'out';
  payment_method: string;
  raw_text: string;
  confidence: number;
  is_transfer: boolean;
  is_internal_transfer_candidate: boolean;
}

export const transactions: UnifiedTransaction[] = unifiedDb as UnifiedTransaction[];
