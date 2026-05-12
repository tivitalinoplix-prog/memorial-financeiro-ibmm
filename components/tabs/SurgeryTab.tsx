'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { transactions } from '@/lib/data-importer';
import { formatCurrency, formatCurrencyShort } from '@/lib/mock-data';
import { StatusBadge, StatusType } from '@/components/StatusBadge';
import { DetailDrawer } from '@/components/DetailDrawer';
import { Search, Filter, ChevronDown, ChevronUp, Download, ArrowUpDown, CheckCircle2, Clock, AlertCircle, Eye } from 'lucide-react';

type SortField = 'date' | 'amount' | 'supplier' | 'category';
type SortDir = 'asc' | 'desc';

export function SurgeryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const categories = useMemo(() => [...new Set(transactions.map(t => t.category))].sort(), []);
  const sources = useMemo(() => [...new Set(transactions.map(t => t.document_source))].sort(), []);

  const filtered = useMemo(() => {
    let data = [...transactions];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(t => 
        t.description.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term) ||
        t.document_source.toLowerCase().includes(term)
      );
    }
    if (filterCategory) data = data.filter(t => t.category === filterCategory);
    if (filterSource) data = data.filter(t => t.document_source === filterSource);

    data.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'amount': cmp = Math.abs(a.amount) - Math.abs(b.amount); break;
        case 'supplier': cmp = a.description.localeCompare(b.description); break;
        case 'category': cmp = a.category.localeCompare(b.category); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [searchTerm, sortField, sortDir, filterCategory, filterSource]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const mapStatus = (t: any): StatusType => {
    if (t.amount > 0) return 'regularizado';
    if (Math.abs(t.amount) > 5000) return 'divergente';
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

  const totalIncome = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const selectClass = "bg-surface border border-border text-text-secondary text-[10px] px-2 py-1.5 focus:outline-none focus:border-primary cursor-pointer appearance-none";

  return (
    <div className="space-y-4 animate-slide-up">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-bold text-text-primary flex items-center gap-2">
            <div className="w-0.5 h-4 bg-rose-500"></div>
            Mesa de Cirurgia
          </h2>
          <span className="text-[10px] text-text-muted mt-0.5 inline-block font-mono">{filtered.length} transações · {totalPages} páginas</span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">Todas Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">Todas Fontes</option>
            {sources.map(s => <option key={s} value={s}>{s.replace('_PDF', '')}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border p-3">
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Entradas</div>
          <div className="text-sm font-bold text-emerald-400 font-mono">{formatCurrencyShort(totalIncome)}</div>
        </div>
        <div className="bg-card border border-border p-3">
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Saídas</div>
          <div className="text-sm font-bold text-rose-400 font-mono">{formatCurrencyShort(totalExpense)}</div>
        </div>
        <div className="bg-card border border-border p-3">
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Resultado</div>
          <div className={cn("text-sm font-bold font-mono", (totalIncome - totalExpense) >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {formatCurrencyShort(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost" />
        <input 
          type="text" 
          placeholder="Buscar na mesa de cirurgia..." 
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="w-full bg-surface border border-border pl-9 pr-4 py-2 text-[11px] text-text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-text-ghost"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 380px)', minHeight: '350px' }}>
        <div className="overflow-auto flex-1">
          {/* Desktop Table */}
          <table className="w-full text-left whitespace-nowrap hidden lg:table brutal-table">
            <thead className="bg-background sticky top-0 z-10">
              <tr>
                <th className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('date')}>
                  Data {renderSortIcon('date')}
                </th>
                <th className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('supplier')}>
                  Descrição {renderSortIcon('supplier')}
                </th>
                <th className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('category')}>
                  Categoria {renderSortIcon('category')}
                </th>
                <th>Fonte</th>
                <th className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('amount')}>
                  Valor {renderSortIcon('amount')}
                </th>
                <th className="text-center">Status</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((t, i) => (
                <tr key={i} className="hover:bg-primary/[0.03] group cursor-pointer transition-colors" onClick={() => setSelectedTx(t)}>
                  <td className="font-mono text-text-muted text-[11px]">{t.date}</td>
                  <td className="max-w-[250px]">
                    <div className="truncate text-[12px] text-text-primary font-medium group-hover:text-primary transition-colors">{t.description}</div>
                  </td>
                  <td className="text-text-muted text-[11px]">{t.category}</td>
                  <td className="text-text-ghost text-[10px] font-mono uppercase">{t.document_source.replace('_PDF', '')}</td>
                  <td className={cn("text-right text-[12px] font-bold font-mono", t.amount >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="text-center"><StatusBadge status={mapStatus(t)} /></td>
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
              <div key={i} className="p-4 hover:bg-surface transition-colors cursor-pointer" onClick={() => setSelectedTx(t)}>
                <div className="flex justify-between items-start mb-2">
                  <div className="truncate text-[12px] text-text-primary font-medium flex-1 mr-3">{t.description}</div>
                  <div className={cn("text-[12px] font-bold font-mono shrink-0", t.amount >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {formatCurrency(t.amount)}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-text-muted">
                  <span className="font-mono">{t.date}</span>
                  <StatusBadge status={mapStatus(t)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
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
      </div>

      {/* Detail Drawer */}
      <DetailDrawer 
        isOpen={!!selectedTx} 
        onClose={() => setSelectedTx(null)}
        title="Detalhe da Transação"
        subtitle={selectedTx ? `${selectedTx.document_source}` : ''}
      >
        {selectedTx && (
          <div className="space-y-4">
            <div className="p-4 bg-surface border border-border">
              <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-2">Descrição</div>
              <div className="text-[12px] text-text-primary font-medium leading-relaxed">{selectedTx.description}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface border border-border p-3">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Data</div>
                <div className="text-[12px] text-text-primary font-mono">{selectedTx.date}</div>
              </div>
              <div className="bg-surface border border-border p-3">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Valor</div>
                <div className={cn("text-[14px] font-bold font-mono", selectedTx.amount >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {formatCurrency(selectedTx.amount)}
                </div>
              </div>
              <div className="bg-surface border border-border p-3">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Categoria</div>
                <div className="text-[12px] text-text-primary">{selectedTx.category}</div>
              </div>
              <div className="bg-surface border border-border p-3">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Período</div>
                <div className="text-[12px] text-text-primary">{selectedTx.month_label}</div>
              </div>
              <div className="bg-surface border border-border p-3 col-span-2">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Status</div>
                <StatusBadge status={mapStatus(selectedTx)} />
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
