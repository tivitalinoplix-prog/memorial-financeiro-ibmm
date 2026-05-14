'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getTransactions, TransactionRow } from '@/lib/db';
import { formatCurrency, formatCurrencyShort } from '@/lib/mock-data';
import { StatusBadge, StatusType } from '@/components/StatusBadge';
import { DetailDrawer } from '@/components/DetailDrawer';
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Eye, Loader2, CheckCircle2, Sparkles, Camera } from 'lucide-react';
import { ExportToolbar } from '@/components/ExportToolbar';

type SortField = 'date' | 'amount' | 'supplier' | 'category';
type SortDir = 'asc' | 'desc';

export function SurgeryTab() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedTx, setSelectedTx] = useState<TransactionRow | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions({ status: 'pending' });
      setTransactions(data);
    } catch (err) {
      console.error('Erro ao buscar Mesa de Cirurgia:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Busca inicial das transações (Mesa de Cirurgia = status "pending")
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('comprovante', file);

      // Webhook n8n production URL
      const response = await fetch('https://vitalino.app.n8n.cloud/webhook/comprovantes-2026', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha ao processar a imagem no n8n');
      }

      alert('Comprovante enviado com sucesso! O sistema atualizará a lista em alguns segundos.');
      
      // Esperar alguns segundos para o n8n processar e salvar no Supabase
      setTimeout(() => {
        loadData();
      }, 5000);

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar o comprovante. Verifique se o n8n está ativo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const categories = useMemo(() => [...new Set(transactions.map(t => t.category || 'Outros'))].sort(), [transactions]);
  const sources = useMemo(() => [...new Set(transactions.map(t => t.account || 'Desconhecido'))].sort(), [transactions]);

  const filtered = useMemo(() => {
    let data = [...transactions];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(t => 
        (t.description?.toLowerCase() || '').includes(term) ||
        (t.category?.toLowerCase() || '').includes(term) ||
        (t.account?.toLowerCase() || '').includes(term)
      );
    }
    if (filterCategory) data = data.filter(t => (t.category || 'Outros') === filterCategory);
    if (filterSource) data = data.filter(t => (t.account || 'Desconhecido') === filterSource);

    data.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'amount': cmp = Math.abs(a.amount || 0) - Math.abs(b.amount || 0); break;
        case 'supplier': cmp = (a.description || '').localeCompare(b.description || ''); break;
        case 'category': cmp = (a.category || '').localeCompare(b.category || ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [transactions, searchTerm, sortField, sortDir, filterCategory, filterSource]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const mapStatus = (t: TransactionRow): StatusType => {
    // Como a Mesa de Cirurgia puxa 'pending', tudo aqui precisa de revisão
    return 'pendente';
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const renderSortIcon = (field: SortField) => (
    <span className={cn("inline-flex ml-1", sortField === field ? "text-primary" : "text-text-ghost")}>
      {sortField === field ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
    </span>
  );

  const totalExpense = filtered.filter(t => (t.amount || 0) < 0 || t.entry_type === 'débito').reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  const selectClass = "bg-surface border border-border text-text-secondary text-[10px] px-2 py-1.5 focus:outline-none focus:border-primary cursor-pointer appearance-none";

  const exportData = useMemo(() => {
    return filtered.map(t => ({
      'Data': t.date,
      'Descrição': t.description,
      'Categoria': t.category,
      'Conta/Origem': t.account,
      'Valor Numeric': t.amount,
      'Valor Formatado': formatCurrency(t.amount || 0),
      'Status': mapStatus(t)
    }));
  }, [filtered]);

  return (
    <div id="surgery-content" className="space-y-4 animate-slide-up">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface border border-border p-3">
        <div>
          <h2 className="text-[13px] font-bold text-text-primary flex items-center gap-2 uppercase tracking-[0.05em]">
            <div className="w-1.5 h-4 bg-rose-500 animate-pulse"></div>
            Mesa de Cirurgia (Revisão de IA)
          </h2>
          <span className="text-[10px] text-text-ghost mt-1 block font-mono">
            {isLoading ? 'Conectando ao Supabase...' : `${filtered.length} transações aguardando aprovação | Extrator n8n`}
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">Todas Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">Todas Fontes</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ExportToolbar 
            containerId="surgery-dashboard"
            data={exportData}
            filename="Mesa_Cirurgia_Aprovacoes" 
            title="Relatório de Mesa de Cirurgia" 
          />
        </div>
      </div>

      {/* Summary Bar */}
      <div id="surgery-dashboard" className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border p-3 relative overflow-hidden">
            <Sparkles className="absolute -right-2 -bottom-2 w-12 h-12 text-primary/5" />
            <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Passivo Processado (IA)</div>
            <div className="text-sm font-bold text-rose-400 font-mono">{formatCurrencyShort(totalExpense)}</div>
          </div>
          <div className="bg-card border border-border p-3">
            <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Ação Requerida</div>
            <div className="text-sm font-bold text-amber-400 font-mono">{filtered.length} Itens</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost" />
          <input 
            type="text" 
            placeholder="Buscar por descrição, categoria, origem..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-surface border border-border pl-9 pr-4 py-2 text-[11px] text-text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-text-ghost"
          />
        </div>

        {/* Table */}
        <div className="bg-card border border-border overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 380px)', minHeight: '350px' }}>
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-ghost gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-[11px] font-mono uppercase tracking-widest">Sincronizando...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-ghost gap-3 p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
              <div className="text-[12px] font-medium text-text-secondary">Mesa de Cirurgia Limpa!</div>
              <p className="text-[10px] max-w-xs">Nenhum comprovante pendente no Supabase. Os fluxos da IA foram aprovados ou estão vazios.</p>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              {/* Desktop Table */}
              <table className="w-full text-left whitespace-nowrap hidden lg:table brutal-table">
                <thead className="bg-background sticky top-0 z-10">
                  <tr>
                    <th className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('date')}>
                      Data {renderSortIcon('date')}
                    </th>
                    <th className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('supplier')}>
                      Descrição Analisada {renderSortIcon('supplier')}
                    </th>
                    <th className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('category')}>
                      Categoria {renderSortIcon('category')}
                    </th>
                    <th>Origem (Conta)</th>
                    <th className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('amount')}>
                      Valor {renderSortIcon('amount')}
                    </th>
                    <th className="text-center">Ação Requerida</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t, i) => (
                    <tr key={t.id || i} className="hover:bg-primary/[0.03] group cursor-pointer transition-colors" onClick={() => setSelectedTx(t)}>
                      <td className="font-mono text-text-muted text-[11px]">{t.date}</td>
                      <td className="max-w-[250px]">
                        <div className="truncate text-[12px] text-text-primary font-medium group-hover:text-primary transition-colors">
                          {t.description || 'Sem descrição'}
                        </div>
                      </td>
                      <td className="text-text-muted text-[11px]">{t.category || 'N/A'}</td>
                      <td className="text-text-ghost text-[10px] font-mono uppercase">
                        {t.account || 'Desconhecida'}
                      </td>
                      <td className={cn("text-right text-[12px] font-bold font-mono", (t.amount || 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {formatCurrency(t.amount || 0)}
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold tracking-widest uppercase rounded-sm border border-amber-500/20">
                          Revisar
                        </span>
                      </td>
                      <td>
                        <button className="p-1 text-text-ghost hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile List */}
              <div className="lg:hidden flex flex-col divide-y divide-border">
                {paginated.map((t, i) => (
                  <div key={t.id || i} className="p-4 hover:bg-surface transition-colors cursor-pointer" onClick={() => setSelectedTx(t)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="truncate text-[12px] text-text-primary font-medium flex-1 mr-3">{t.description}</div>
                      <div className={cn("text-[12px] font-bold font-mono shrink-0", (t.amount || 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {formatCurrency(t.amount || 0)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-text-muted">
                      <span className="font-mono">{t.date}</span>
                      <span className="text-amber-500">Revisar</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background shrink-0">
              <span className="text-[10px] text-text-muted font-mono">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                  className="px-2.5 py-1 border border-border text-[10px] text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-30 transition-colors font-medium">
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={cn("w-7 h-7 text-[10px] font-bold transition-colors",
                        page === pageNum ? "bg-primary/10 text-primary border border-primary/30" : "border border-border text-text-muted hover:text-text-primary hover:bg-surface"
                      )}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                  className="px-2.5 py-1 border border-border text-[10px] text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-30 transition-colors font-medium">
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Drawer */}
        <DetailDrawer 
          isOpen={!!selectedTx} 
          onClose={() => setSelectedTx(null)}
          title="Contas a Pagar / Registrar"
          subtitle={selectedTx ? `Mesa de Cirurgia (Revisão da IA)` : ''}
        >
          {selectedTx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-rose-500 uppercase tracking-[0.08em] font-bold mb-1">* Caixa</div>
                  <input type="text" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue="Caixa Geral" />
                </div>
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-rose-500 uppercase tracking-[0.08em] font-bold mb-1">* Conta</div>
                  <input type="text" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue={selectedTx.account || ''} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Número</div>
                  <input type="text" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" placeholder="Opcional" />
                </div>
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-rose-500 uppercase tracking-[0.08em] font-bold mb-1">* Operação</div>
                  <select className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1">
                    <option value="debito">Débito em Conta</option>
                    <option value="credito">Crédito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Centro de Custo</div>
                  <input type="text" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue={selectedTx.category || ''} />
                </div>
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Fornecedor</div>
                  <input type="text" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue="" />
                </div>
              </div>

              <div className="bg-surface border border-border p-3">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Documento / Descrição</div>
                <textarea className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1 resize-none h-16" defaultValue={selectedTx.description || ''}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-rose-500 uppercase tracking-[0.08em] font-bold mb-1">* Vencimento</div>
                  <input type="date" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue={selectedTx.date} />
                </div>
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-rose-500 uppercase tracking-[0.08em] font-bold mb-1">* Valor</div>
                  <input type="text" className="w-full bg-transparent text-[14px] font-bold font-mono text-rose-400 border-b border-border focus:border-primary outline-none py-1" defaultValue={formatCurrency(Math.abs(selectedTx.amount || 0))} />
                </div>
              </div>

              {/* Botão de Aprovação Mockado para a próxima fase */}
              <div className="mt-6 pt-4 border-t border-border flex gap-3">
                <button className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 text-[11px] transition-colors tracking-widest uppercase flex items-center justify-center gap-2" onClick={() => {
                  alert('Aprovado! Na próxima fase o Robô RPA enviará isto ao Eclésia.');
                  setSelectedTx(null);
                }}>
                  <CheckCircle2 className="w-4 h-4" /> Registrar no Comunion
                </button>
                <button className="flex-1 bg-surface border border-border text-text-primary hover:bg-border font-bold py-3 text-[11px] transition-colors tracking-widest uppercase" onClick={() => setSelectedTx(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </DetailDrawer>
      </div>

      {/* Uploading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <div className="text-[14px] font-bold text-text-primary uppercase tracking-widest">Enviando para a IA</div>
          <div className="text-[11px] text-text-ghost font-mono mt-2">Processando imagem via Google Gemini...</div>
        </div>
      )}

      {/* FAB - Floating Action Button for Scanner */}
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-50",
          isUploading && "opacity-70 pointer-events-none"
        )}
      >
        <Camera className="w-6 h-6" />
      </button>

      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleFileUpload}
        className="hidden" 
      />
    </div>
  );
}
