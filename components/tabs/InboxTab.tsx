'use client';

import React, { useState, useCallback } from 'react';
import { DEMO_DATA, formatCurrency } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Search, Check, X, Eye, Upload, FileText, Loader2, Brain } from 'lucide-react';
import { StatusBadge, StatusType } from '@/components/StatusBadge';
import { DetailDrawer } from '@/components/DetailDrawer';
import { ExportToolbar } from '@/components/ExportToolbar';
import { NoteReader } from '@/components/NoteReader';
import { toast } from 'sonner';

export function InboxTab() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [items, setItems] = useState(DEMO_DATA.inboxItems);
  const [isNoteReaderOpen, setIsNoteReaderOpen] = useState(false);

  const handleNoteConfirm = (data: any) => {
    const newItem = {
      id: items.length + 1,
      sup: data.razaoSocial || 'N/I',
      cnpj: data.cnpj || 'N/I',
      date: data.data || new Date().toLocaleDateString('pt-BR'),
      val: data.valor || 0,
      cc: data.centroCusto || 'Outros',
      tipo: data.metodoPagamento || 'PIX',
      status: 'pendente',
      icon: '🤖'
    };
    setItems(prev => [newItem, ...prev]);
  };
  
  const filtered = items.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!i.sup.toLowerCase().includes(term) && !i.cnpj.includes(term) && !String(i.val).includes(term)) {
        return false;
      }
    }
    return true;
  });

  const filters = [
    { id: 'all', label: 'Todos', count: items.length },
    { id: 'pendente', label: 'Pendentes', count: items.filter(i => i.status === 'pendente').length },
    { id: 'revisao', label: 'Revisão', count: items.filter(i => i.status === 'revisao').length },
    { id: 'aprovado', label: 'Aprovados', count: items.filter(i => i.status === 'aprovado').length },
    { id: 'integrado', label: 'Integrados', count: items.filter(i => i.status === 'integrado').length },
    { id: 'erro', label: 'Erro', count: items.filter(i => i.status === 'erro').length },
  ];

  const mapStatus = (st: string): StatusType => {
    if (st === 'pendente') return 'pendente';
    if (st === 'revisao') return 'divergente';
    if (st === 'aprovado') return 'regularizado';
    if (st === 'integrado') return 'integrado';
    if (st === 'erro') return 'falha';
    return 'pendente';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleApprove = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'aprovado' } : item));
    toast.success('Nota aprovada com sucesso');
  };

  const handleReject = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'erro' } : item));
    toast.error('Nota rejeitada');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    toast.success('Arquivo recebido — processando via OCR...', { duration: 3000 });
  }, []);

  const exportData = filtered.map(i => ({
    'ID': i.id,
    'Fornecedor': i.sup,
    'CNPJ': i.cnpj,
    'Data': i.date,
    'Valor': i.val,
    'Centro Custo': i.cc,
    'Status': i.status
  }));

  return (
    <div id="inbox-content" className="space-y-4 animate-slide-up">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-bold text-text-primary flex items-center gap-2" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            <div className="w-0.5 h-5 bg-primary"></div>
            HUD de Documentos
          </h2>
          <span className="text-[10px] text-text-muted mt-0.5 inline-block font-mono">{filtered.length} notas processadas</span>
        </div>
        
        <div className="flex items-center gap-2">
          <ExportToolbar containerId="inbox-content" filename="inbox_notas" title="Inbox de Notas Fiscais" data={exportData} />
          <button
            onClick={() => setIsNoteReaderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors uppercase tracking-[0.05em]"
          >
            <Brain className="w-3 h-3" />
            IA OCR
          </button>
          <div className="relative w-full sm:w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost" />
            <input 
              type="text" 
              placeholder="Buscar fornecedor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border pl-9 pr-4 py-2 text-[11px] text-text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-text-ghost"
            />
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div 
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        className={cn(
          "border border-dashed p-6 text-center transition-all cursor-pointer flex items-center justify-center gap-3",
          isDragOver ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/50"
        )}
      >
        <Upload className={cn("w-4 h-4", isDragOver ? "text-primary" : "text-text-ghost")} />
        <span className={cn("text-[11px] font-mono tracking-wide uppercase", isDragOver ? "text-primary" : "text-text-muted")}>
          Arraste notas fiscais aqui para extração via OCR
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.05em] transition-colors",
              filter === f.id 
                ? "bg-primary text-background border border-primary" 
                : "bg-surface text-text-muted border border-border hover:text-text-primary hover:bg-card"
            )}
          >
            {f.label} <span className="ml-1 font-mono opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="flex-1 bg-card border border-border overflow-hidden flex flex-col h-[65vh]">
        <div className="overflow-auto h-full">
          {/* Desktop Table */}
          <table className="w-full text-left whitespace-nowrap hidden md:table brutal-table">
            <thead className="bg-background sticky top-0 z-10">
              <tr>
                <th className="w-10"></th>
                <th>Fornecedor / CNPJ</th>
                <th>Data</th>
                <th className="text-right">Valor</th>
                <th>Centro de Custo</th>
                <th className="text-center">Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr 
                  key={it.id} 
                  className="hover:bg-primary/[0.03] group cursor-pointer transition-colors border-b border-border/50"
                  onClick={() => setSelectedDoc(it)}
                >
                  <td className="w-10">
                    <div className="w-7 h-7 bg-surface border border-border flex items-center justify-center text-[9px] font-bold text-text-muted">
                      {getInitials(it.sup)}
                    </div>
                  </td>
                  <td className="max-w-[200px]">
                    <div className="text-[11px] font-semibold text-text-primary truncate group-hover:text-primary transition-colors">{it.sup}</div>
                    <div className="text-[10px] text-text-ghost font-mono mt-0.5">{it.cnpj}</div>
                  </td>
                  <td className="text-text-muted font-mono text-[11px]">{it.date}</td>
                  <td className="text-right text-[12px] font-bold font-mono text-text-primary group-hover:text-primary transition-colors">{formatCurrency(it.val)}</td>
                  <td className="text-text-muted max-w-[120px] truncate text-[10px] uppercase tracking-[0.05em]">{it.cc}</td>
                  <td className="text-center">
                    <StatusBadge status={mapStatus(it.status)} />
                  </td>
                  <td className="text-right w-[100px]">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 border border-border text-text-ghost hover:text-text-primary transition-colors hover:bg-surface" title="Ver">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {['pendente', 'revisao', 'erro'].includes(it.status) && (
                        <>
                          <button 
                            className="p-1 border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/20 transition-colors" 
                            title="Aprovar" 
                            onClick={(e) => handleApprove(e, it.id)}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            className="p-1 border border-rose-500/30 bg-rose-500/5 text-rose-500 hover:bg-rose-500/20 transition-colors" 
                            title="Rejeitar" 
                            onClick={(e) => handleReject(e, it.id)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-text-ghost font-mono text-[10px] uppercase border-none">
                    Nenhuma nota encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile List */}
          <div className="md:hidden flex flex-col divide-y divide-border">
            {filtered.map(it => (
              <div key={it.id} className="p-4 hover:bg-surface transition-colors" onClick={() => setSelectedDoc(it)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-surface border border-border flex items-center justify-center text-[10px] font-bold text-text-muted shrink-0">
                      {getInitials(it.sup)}
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-text-primary truncate">{it.sup}</div>
                      <div className="text-[9px] text-text-ghost font-mono">{it.cnpj}</div>
                    </div>
                  </div>
                  <StatusBadge status={mapStatus(it.status)} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border pt-2 mt-2">
                  <div><span className="text-text-ghost">Data:</span> <span className="text-text-muted font-mono">{it.date}</span></div>
                  <div className="font-bold text-text-primary text-right font-mono">{formatCurrency(it.val)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Detail Drawer */}
      <DetailDrawer 
        isOpen={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)}
        title="Detalhes do Documento"
        subtitle={selectedDoc ? `ID: ${selectedDoc.id}` : ''}
      >
        {selectedDoc && (
          <div className="space-y-5">
            <div className="p-4 bg-surface border border-border">
              <h3 className="text-[12px] font-bold text-text-primary mb-3 font-mono uppercase tracking-[0.05em]">Visão Geral</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-3 text-[11px]">
                <div>
                  <p className="text-text-ghost mb-1 uppercase text-[9px] tracking-[0.08em] font-bold">Fornecedor</p>
                  <p className="font-semibold text-text-primary">{selectedDoc.sup}</p>
                </div>
                <div>
                  <p className="text-text-ghost mb-1 uppercase text-[9px] tracking-[0.08em] font-bold">CNPJ</p>
                  <p className="font-mono text-text-primary">{selectedDoc.cnpj}</p>
                </div>
                <div>
                  <p className="text-text-ghost mb-1 uppercase text-[9px] tracking-[0.08em] font-bold">Data</p>
                  <p className="text-text-primary font-mono">{selectedDoc.date}</p>
                </div>
                <div>
                  <p className="text-text-ghost mb-1 uppercase text-[9px] tracking-[0.08em] font-bold">Valor</p>
                  <p className="font-bold text-primary font-mono">{formatCurrency(selectedDoc.val)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-surface border border-border">
              <h3 className="text-[12px] font-bold text-text-primary mb-3 font-mono uppercase tracking-[0.05em]">Classificação</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-3 text-[11px]">
                <div>
                  <p className="text-text-ghost mb-1 uppercase text-[9px] tracking-[0.08em] font-bold">Centro de Custo</p>
                  <p className="font-semibold text-text-primary uppercase">{selectedDoc.cc}</p>
                </div>
                <div>
                  <p className="text-text-ghost mb-1 uppercase text-[9px] tracking-[0.08em] font-bold">Tipo</p>
                  <p className="text-text-primary uppercase">{selectedDoc.tipo}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-text-ghost mb-1 uppercase text-[9px] tracking-[0.08em] font-bold">Status</p>
                  <StatusBadge status={mapStatus(selectedDoc.status)} className="mt-1" />
                </div>
              </div>
            </div>

            {['pendente', 'revisao', 'erro'].includes(selectedDoc.status) && (
              <div className="flex items-center gap-3 mt-6">
                <button 
                  onClick={(e) => { handleApprove(e, selectedDoc.id); setSelectedDoc(null); }}
                  className="flex-1 bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 font-bold py-2.5 hover:bg-emerald-500 hover:text-white transition-colors text-[10px] uppercase tracking-widest"
                >
                  Aprovar
                </button>
                <button 
                  onClick={(e) => { handleReject(e, selectedDoc.id); setSelectedDoc(null); }}
                  className="flex-1 border border-border bg-surface text-text-primary font-bold py-2.5 hover:bg-card hover:text-rose-400 hover:border-rose-400/50 transition-colors text-[10px] uppercase tracking-widest"
                >
                  Rejeitar
                </button>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      <NoteReader
        isOpen={isNoteReaderOpen}
        onClose={() => setIsNoteReaderOpen(false)}
        onConfirm={handleNoteConfirm}
      />
    </div>
  );
}
