'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrencyShort, formatCurrency } from '@/lib/mock-data';
import { Heart, Users, BookOpen, Megaphone, HandHeart, TrendingUp, TrendingDown, BarChart3, Filter } from 'lucide-react';
import { ExportToolbar } from '@/components/ExportToolbar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

/* ── MOCK DATA & TRENDS ── */
const BASE_PILLARS = [
  { id: 'adorar', name: 'Adorar', icon: Heart, color: '#d4af37', description: 'Louvor, liturgia e celebrações', categories: ['DÍZIMO E OFERTA', 'MÚSICA'] },
  { id: 'discipular', name: 'Discipular', icon: BookOpen, color: '#14b8a6', description: 'Formação, EBD e grupos de estudo', categories: ['EDUCAÇÃO', 'LIVROS'] },
  { id: 'comungar', name: 'Comungar', icon: Users, color: '#8b5cf6', description: 'Comunhão, eventos e confraternizações', categories: ['EVENTOS', 'ALIMENTAÇÃO'] },
  { id: 'servir', name: 'Servir', icon: HandHeart, color: '#22c55e', description: 'Ação social, diaconia e assistência', categories: ['ASSISTÊNCIA', 'MANUTENÇÃO'] },
  { id: 'alcancar', name: 'Alcançar', icon: Megaphone, color: '#ef4444', description: 'Missões, evangelismo e plantação', categories: ['MISSÕES', 'EVANGELISMO'] },
];

