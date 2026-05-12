'use client';

import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatCurrencyShort, formatNumber, formatCurrency } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/KpiCard';
import { ExportToolbar } from '@/components/ExportToolbar';
import { AlertTriangle, TrendingUp, GitMerge, FileCheck, CheckCircle, Upload, Flame, Activity } from 'lucide-react';
import { transactions } from '@/lib/data-importer';

/* ── Tooltip Brutalista ── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 text-[11px]">
        <p className="text-text-primary font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2" style={{ backgroundColor: entry.color }} />
            <span className="text-text-muted">{entry.name}:</span>
            <span className="text-text-primary font-bold font-mono">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* ── Pilares Estratégicos ── */
const PILLARS_DATA = [
  { name: 'Adorar', value: 35, color: '#d4af37' },
  { name: 'Discipular', value: 20, color: '#14b8a6' },
  { name: 'Servir', value: 15, color: '#22c55e' },
  { name: 'Comungar', value: 10, color: '#8b5cf6' },
  { name: 'Alcançar', value: 20, color: '#ef4444' },
];

export function DashboardTab() {
  const metrics = useMemo(() => {
    const monthlyMap: Record<string, { income: number, expense: number, balance: number, count: number }> = {};
    const categoriesMap: Record<string, number> = {};
    const sourcesMap: Record<string, number> = {};
    
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (!monthlyMap[t.month_label]) monthlyMap[t.month_label] = { income: 0, expense: 0, balance: 0, count: 0 };
      if (!sourcesMap[t.document_source]) sourcesMap[t.document_source] = 0;
      if (!categoriesMap[t.category]) categoriesMap[t.category] = 0;
      
      const v = t.amount;
      const absV = Math.abs(t.amount);
      
      if (v > 0) {
        monthlyMap[t.month_label].income += v;
        totalIncome += v;
      } else {
        monthlyMap[t.month_label].expense += absV;
        totalExpense += absV;
      }
      
      monthlyMap[t.month_label].balance += v;
      monthlyMap[t.month_label].count++;
      sourcesMap[t.document_source] += absV;
      categoriesMap[t.category] += absV;
    });

    const monthly = Object.entries(monthlyMap)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([m, data]) => ({ m, ...data }));
      
    const categories = Object.entries(categoriesMap)
      .sort((a,b) => b[1] - a[1])
      .map(([name, val], i) => ({ 
        name, val, 
        col: ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#f97316', '#10b981', '#ec4899', '#14b8a6'][i % 8] 
      }));

    const totalTxs = transactions.length;
    return { monthly, categories, totalIncome, totalExpense, totalTxs, sourcesMap };
  }, []);

  const { monthly, categories, totalIncome, totalExpense, totalTxs, sourcesMap } = metrics;
  
  const sourcesData = Object.entries(sourcesMap).map(([name, value], i) => ({
    name: name.replace('_PDF', ''),
    value,
    color: ['#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'][i % 4]
  })).sort((a,b) => b.value - a.value);

  const saneamento = Math.round((totalTxs / 2000) * 100);

  return (
    <div id="dashboard-content" className="space-y-5 animate-slide-up">
      
      {/* Header com Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-bold text-text-primary flex items-center gap-2">
            <div className="w-0.5 h-4 bg-primary"></div>
            Painel Executivo
          </h2>
          <span className="text-[10px] text-text-muted font-mono">{formatNumber(totalTxs)} transações processadas</span>
        </div>
        <ExportToolbar containerId="dashboard-content" filename="dashboard_executivo" title="Painel Executivo — Memorial IBMM" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard 
          title="Total Entradas" 
          value={formatCurrencyShort(totalIncome)}
          icon={TrendingUp}
          colorStyle="success"
          progress={{ value: 100, colorClass: 'bg-emerald-500', label: 'Receitas do Período' }}
        />
        <KpiCard 
          title="Total Saídas" 
          value={formatCurrencyShort(totalExpense)}
          icon={AlertTriangle}
          colorStyle="danger"
          progress={{ value: 100, colorClass: 'bg-rose-500', label: 'Despesas do Período' }}
        />
        <KpiCard 
          title="Saneamento" 
          value={`${saneamento}%`}
          icon={Activity}
          colorStyle="warning"
          trend={{ value: `${totalTxs}/2000`, isUp: true }}
          progress={{ value: saneamento, colorClass: 'bg-amber-500', label: 'Notas Processadas' }}
        />
        <KpiCard 
          title="Saldo Líquido" 
          value={formatCurrencyShort(totalIncome - totalExpense)}
          icon={GitMerge}
          colorStyle="info"
          progress={{ value: 100, colorClass: 'bg-primary', label: 'Fluxo de Caixa' }}
        />
      </div>

      {/* ═══ Main Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] xl:grid-cols-[68%_32%] gap-4">
        
        {/* ── COLUNA ESQUERDA ── */}
        <div className="space-y-4 flex flex-col min-h-0">
          
          {/* Gráfico Principal */}
          <div className="bg-card border border-border p-5 hover:border-border-hover transition-colors flex-none group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-bold text-text-primary mb-0.5 group-hover:text-primary transition-colors">Evolução Mensal</h3>
                <p className="text-[10px] text-text-muted">Entradas vs. Saídas — dados extraídos dos PDFs financeiros</p>
              </div>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" vertical={false} />
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} tickFormatter={(val) => formatCurrencyShort(val)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="plainline" wrapperStyle={{ fontSize: '10px', color: '#a1a1aa', paddingTop: '10px' }} />
                  <Area type="monotone" name="Entradas" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={2} activeDot={{ r: 4, stroke: '#09090b', strokeWidth: 2 }} />
                  <Area type="monotone" name="Saídas" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} activeDot={{ r: 4, stroke: '#09090b', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela Resumo Mensal */}
          <div className="bg-card border border-border p-5 hover:border-border-hover transition-colors flex-1 flex flex-col min-h-0">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.08em] mb-3">Resumo Mensal</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left brutal-table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th className="text-right">Entradas</th>
                    <th className="text-right">Saídas</th>
                    <th className="text-right">Saldo</th>
                    <th className="text-right">Txs</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.slice(-6).map((m, i) => (
                    <tr key={i} className="group cursor-default">
                      <td className="font-semibold text-text-primary group-hover:text-primary transition-colors">{m.m}</td>
                      <td className="text-right font-tabular-nums text-emerald-400 font-mono">{formatCurrencyShort(m.income)}</td>
                      <td className="text-right font-tabular-nums text-rose-400 font-mono">{formatCurrencyShort(m.expense)}</td>
                      <td className={cn("text-right font-tabular-nums font-mono", m.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>{formatCurrencyShort(m.balance)}</td>
                      <td className="text-right text-text-muted font-mono">{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── COLUNA DIREITA ── */}
        <div className="space-y-4 flex flex-col min-h-0">
          
          {/* 5 Pilares Estratégicos */}
          <div className="bg-card border border-border p-5 flex-none hover:border-border-hover transition-colors">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.08em] mb-1">5 Pilares Estratégicos</h3>
            <p className="text-[10px] text-text-ghost mb-3">Distribuição de investimentos por propósito</p>
            <div className="h-[160px] w-full flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={PILLARS_DATA}
                    innerRadius="60%" outerRadius="88%" paddingAngle={2} dataKey="value" stroke="none"
                  >
                    {PILLARS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="plainline" wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Diagnóstico de Integração */}
          <div className="bg-card border border-border p-5 flex-none hover:border-border-hover transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.08em]">Diagnóstico</h3>
              <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 font-bold flex items-center gap-1 uppercase tracking-[0.05em]">
                <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse"></span>
                Sync OK
              </span>
            </div>
            
            <div className="space-y-3">
              {[
                { label: 'Importação', desc: `4 PDFs processados`, status: 'ok' },
                { label: 'Normalização', desc: `${totalTxs} transações unificadas`, status: 'ok' },
                { label: 'Revisão', desc: 'Transferências internas requerem conciliação T-1', status: 'warn' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn("w-1.5 h-1.5 mt-1.5 shrink-0", item.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500')}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={cn("text-[10px] font-bold uppercase tracking-[0.05em]", item.status === 'ok' ? 'text-emerald-400' : 'text-amber-400')}>{item.label}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Categorias */}
          <div className="bg-card border border-border p-5 flex-none hover:border-border-hover transition-colors">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.08em] mb-3">Top Categorias</h3>
            <div className="space-y-2.5">
              {categories.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center gap-2 group cursor-default">
                  <div className="text-[11px] text-text-secondary w-[100px] shrink-0 truncate group-hover:text-text-primary transition-colors">
                    {c.name} 
                  </div>
                  <div className="flex-1 h-1 bg-border overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ width: `${(c.val / categories[0].val) * 100}%`, backgroundColor: c.col }}></div>
                  </div>
                  <div className="text-[10px] text-text-primary font-tabular-nums text-right min-w-[55px] shrink-0 font-mono">
                    {formatCurrencyShort(c.val)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráficos Mini */}
          <div className="grid grid-cols-2 gap-3 flex-none">
            <div className="bg-card border border-border p-4 hover:border-border-hover transition-colors relative">
              <h3 className="text-[9px] font-bold text-text-ghost uppercase tracking-[0.08em] mb-2">Origem</h3>
              <div className="h-[100px] w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourcesData} innerRadius="70%" outerRadius="95%" paddingAngle={3} dataKey="value" stroke="none">
                      {sourcesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-3">
                <span className="text-lg font-bold text-text-primary leading-none">{sourcesData.length}</span>
                <span className="text-[8px] text-text-ghost uppercase">Fontes</span>
              </div>
            </div>
            
            <div className="bg-card border border-border p-4 hover:border-border-hover transition-colors relative">
              <h3 className="text-[9px] font-bold text-text-ghost uppercase tracking-[0.08em] mb-2">Natureza</h3>
              <div className="h-[100px] w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Receitas', value: totalIncome },
                        { name: 'Despesas', value: totalExpense }
                      ]}
                      innerRadius="70%" outerRadius="95%" paddingAngle={3} dataKey="value" stroke="none"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-3">
                <span className={cn("text-sm font-bold leading-none", (totalIncome-totalExpense) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {formatCurrencyShort(totalIncome - totalExpense)}
                </span>
                <span className="text-[8px] text-text-ghost uppercase mt-0.5">Líquido</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
