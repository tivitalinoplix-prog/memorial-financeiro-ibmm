'use client';

import React, { useState, useMemo, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { cn } from '@/lib/utils';
import { getTransactions, TransactionRow, updateTransaction } from '@/lib/db';
import { formatCurrency, formatCurrencyShort } from '@/lib/mock-data';
import { StatusBadge, StatusType } from '@/components/StatusBadge';
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Eye, Loader2, CheckCircle2, Sparkles, Camera, ImagePlus, FolderOpen, X } from 'lucide-react';
import { ExportToolbar } from '@/components/ExportToolbar';
import { toast } from 'sonner';

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
  const [filterStatus, setFilterStatus] = useState<'pendente' | 'confirmado'>('pendente');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions({ status: filterStatus });
      setTransactions(data);
    } catch (err) {
      console.error('Erro ao buscar Mesa de Cirurgia:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Busca inicial das transações (Mesa de Cirurgia = status "pendente")
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [filterStatus]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Compress image before upload to avoid Vercel 4.5MB limit and speed up upload
      let compressedFile = file;
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1, // Max 1MB
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.8,
        };
        try {
          compressedFile = await imageCompression(file, options);
          console.log(`[upload] Original: ${(file.size/1024/1024).toFixed(2)}MB -> Compressed: ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
        } catch (compErr) {
          console.error('[upload] Compression failed, using original file', compErr);
        }
      }

      const formData = new FormData();
      formData.append('comprovante', compressedFile, file.name);

      // Use local Next.js proxy to bypass CORS
      const response = await fetch('/api/upload-comprovante', {
        method: 'POST',
        body: formData,
      });

      // Read response body for detailed error info
      let responseBody: string;
      try {
        responseBody = await response.text();
      } catch {
        responseBody = '(não foi possível ler a resposta)';
      }

      if (!response.ok) {
        console.error('[upload] Proxy error:', response.status, responseBody);
        // Try to parse JSON error from our proxy
        let detail = responseBody;
        try {
          const parsed = JSON.parse(responseBody);
          detail = parsed.detail || parsed.error || responseBody;
        } catch { /* use raw text */ }
        throw new Error(`Status ${response.status}: ${detail}`);
      }

      alert('Comprovante enviado com sucesso! O sistema atualizará a lista em alguns segundos.');
      
      // Esperar alguns segundos para o n8n processar e salvar no Supabase
      setTimeout(() => {
        loadData();
      }, 5000);

    } catch (error: unknown) {
      console.error('Erro no upload:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      alert(`Erro ao enviar o comprovante.\n\nDetalhes: ${errMsg}\n\nVerifique se o n8n está ativo.`);
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
    if (t.status === 'confirmado') return 'regularizado';
    if (t.status === 'rejeitado') return 'falha';
    if (t.status === 'integrado') return 'integrado';
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

  const totalExpense = filtered.filter(t => (t.amount || 0) < 0 || t.type === 'saida').reduce((s, t) => s + Math.abs(t.amount || 0), 0);

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
          <div className="flex bg-surface border border-border p-0.5 rounded-sm">
            <button 
              onClick={() => { setFilterStatus('pendente'); setPage(1); }}
              className={cn("px-3 py-1 text-[10px] uppercase font-bold tracking-widest transition-colors", filterStatus === 'pendente' ? 'bg-primary text-white' : 'text-text-ghost hover:text-text-primary')}
            >Pendentes</button>
            <button 
              onClick={() => { setFilterStatus('confirmado'); setPage(1); }}
              className={cn("px-3 py-1 text-[10px] uppercase font-bold tracking-widest transition-colors", filterStatus === 'confirmado' ? 'bg-primary text-white' : 'text-text-ghost hover:text-text-primary')}
            >Aprovados</button>
          </div>
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

      {/* Main Layout Container */}
      <div id="surgery-dashboard" className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Column: List */}
        <div className="flex-1 w-full min-w-0 space-y-4">
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
              <div className="text-[12px] font-medium text-text-secondary">Nenhum registro encontrado!</div>
              <p className="text-[10px] max-w-xs">A lista para este status está vazia.</p>
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
                    <th className="text-center">Status</th>
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
                        {filterStatus === 'pendente' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold tracking-widest uppercase rounded-sm border border-amber-500/20">
                            Revisar
                          </span>
                        ) : (
                          <StatusBadge status={mapStatus(t)} />
                        )}
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
                      {filterStatus === 'pendente' ? (
                        <span className="text-amber-500">Revisar</span>
                      ) : (
                        <span className="text-emerald-500">Aprovado</span>
                      )}
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
      </div>

        {/* Right Column: Detail Panel */}
        {selectedTx && (
          <div className="w-full lg:w-96 shrink-0 bg-background border border-border flex flex-col sticky top-4 animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
              <div>
                <h3 className="text-[13px] font-bold text-text-primary">Contas a Pagar / Registrar</h3>
                <p className="text-[10px] text-text-ghost uppercase font-mono mt-0.5">Mesa de Cirurgia (Revisão da IA)</p>
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-text-ghost hover:text-text-primary hover:bg-background p-1.5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form key={selectedTx.id} className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }} onSubmit={async (e) => {
              e.preventDefault();
              setIsSaving(true);
              try {
                const fd = new FormData(e.currentTarget);
                let rawAmount = fd.get('amount') as string;
                // remove R$, spaces, dots. Replace comma with dot
                rawAmount = rawAmount.replace(/[R$\s\.]/g, '').replace(',', '.');
                const numericAmount = -Math.abs(parseFloat(rawAmount) || 0);

                await updateTransaction(selectedTx.id, {
                  account: fd.get('account') as string,
                  payment_method: fd.get('payment_method') as string,
                  cost_center: fd.get('cost_center') as string,
                  supplier: fd.get('supplier') as string,
                  reference: fd.get('reference') as string,
                  description: fd.get('description') as string,
                  date: fd.get('date') as string,
                  amount: numericAmount,
                  type: 'saida',
                  status: 'confirmado',
                });
                toast.success('Aprovado e registrado no banco com sucesso!');
                loadData();
                setSelectedTx(null);
              } catch (err) {
                toast.error(`Erro ao aprovar: ${err}`);
              } finally {
                setIsSaving(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-rose-500 uppercase tracking-[0.08em] font-bold mb-1">* Caixa</div>
                  <input name="caixa_mock" type="text" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue="CAIXA TESOURARIA" disabled />
                </div>
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-rose-500 uppercase tracking-[0.08em] font-bold mb-1">* Conta</div>
                  <input name="account" type="text" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue={selectedTx.account || ''} required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Número</div>
                  <input name="reference" type="text" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue={selectedTx.reference || selectedTx.external_id || ''} />
                </div>
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-rose-500 uppercase tracking-[0.08em] font-bold mb-1">* Operação</div>
                  <select name="payment_method" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue={selectedTx.payment_method?.toLowerCase() || 'pix'}>
                    <option value="debito">Débito em Conta</option>
                    <option value="credito">Crédito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Centro de Custo</div>
                  <input name="cost_center" type="text" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue={selectedTx.cost_center || selectedTx.category || ''} />
                </div>
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Fornecedor</div>
                  <input name="supplier" type="text" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue={selectedTx.supplier || ''} />
                </div>
              </div>

              <div className="bg-surface border border-border p-3">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Descrição</div>
                <textarea name="description" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1 resize-none h-16" defaultValue={selectedTx.description || ''}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-rose-500 uppercase tracking-[0.08em] font-bold mb-1">* Vencimento</div>
                  <input name="date" type="date" className="w-full bg-transparent text-[12px] text-text-primary border-b border-border focus:border-primary outline-none py-1" defaultValue={selectedTx.date} required />
                </div>
                <div className="bg-surface border border-border p-3">
                  <div className="text-[9px] text-rose-500 uppercase tracking-[0.08em] font-bold mb-1">* Valor</div>
                  <input name="amount" type="text" className="w-full bg-transparent text-[14px] font-bold font-mono text-rose-400 border-b border-border focus:border-primary outline-none py-1" defaultValue={formatCurrency(Math.abs(selectedTx.amount || 0))} required />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 px-1">
                <input type="checkbox" id="recorrencia" className="w-4 h-4 accent-primary rounded border-border" />
                <label htmlFor="recorrencia" className="text-[11px] text-text-primary font-medium">Recorrência</label>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex gap-3">
                <button type="submit" disabled={isSaving} className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 text-[11px] transition-colors tracking-widest uppercase flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
                  {isSaving ? 'Salvando...' : 'Salvar (Comunion)'}
                </button>
                <button type="button" disabled={isSaving} className="flex-1 bg-surface border border-border text-text-primary hover:bg-border font-bold py-3 text-[11px] transition-colors tracking-widest uppercase" onClick={() => setSelectedTx(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
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
        onClick={() => setShowSourceMenu(true)}
        disabled={isUploading}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-50",
          isUploading && "opacity-70 pointer-events-none"
        )}
      >
        <Camera className="w-6 h-6" />
      </button>

      {/* Source Selection Action Sheet */}
      {showSourceMenu && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={() => setShowSourceMenu(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {/* Menu */}
          <div
            className="relative w-full max-w-md mx-4 mb-6 bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-[13px] font-bold text-text-primary uppercase tracking-widest">Enviar Comprovante</span>
              <button onClick={() => setShowSourceMenu(false)} className="text-text-ghost hover:text-text-primary p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-3 pb-4 space-y-1">
              {/* Camera Traseira */}
              <button
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-primary/10 transition-colors text-left"
                onClick={() => {
                  setShowSourceMenu(false);
                  if (cameraInputRef.current) {
                    cameraInputRef.current.setAttribute('capture', 'environment');
                    cameraInputRef.current.click();
                  }
                }}
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-[12px] font-bold text-text-primary">Tirar Foto</div>
                  <div className="text-[10px] text-text-ghost">Usar câmera traseira</div>
                </div>
              </button>
              {/* Galeria */}
              <button
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-primary/10 transition-colors text-left"
                onClick={() => {
                  setShowSourceMenu(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-[12px] font-bold text-text-primary">Galeria de Fotos</div>
                  <div className="text-[10px] text-text-ghost">Escolher imagem da galeria</div>
                </div>
              </button>
              {/* Arquivo */}
              <button
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-primary/10 transition-colors text-left"
                onClick={() => {
                  setShowSourceMenu(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('accept', 'image/*,.pdf');
                    fileInputRef.current.click();
                    // Reset accept after a tick
                    setTimeout(() => {
                      if (fileInputRef.current) fileInputRef.current.setAttribute('accept', 'image/*');
                    }, 500);
                  }
                }}
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-[12px] font-bold text-text-primary">Arquivo / PDF</div>
                  <div className="text-[10px] text-text-ghost">Selecionar documento do aparelho</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      {/* Gallery / File picker (no capture) */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileUpload}
        className="hidden" 
      />
      {/* Camera input (with capture) */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={cameraInputRef} 
        onChange={handleFileUpload}
        className="hidden" 
      />
    </div>
  );
}