const PERIOD_MOCKS = {
  '2024': {
    adorar: { budget: 300000, spent: 285000, history: [22, 23, 24, 25, 23, 24, 25, 24, 23, 24, 23, 25] },
    discipular: { budget: 180000, spent: 145000, history: [10, 12, 11, 13, 12, 11, 14, 13, 11, 12, 13, 13] },
    comungar: { budget: 120000, spent: 110000, history: [8, 9, 8, 10, 9, 8, 9, 10, 9, 10, 10, 10] },
    servir: { budget: 240000, spent: 220000, history: [18, 17, 18, 19, 18, 17, 19, 18, 19, 19, 18, 20] },
    alcancar: { budget: 216000, spent: 195000, history: [15, 16, 15, 17, 16, 17, 16, 16, 15, 17, 17, 18] }
  },
  '2023': {
    adorar: { budget: 250000, spent: 260000, history: [20, 21, 20, 22, 21, 22, 21, 22, 21, 22, 23, 25] },
    discipular: { budget: 150000, spent: 140000, history: [11, 10, 12, 11, 11, 12, 12, 11, 12, 12, 13, 13] },
    comungar: { budget: 100000, spent: 95000, history: [7, 8, 7, 8, 8, 9, 8, 8, 7, 8, 9, 10] },
    servir: { budget: 200000, spent: 180000, history: [14, 15, 14, 16, 15, 15, 16, 15, 14, 15, 15, 16] },
    alcancar: { budget: 180000, spent: 160000, history: [12, 13, 13, 14, 13, 14, 13, 13, 14, 14, 15, 16] }
  },
  'Q1 2024': {
    adorar: { budget: 75000, spent: 69000, history: [22, 23, 24] },
    discipular: { budget: 45000, spent: 33000, history: [10, 12, 11] },
    comungar: { budget: 30000, spent: 25000, history: [8, 9, 8] },
    servir: { budget: 60000, spent: 53000, history: [18, 17, 18] },
    alcancar: { budget: 54000, spent: 46000, history: [15, 16, 15] }
  }
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/* ── Custom Tooltip ── */
const BrutalistTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-elevated border border-border p-3 text-[11px] animate-fade-in" style={{ borderRadius: 0 }}>
        <p className="text-text-primary font-bold mb-2 font-mono text-[10px]">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2" style={{ backgroundColor: entry.color }} />
            <span className="text-text-muted">{entry.name}:</span>
            <span className="text-text-primary font-bold font-mono">
              {formatCurrency(entry.value * 1000)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function PastoralTab() {
  const [period, setPeriod] = useState<keyof typeof PERIOD_MOCKS>('2024');

  // Compute Current Data
  const pillars = useMemo(() => {
    const data = PERIOD_MOCKS[period];
    return BASE_PILLARS.map(p => ({
      ...p,
      budget: data[p.id as keyof typeof data].budget,
      spent: data[p.id as keyof typeof data].spent,
      history: data[p.id as keyof typeof data].history
    }));
  }, [period]);

  const totalBudget = pillars.reduce((s, p) => s + p.budget, 0);
  const totalSpent = pillars.reduce((s, p) => s + p.spent, 0);
  const healthPct = Math.round((totalSpent / totalBudget) * 100);

  // Prepare chart data for overall history
  const chartData = useMemo(() => {
    const historyLength = pillars[0].history.length;
    return Array.from({ length: historyLength }).map((_, i) => {
      const point: any = { name: MONTHS[i % 12] };
      pillars.forEach(p => {
        point[p.id] = p.history[i];
      });
      return point;
    });
  }, [pillars]);

  // Export Data mapped from pillars
  const exportData = pillars.map(p => ({
    Pilar: p.name,
    'Descrição': p.description,
    'Categorias': p.categories.join(', '),
    'Orçamento': p.budget,
    'Executado': p.spent,
    'Resta': p.budget - p.spent,
    'Uso (%)': `${Math.round((p.spent / p.budget) * 100)}%`
  }));

  return (
    <div className="space-y-5 animate-slide-up" id="pastoral-content">
      
      {/* ═══ Header & Toolbar ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-bold text-text-primary flex items-center gap-2" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            <div className="w-0.5 h-5 bg-gold"></div>
            HUD Pastoral
          </h2>
          <span className="text-[10px] text-text-muted mt-0.5 inline-block font-mono">Auditoria Estratégica & OKRs — {period}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border bg-surface text-[10px]">
            <span className="px-3 py-1.5 text-text-ghost font-bold uppercase tracking-[0.05em] border-r border-border flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Período
            </span>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value as any)}
              className="bg-transparent text-text-primary font-bold font-mono px-3 py-1.5 outline-none cursor-pointer appearance-none"
            >
              <option value="2024">Ano Base 2024</option>
              <option value="2023">Ano Fechado 2023</option>
              <option value="Q1 2024">1º Trimestre 2024</option>
            </select>
          </div>
          <ExportToolbar 
            containerId="pastoral-content" 
            filename={`HUD_Pastoral_${period}`} 
            title={`Relatório Pastoral - ${period}`} 
            data={exportData}
          />
        </div>
      </div>

      {/* ═══ Summary Cards (HUD Metrics) ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-8 h-8 bg-surface border-b border-l border-border flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
            <BarChart3 className="w-3 h-3 text-text-ghost" />
          </div>
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Orçamento Total</div>
          <div className="text-lg font-bold text-text-primary font-mono tracking-tight">{formatCurrencyShort(totalBudget)}</div>
        </div>
        <div className="bg-card border border-border p-4 relative">
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Executado</div>
          <div className="text-lg font-bold text-primary font-mono tracking-tight">{formatCurrencyShort(totalSpent)}</div>
        </div>
        <div className="bg-card border border-border p-4 relative">
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1">Disponível</div>
          <div className="text-lg font-bold text-emerald-400 font-mono tracking-tight">{formatCurrencyShort(totalBudget - totalSpent)}</div>
        </div>
        <div className="bg-card border border-border p-4 relative">
          <div className="text-[9px] text-text-ghost uppercase tracking-[0.08em] font-bold mb-1 flex items-center justify-between">
            Saúde Operacional
            <span className={cn("text-[10px] font-mono", healthPct > 100 ? "text-rose-400" : healthPct > 85 ? "text-amber-400" : "text-emerald-400")}>
              {healthPct}%
            </span>
          </div>
          <div className="h-1.5 bg-border mt-3 overflow-hidden">
            <div className={cn("h-full transition-all duration-1000", healthPct > 100 ? "bg-rose-500" : healthPct > 85 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(healthPct, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ═══ Historical Trend Chart (Recharts) ═══ */}
      <div className="bg-card border border-border p-5">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-[13px] font-bold text-text-primary mb-0.5 flex items-center gap-2" style={{ fontFamily: 'var(--font-geist-sans)' }}>
              Evolução Temporal dos Pilares
            </h3>
            <p className="text-[10px] text-text-muted">Gastos agrupados por mês ({period}) em Milhares (K)</p>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(39,39,42,0.4)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'var(--font-mono)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'var(--font-mono)' }} tickFormatter={(val) => `${val}K`} />
              <RechartsTooltip content={<BrutalistTooltip />} />
              {pillars.map((p, i) => (
                <Area 
                  key={p.id}
                  type="monotone" 
                  dataKey={p.id} 
                  name={p.name} 
                  stackId="1" 
                  stroke={p.color} 
                  fill={p.color} 
                  fillOpacity={0.15} 
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Pillar Cards HUD ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pillars.map((pillar) => {
          const pct = Math.round((pillar.spent / pillar.budget) * 100);
          const remaining = pillar.budget - pillar.spent;
          const isOver = pct > 100;
          const isWarning = pct > 85;
          
          return (
            <div key={pillar.id} className="bg-card border border-border flex flex-col group transition-all duration-300 hover:border-text-ghost relative overflow-hidden">
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 w-full h-0.5 transition-all duration-300" style={{ backgroundColor: pillar.color, opacity: 0.5 }} />
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border border-border" style={{ backgroundColor: `${pillar.color}10`, color: pillar.color }}>
                      <pillar.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold text-text-primary transition-colors">{pillar.name}</h3>
                      <p className="text-[10px] text-text-ghost mt-0.5 leading-tight">{pillar.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* HUD Data Grid */}
                <div className="grid grid-cols-3 gap-px bg-border mb-5">
                  <div className="bg-card p-2 text-center">
                    <div className="text-[8px] text-text-ghost uppercase tracking-[0.08em] font-bold">Meta</div>
                    <div className="text-[11px] font-bold text-text-primary font-mono mt-1">{formatCurrencyShort(pillar.budget)}</div>
                  </div>
                  <div className="bg-card p-2 text-center relative">
                    <div className="text-[8px] text-text-ghost uppercase tracking-[0.08em] font-bold">Atingido</div>
                    <div className="text-[11px] font-bold font-mono mt-1" style={{ color: pillar.color }}>{formatCurrencyShort(pillar.spent)}</div>
                  </div>
                  <div className="bg-card p-2 text-center">
                    <div className="text-[8px] text-text-ghost uppercase tracking-[0.08em] font-bold">Resta</div>
                    <div className={cn("text-[11px] font-bold font-mono mt-1", isOver ? "text-rose-400" : "text-emerald-400")}>
                      {formatCurrencyShort(Math.abs(remaining))}
                      {isOver && <span className="text-[8px] block mt-0.5">(Excesso)</span>}
                    </div>
                  </div>
                </div>

                {/* Progress / OKR Indicator */}
                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] text-text-muted font-medium uppercase tracking-widest">Execução OKR</span>
                    <span className={cn("text-[10px] font-bold font-mono", isOver ? "text-rose-400" : isWarning ? "text-amber-400" : "text-text-primary")}>{pct}%</span>
                  </div>
                  <div className="h-1 bg-surface border border-border overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 border-r border-background z-10" style={{ width: '85%' }} />
                    <div className="absolute left-0 top-0 bottom-0 border-r border-background z-10" style={{ width: '100%' }} />
                    <div className={cn("h-full transition-all duration-1000", isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-text-primary")} style={{ width: `${Math.min(pct, 100)}%` }} />
                    {isOver && (
                      <div className="absolute top-0 bottom-0 bg-rose-500/50 striped-bg" style={{ left: '100%', right: 0 }} />
                    )}
                  </div>
                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-[7px] text-text-ghost">0</span>
                    <span className="text-[7px] text-text-ghost">85</span>
                    <span className="text-[7px] text-text-ghost">100</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-border/50">
                  {pillar.categories.map(cat => (
                    <span key={cat} className="text-[8px] text-text-muted px-1 py-0.5 uppercase tracking-[0.05em] flex items-center gap-1">
                      <span className="w-1 h-1 bg-border rounded-full inline-block" />
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Pastoral Insights Automáticos ═══ */}
      <div className="bg-card border border-border p-5">
        <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.08em] mb-4">Análise Automática de Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const sortedByPct = [...pillars].sort((a, b) => (a.spent/a.budget) - (b.spent/b.budget));
            const healthiest = sortedByPct[0]; // Menor % gasto
            const critical = sortedByPct[sortedByPct.length - 1]; // Maior % gasto
            
            return [
              { icon: TrendingUp, label: 'Pilar com Maior Folga', value: healthiest.name, detail: `${Math.round((healthiest.spent/healthiest.budget)*100)}% do orçamento executado`, color: 'text-emerald-400' },
              { icon: TrendingDown, label: 'Alerta Estratégico', value: critical.name, detail: `${Math.round((critical.spent/critical.budget)*100)}% executado`, color: critical.spent > critical.budget ? 'text-rose-400' : 'text-amber-400' },
              { icon: BarChart3, label: 'Ação Recomendada', value: 'Revisão de OKRs', detail: `Avaliar realocação de ${healthiest.name} para ${critical.name}`, color: 'text-primary' },
            ];
          })().map((insight, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-surface border border-border transition-colors hover:bg-elevated cursor-default">
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
