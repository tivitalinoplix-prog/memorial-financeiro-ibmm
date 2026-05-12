'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, RefreshCw, Activity, ArrowRight, Zap, Wifi, WifiOff, Server } from 'lucide-react';

const PIPELINE_STAGES = [
  {
    id: 'upload',
    label: 'Upload & OCR',
    icon: Zap,
    status: 'active' as const,
    processed: 47,
    total: 47,
    description: 'Extração de dados via Gemini Vision'
  },
  {
    id: 'validate',
    label: 'Validação',
    icon: CheckCircle2,
    status: 'active' as const,
    processed: 44,
    total: 47,
    description: 'Verificação de campos e CNPJ'
  },
  {
    id: 'classify',
    label: 'Classificação',
    icon: Activity,
    status: 'active' as const,
    processed: 42,
    total: 47,
    description: 'Centro de custo e natureza fiscal'
  },
  {
    id: 'integrate',
    label: 'Integração Eclésia',
    icon: Server,
    status: 'warning' as const,
    processed: 38,
    total: 47,
    description: 'Push para o ERP da igreja'
  },
];

const QUEUE_ITEMS = [
  { id: 1, name: 'NF #2024-0891', supplier: 'Livraria Vida', status: 'processando', eta: '~15s' },
  { id: 2, name: 'NF #2024-0892', supplier: 'Gráfica Express', status: 'em_fila', eta: '~45s' },
  { id: 3, name: 'NF #2024-0893', supplier: 'Auto Peças Central', status: 'em_fila', eta: '~1min' },
  { id: 4, name: 'NF #2024-0890', supplier: 'Supermercado Rede', status: 'integrado', eta: 'Concluído' },
  { id: 5, name: 'NF #2024-0889', supplier: 'Padaria Trigo', status: 'integrado', eta: 'Concluído' },
  { id: 6, name: 'NF #2024-0888', supplier: 'Elétrica Norte', status: 'falha', eta: 'Retry' },
  { id: 7, name: 'NF #2024-0887', supplier: 'Papelaria Sol', status: 'integrado', eta: 'Concluído' },
];

export function PipelineTab() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processando': return 'text-primary animate-pulse';
      case 'em_fila': return 'text-cyan-400';
      case 'integrado': return 'text-emerald-400';
      case 'falha': return 'text-rose-400';
      default: return 'text-text-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processando': return RefreshCw;
      case 'em_fila': return Clock;
      case 'integrado': return CheckCircle2;
      case 'falha': return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-5 animate-slide-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-bold text-text-primary flex items-center gap-2">
            <div className="w-0.5 h-4 bg-cyan-500"></div>
            Pipeline de Integração
          </h2>
          <span className="text-[10px] text-text-muted mt-0.5 inline-block font-mono">Observabilidade do fluxo de processamento</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 font-bold uppercase tracking-[0.05em]">
            <Wifi className="w-3 h-3" /> Conectado
          </span>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PIPELINE_STAGES.map((stage, i) => {
          const pct = Math.round((stage.processed / stage.total) * 100);
          return (
            <div 
              key={stage.id}
              onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
              className={cn(
                "bg-card border p-4 cursor-pointer transition-all group",
                selectedStage === stage.id ? "border-primary" : "border-border hover:border-border-hover"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "p-1.5",
                  stage.status === 'warning' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                )}>
                  <stage.icon className="w-4 h-4" />
                </div>
                <span className="text-[18px] font-bold text-text-primary font-mono">{pct}%</span>
              </div>
              <div className="text-[11px] font-bold text-text-primary mb-0.5 group-hover:text-primary transition-colors">{stage.label}</div>
              <div className="text-[10px] text-text-ghost mb-2">{stage.description}</div>
              <div className="h-1 bg-border overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", stage.status === 'warning' ? 'bg-amber-500' : 'bg-primary')} 
                  style={{ width: `${pct}%` }} 
                />
              </div>
              <div className="text-[9px] text-text-ghost mt-1.5 font-mono">{stage.processed}/{stage.total} processados</div>
            </div>
          );
        })}
      </div>

      {/* Queue */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.08em]">Fila de Processamento</h3>
          <span className="text-[10px] text-text-ghost font-mono">{QUEUE_ITEMS.length} itens</span>
        </div>
        <div className="divide-y divide-border">
          {QUEUE_ITEMS.map(item => {
            const Icon = getStatusIcon(item.status);
            return (
              <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface transition-colors">
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", getStatusColor(item.status))} />
                  <div>
                    <div className="text-[12px] font-semibold text-text-primary">{item.name}</div>
                    <div className="text-[10px] text-text-ghost">{item.supplier}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-[10px] font-mono", getStatusColor(item.status))}>{item.eta}</span>
                  {item.status === 'falha' && (
                    <button className="text-[9px] bg-rose-500/10 text-rose-400 px-2 py-0.5 font-bold uppercase tracking-[0.05em] hover:bg-rose-500/20 transition-colors">
                      Retry
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Uptime', value: '99.8%', color: 'text-emerald-400' },
          { label: 'Latência', value: '42ms', color: 'text-primary' },
          { label: 'Queue Size', value: '3', color: 'text-amber-400' },
          { label: 'Erros (24h)', value: '2', color: 'text-rose-400' },
        ].map((metric, i) => (
          <div key={i} className="bg-card border border-border p-3 hover:border-border-hover transition-colors">
            <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">{metric.label}</div>
            <div className={cn("text-lg font-bold font-mono", metric.color)}>{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
