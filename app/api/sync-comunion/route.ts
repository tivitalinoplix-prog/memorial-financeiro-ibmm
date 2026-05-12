/**
 * app/api/sync-comunion/route.ts
 * Endpoint scraping Comunión/Eclese
 * 
 * MAPEAMENTO: https://eclese.com/FINANCIAL/Lancamento/List/{caixaId}
 * ITAU=1, CAIXA_TESOURARIA=2, SICOOB=3, CARTAO_SICOOB=4
 */

import { NextRequest, NextResponse } from 'next/server';
import { upsertTransactions } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ACCOUNT_IDS = { ITAU: 1, CAIXA_TESOURARIA: 2, SICOOB: 3, CARTAO_SICOOB: 4 } as const;

type SyncRequest = { accountId?: number; dateFrom?: string; dateTo?: string; mode?: 'test' | 'full'; };

export async function POST(req: NextRequest) {
  try {
    const body: SyncRequest = await req.json();
    const { accountId = ACCOUNT_IDS.CAIXA_TESOURARIA, dateFrom, dateTo, mode = 'test' } = body;

    // TODO: Implementar scraping real com Puppeteer
    // 1. Login Eclese, 2. Navegar /FINANCIAL/Lancamento/List/{accountId}
    // 3. Filtrar datas, 4. Iterar paginação, 5. Extrair & upsert

    return NextResponse.json({
      success: true,
      account_id: accountId,
      date_range: `${dateFrom} - ${dateTo}`,
      mode,
      message: 'Mock - implement scraping',
      data: { found: 0, inserted: 0, duplicates: 0, errors: [] },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
