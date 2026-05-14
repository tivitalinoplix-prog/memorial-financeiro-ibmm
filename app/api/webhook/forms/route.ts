import { NextResponse } from 'next/server';
import { supabaseAdmin, TransactionRow } from '@/lib/supabase';

// Helper: converte dd/mm/yyyy para yyyy-mm-dd
function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // O Google Apps Script vai enviar o body estruturado
    const { 
      date, 
      description, 
      amount, 
      type, 
      category, 
      account, 
      status, 
      external_id,
      secret_token 
    } = body;

    // Segurança simples: validar token do webhook (ideal adicionar no env.local)
    const expectedToken = process.env.FORMS_WEBHOOK_SECRET || 'ibmm-forms-token-2026';
    if (secret_token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin Client not configured' }, { status: 500 });
    }

    // Processa os dados
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;
    
    const row: Omit<TransactionRow, 'id' | 'created_at'> = {
      date: formatDate(date),
      description: description || 'Inserido via Forms',
      amount: parsedAmount || 0,
      entry_type: type === 'Entrada' ? 'crédito' : 'débito',
      category: category || 'Outros',
      account: account || 'CAIXA_TESOURARIA',
      status: status === 'pending' ? 'pendente' : 'confirmado',
      source_type: 'manual',
      supplier: null,
      cnpj: null,
      document_source: null,
      cost_center: null,
      payment_method: null,
      operation_type: null,
      confidence: null,
      raw_data: { external_id: external_id || `forms-${Date.now()}` }
    };

    // Insere no banco com privilégios admin
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('Webhook insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Webhook catch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
