'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatCurrencyShort } from '@/lib/mock-data';
import { transactions } from '@/lib/data-importer';
import { Search, Building2, ChevronRight, TrendingUp, FileText } from 'lucide-react';
import { DetailDrawer } from '@/components/DetailDrawer';
import { ExportToolbar } from '@/components/ExportToolbar';

export function SuppliersTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const suppliers = useMemo(() => {
    const map: Record<string, { name: string, totalSpent: number, txCount: number, categories: Set<string>, lastDate: string }> = {};
    
    transactions.forEach(t => {
      if (t.amount >= 0) return; // only expenses
      const key = t.description.substring(0, 30).trim();
      if (!map[key]) map[key] = { name: key, totalSpent: 0, txCount: 0, categories: new Set(), lastDate: '' };
      map[key].totalSpent += Math.abs(t.amount);
      map[key].txCount++;
      map[key].categories.add(t.category);
      if (t.date > map[key].lastDate) map[key].lastDate = t.date;
    });

    return Object.values(map)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .map((s, i) => ({
        ...s,
        id: i + 1,
        categories: Array.from(s.categories),
        riskLevel: s.totalSpent > 10000 ? 'high' : s.totalSpent > 3000 ? 'medium' : 'low'
      }));
  }, []);

  const filtered = suppliers.filter(s => {
    if (!searchTerm) return true;
    return s.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalVolume = suppliers.reduce((s, sup) => s + sup.totalSpent, 0);

  const exportData = filtered.map(s => ({
    'ID': s.id,
    'Fornecedor': s.name,
    'Volume Total': s.totalSpent,
    'Volume Text': formatCurrency(s.totalSpent),
    'Qtd Transações': s.txCount,
    'Ticket Médio': formatCurrency(s.totalSpent / s.txCount),
    'Última Atividade': s.lastDate,
    'Categorias': s.categories.join(', '),
    'Classificação Risco': s.riskLevel === 'high' ? 'Alto Volume' : s.riskLevel === 'medium' ? 'Médio Volume' : 'Baixo Volume'
  }));

  return (
    <div id="suppliers-dashboard" className="space-y-4 animate-slide-up">
      
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface border border-border p-3">
        <div>
          <h2 className="text-[13px] font-bold text-text-primary flex items-center gap-2 uppercase tracking-[0.05em]">
            <div className="w-1.5 h-4 bg-violet-500"></div>
            Diretório de Fornecedores
          </h2>
          <span className="text-[10px] text-text-ghost mt-1 block font-mono">
            {filtered.length} fornecedores catalogados | Volume total: {formatCurrencyShort(totalVolume)}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost" />
            <input 
              type="text" 
              placeholder="Buscar fornecedor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border pl-9 pr-4 py-2 text-[11px] text-text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-text-ghost font-mono"
            />
          </div>
          <ExportToolbar 
            containerId="suppliers-dashboard"
            data={exportData} 
            filename="Fornecedores_Diretorio" 
            title="Diretório de Fornecedores"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.slice(0, 18).map((sup) => (
          <div 
            key={sup.id}
            onClick={() => setSelectedSupplier(sup)}
            className="bg-card border border-border p-4 cursor-pointer hover:border-border-hover transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-surface border border-border flex items-center justify-center text-[10px] font-bold text-text-muted shrink-0">
                  {sup.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-text-primary truncate group-hover:text-primary transition-colors">{sup.name}</div>
                  <div className="text-[9px] text-text-ghost font-mono mt-0.5">{sup.txCount} transações</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-text-ghost opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-0.5">Volume Total</div>
                <div className="text-[14px] font-bold text-text-primary font-mono">{formatCurrencyShort(sup.totalSpent)}</div>
              </div>
              <div className={cn(
                "text-[9px] uppercase font-bold tracking-[0.05em] px-1.5 py-0.5",
                sup.riskLevel === 'high' ? "bg-rose-500/10 text-rose-400" :
                sup.riskLevel === 'medium' ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
              )}>
                {sup.riskLevel === 'high' ? 'Alto Vol.' : sup.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
              </div>
            </div>

            {/* Mini bar */}
            <div className="mt-3 h-0.5 bg-border overflow-hidden">
              <div 
                className={cn("h-full", sup.riskLevel === 'high' ? "bg-rose-500" : sup.riskLevel === 'medium' ? "bg-amber-500" : "bg-emerald-500")} 
                style={{ width: `${Math.min((sup.totalSpent / (suppliers[0]?.totalSpent || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Detail Drawer */}
      <DetailDrawer 
        isOpen={!!selectedSupplier} 
        onClose={() => setSelectedSupplier(null)}
        title={selectedSupplier?.name || ''}
        subtitle={`${selectedSupplier?.txCount || 0} transações registradas`}
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface border border-border p-3">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Volume Total</div>
                <div className="text-[14px] font-bold text-text-primary font-mono">{formatCurrency(selectedSupplier.totalSpent)}</div>
              </div>
              <div className="bg-surface border border-border p-3">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Transações</div>
                <div className="text-[14px] font-bold text-text-primary font-mono">{selectedSupplier.txCount}</div>
              </div>
              <div className="bg-surface border border-border p-3">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Ticket Médio</div>
                <div className="text-[13px] font-bold text-text-primary font-mono">
                  {formatCurrency(selectedSupplier.totalSpent / selectedSupplier.txCount)}
                </div>
              </div>
              <div className="bg-surface border border-border p-3">
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Última Tx</div>
                <div className="text-[12px] text-text-primary font-mono">{selectedSupplier.lastDate}</div>
              </div>
            </div>
            
            <div className="bg-surface border border-border p-3">
              <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-2">Categorias</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSupplier.categories.map((cat: string) => (
                  <span key={cat} className="text-[10px] bg-card border border-border text-text-secondary px-2 py-0.5 font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
