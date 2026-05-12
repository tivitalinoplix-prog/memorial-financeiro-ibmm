'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { transactions } from '@/lib/data-importer';
import { formatCurrency, formatCurrencyShort } from '@/lib/mock-data';
import { Search, Filter, Download, Database, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { ExportToolbar } from '@/components/ExportToolbar';

type SortField = 'date' | 'amount' | 'description' | 'source' | 'category';
type SortDir = 'asc' | 'desc';

export function ExtratosTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 100;

  const sources = useMemo(() => [...new Set(transactions.map(t => t.document_source))].sort(), []);
  const categories = useMemo(() => [...new Set(transactions.map(t => t.category))].sort(), []);

  const filtered = useMemo(() => {
    let data = [...transactions];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(t => 
        t.description.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term) ||
        String(t.amount).includes(term)
      );
    }
    if (filterSource) data = data.filter(t => t.document_source === filterSource);
    if (filterCategory) data = data.filter(t => t.category === filterCategory);
    if (filterType === 'credit') data = data.filter(t => t.amount > 0);
    if (filterType === 'debit') data = data.filter(t => t.amount < 0);

    data.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'amount': cmp = a.amount - b.amount; break;
        case 'description': cmp = a.description.localeCompare(b.description); break;
        case 'source': cmp = a.document_source.localeCompare(b.document_source); break;
        case 'category': cmp = a.category.localeCompare(b.category); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [searchTerm, sortField, sortDir, filterSource, filterType, filterCategory]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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

  const totalCredits = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalDebits = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  // Data map for export
  const exportData = filtered.map(t => ({
    'Data': t.date,
    'Descrição': t.description,
    'Categoria': t.category,
    'Fonte': t.document_source.replace('_PDF', ''),
    'Valor': t.amount,
    'Tipo': t.amount > 0 ? 'Crédito' : 'Débito'
  }));

  return (
    <div id="extratos-content" className="space-y-4 animate-slide-up">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-text-primary flex items-center gap-2" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            <div className="w-0.5 h-5 bg-primary"></div>
            HUD de Transações
          </h2>
          <span className="text-[10px] text-text-muted mt-0.5 inline-block font-mono">
            {filtered.length} lançamentos filtrados
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ExportToolbar 
            containerId="extratos-content" 
            filename="extratos_consolidados" 
            title="Extratos Consolidados" 
            data={exportData} 
          />
        </div>
      </div>

      {/* Advanced Filters & Summary Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
        
        {/* Filtros */}
        <div className="bg-card border border-border p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full bg-surface border border-border pl-9 pr-4 py-2 text-[11px] text-text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-text-ghost"
            />
          </div>
          
          <select 
            value={filterType} 
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="bg-surface border border-border text-text-secondary text-[11px] px-3 py-2 focus:outline-none focus:border-primary cursor-pointer appearance-none"
          >
            <option value="all">Todas as Operações</option>
            <option value="credit">Somente Entradas</option>
            <option value="debit">Somente Saídas</option>
          </select>

          <select 
            value={filterCategory} 
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="bg-surface border border-border text-text-secondary text-[11px] px-3 py-2 focus:outline-none focus:border-primary cursor-pointer appearance-none truncate"
          >
            <option value="">Todas Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={filterSource} 
            onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
            className="bg-surface border border-border text-text-secondary text-[11px] px-3 py-2 focus:outline-none focus:border-primary cursor-pointer appearance-none truncate"
          >
            <option value="">Todas Fontes</option>
            {sources.map(s => <option key={s} value={s}>{s.replace('_PDF', '')}</option>)}
          </select>
        </div>

        {/* Summary Mini-cards */}
        <div className="flex gap-3">
          <div className="bg-card border border-border p-3 min-w-[120px]">
            <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Entradas</div>
            <div className="text-[13px] font-bold text-emerald-400 font-mono tracking-tight">{formatCurrencyShort(totalCredits)}</div>
          </div>
          <div className="bg-card border border-border p-3 min-w-[120px]">
            <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Saídas</div>
            <div className="text-[13px] font-bold text-rose-400 font-mono tracking-tight">{formatCurrencyShort(totalDebits)}</div>
          </div>
          <div className="bg-card border border-border p-3 min-w-[120px]">
            <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Balanço</div>
            <div className={cn("text-[13px] font-bold font-mono tracking-tight", (totalCredits - totalDebits) >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {formatCurrencyShort(totalCredits - totalDebits)}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 350px)', minHeight: '350px' }}>
        <div className="overflow-auto flex-1">
          <table className="w-full text-left whitespace-nowrap brutal-table">
            <thead className="bg-background sticky top-0 z-10">
              <tr>
                <th className="w-8 text-center">#</th>
                <th className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('date')}>
                  Data {renderSortIcon('date')}
                </th>
                <th className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('description')}>
                  Descrição {renderSortIcon('description')}
                </th>
                <th className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('category')}>
                  Categoria {renderSortIcon('category')}
                </th>
                <th className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('source')}>
                  Fonte {renderSortIcon('source')}
                </th>
                <th className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('amount')}>
                  Valor {renderSortIcon('amount')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-text-ghost text-[12px]">Nenhuma transação encontrada com os filtros atuais.</td>
                </tr>
              ) : (
                paginated.map((t, i) => (
                  <tr key={i} className="hover:bg-primary/[0.03] group cursor-default transition-colors border-b border-border/50">
                    <td className="text-center text-text-ghost text-[10px] font-mono">{(page - 1) * ITEMS_PER_PAGE + i + 1}</td>
                    <td className="font-mono text-text-muted text-[11px]">{t.date}</td>
                    <td className="max-w-[280px]">
                      <div className="truncate text-[11px] text-text-primary font-medium group-hover:text-primary transition-colors">{t.description}</div>
                    </td>
                    <td className="text-text-muted text-[10px] uppercase tracking-[0.05em]">{t.category}</td>
                    <td className="text-text-ghost text-[10px] font-mono uppercase">{t.document_source.replace('_PDF', '')}</td>
                    <td className={cn("text-right text-[12px] font-bold font-mono", t.amount >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination HUD */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background shrink-0">
          <span className="text-[10px] text-text-muted font-mono tracking-widest uppercase">
            {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="px-3 py-1 border border-border text-[10px] uppercase tracking-[0.05em] text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-30 transition-colors font-bold">
              Ant
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className={cn("w-7 h-7 text-[10px] font-bold transition-colors border font-mono",
                    page === pageNum ? "bg-primary text-background border-primary" : "border-border text-text-muted hover:text-text-primary hover:bg-surface"
                  )}>
                  {pageNum}
                </button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="px-3 py-1 border border-border text-[10px] uppercase tracking-[0.05em] text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-30 transition-colors font-bold">
              Próx
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
