'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrencyShort, formatCurrency } from '@/lib/mock-data';
import { transactions } from '@/lib/data-importer';
import { Heart, Users, BookOpen, Megaphone, HandHeart, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const PILLARS = [
  { 
    id: 'adorar', 
    name: 'Adorar', 
    icon: Heart, 
    color: '#d4af37', 
    budget: 25000, 
    spent: 18750, 
    description: 'Louvor, liturgia e celebrações',
    categories: ['DÍZIMO E OFERTA', 'MÚSICA']
  },
  { 
    id: 'discipular', 
    name: 'Discipular', 
    icon: BookOpen, 
    color: '#14b8a6', 
    budget: 15000, 
    spent: 12400, 
    description: 'Formação, EBD e grupos de estudo',
    categories: ['EDUCAÇÃO', 'LIVROS'] 
  },
  { 
    id: 'comungar', 
    name: 'Comungar', 
    icon: Users, 
    color: '#8b5cf6', 
    budget: 10000, 
    spent: 7200, 
    description: 'Comunhão, eventos e confraternizações',
    categories: ['EVENTOS', 'ALIMENTAÇÃO']
  },
  { 
    id: 'servir', 
    name: 'Servir', 
    icon: HandHeart, 
    color: '#22c55e', 
    budget: 20000, 
    spent: 16800, 
    description: 'Ação social, diaconia e assistência',
    categories: ['ASSISTÊNCIA', 'MANUTENÇÃO']
  },
  { 
    id: 'alcancar', 
    name: 'Alcançar', 
    icon: Megaphone, 
    color: '#ef4444', 
    budget: 18000, 
    spent: 14500, 
    description: 'Missões, evangelismo e plantação',
    categories: ['MISSÕES', 'EVANGELISMO'] 
  },
];

export function PastoralTab() {
  const totalBudget = PILLARS.reduce((s, p) => s + p.budget, 0);
  const totalSpent = PILLARS.reduce((s, p) => s + p.spent, 0);
  const healthPct = Math.round((totalSpent / totalBudget) * 100);

  return (
    <div className="space-y-5 animate-slide-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-bold text-text-primary flex items-center gap-2">
            <div className="w-0.5 h-4 bg-gold"></div>
            Visão Pastoral
          </h2>
          <span className="text-[10px] text-text-muted mt-0.5 inline-block">Os 5 pilares e a saúde financeira da comunidade</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border p-4">
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Orçamento Total</div>
          <div className="text-lg font-bold text-text-primary font-mono">{formatCurrencyShort(totalBudget)}</div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Executado</div>
          <div className="text-lg font-bold text-primary font-mono">{formatCurrencyShort(totalSpent)}</div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Disponível</div>
          <div className="text-lg font-bold text-emerald-400 font-mono">{formatCurrencyShort(totalBudget - totalSpent)}</div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Saúde</div>
          <div className={cn("text-lg font-bold font-mono", healthPct > 90 ? "text-amber-400" : healthPct > 70 ? "text-primary" : "text-emerald-400")}>
            {healthPct}%
          </div>
          <div className="h-1 bg-border mt-2 overflow-hidden">
            <div className={cn("h-full", healthPct > 90 ? "bg-amber-500" : healthPct > 70 ? "bg-primary" : "bg-emerald-500")} style={{ width: `${healthPct}%` }} />
          </div>
        </div>
      </div>

      {/* Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PILLARS.map((pillar) => {
          const pct = Math.round((pillar.spent / pillar.budget) * 100);
          const remaining = pillar.budget - pillar.spent;
          const isOver = pct > 90;
          
          return (
            <div key={pillar.id} className="bg-card border border-border p-5 hover:border-border-hover transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2" style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}>
                    <pillar.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-text-primary group-hover:text-primary transition-colors">{pillar.name}</h3>
                    <p className="text-[10px] text-text-ghost mt-0.5">{pillar.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                  <div className="text-[8px] text-text-ghost uppercase tracking-[0.08em] font-bold">Orçado</div>
                  <div className="text-[12px] font-bold text-text-primary font-mono mt-0.5">{formatCurrencyShort(pillar.budget)}</div>
                </div>
                <div>
                  <div className="text-[8px] text-text-ghost uppercase tracking-[0.08em] font-bold">Usado</div>
                  <div className="text-[12px] font-bold font-mono mt-0.5" style={{ color: pillar.color }}>{formatCurrencyShort(pillar.spent)}</div>
                </div>
                <div>
                  <div className="text-[8px] text-text-ghost uppercase tracking-[0.08em] font-bold">Resta</div>
                  <div className={cn("text-[12px] font-bold font-mono mt-0.5", isOver ? "text-amber-400" : "text-emerald-400")}>{formatCurrencyShort(remaining)}</div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-2">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] text-text-muted font-medium">Execução</span>
                  <span className={cn("text-[10px] font-bold font-mono", isOver ? "text-amber-400" : "text-text-primary")}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-border overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: pillar.color }} />
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-1 mt-3">
                {pillar.categories.map(cat => (
                  <span key={cat} className="text-[8px] bg-surface border border-border text-text-ghost px-1.5 py-0.5 uppercase tracking-[0.05em] font-bold">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pastoral Insights */}
      <div className="bg-card border border-border p-5">
        <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.08em] mb-4">Insights Pastorais</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: 'Pilar Mais Saudável', value: 'Comungar', detail: '72% do orçamento executado', color: 'text-emerald-400' },
            { icon: TrendingDown, label: 'Atenção Necessária', value: 'Adorar', detail: '75% executado — próximo do limite', color: 'text-amber-400' },
            { icon: BarChart3, label: 'Recomendação', value: 'Rebalancear', detail: 'Transferir 5% de Comungar → Alcançar', color: 'text-primary' },
          ].map((insight, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-surface border border-border">
              <insight.icon className={cn("w-4 h-4 mt-0.5 shrink-0", insight.color)} />
              <div>
                <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-0.5">{insight.label}</div>
                <div className="text-[12px] font-bold text-text-primary">{insight.value}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{insight.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
