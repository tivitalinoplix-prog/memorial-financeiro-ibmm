import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  progress?: {
    value: number;
    colorClass: string;
    label?: string;
    type?: 'linear' | 'circular';
  };
  colorStyle?: 'default' | 'danger' | 'success' | 'warning' | 'info';
  className?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, progress, colorStyle = 'default', className }: KpiCardProps) {
  const getIconColors = () => {
    switch (colorStyle) {
      case 'danger': return 'text-rose-500 bg-rose-500/10';
      case 'success': return 'text-emerald-500 bg-emerald-500/10';
      case 'warning': return 'text-amber-500 bg-amber-500/10';
      case 'info': return 'text-cyan-400 bg-cyan-400/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  const isCircular = progress?.type === 'circular';

  return (
    <div className={cn(
      "bg-card border border-border p-5 transition-all duration-200 group cursor-default flex flex-col",
      "hover:border-border-hover",
      className
    )}>
      <div className="flex justify-between items-start mb-2 gap-2">
        <h3 className="text-text-muted font-semibold text-[10px] uppercase tracking-[0.08em] leading-tight min-w-0">{title}</h3>
        <div className={cn("p-1.5 shrink-0", getIconColors())}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      
      <div className="flex flex-wrap items-end gap-3 mb-3 flex-1">
        <div className="text-2xl font-bold text-text-primary tracking-tight leading-none whitespace-nowrap truncate min-w-0 font-tabular-nums">{value}</div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 shrink-0",
            trend.isUp ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
          )}>
            {trend.isUp ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>

      {progress && !isCircular && (
        <div className="mt-auto">
          {progress.label && (
            <div className="flex items-end justify-between gap-2 text-[10px] font-medium text-text-muted mb-1.5">
              <span className="truncate min-w-0 leading-tight">{progress.label}</span>
              <span className="shrink-0 leading-tight font-mono">{progress.value}%</span>
            </div>
          )}
          <div className="h-1 w-full bg-border overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-1000 w-0", progress.colorClass)} 
              style={{ width: `${progress.value}%` }} 
            />
          </div>
        </div>
      )}

      {progress && isCircular && (
        <div className="mt-auto flex items-center justify-between gap-2">
          {progress.label && <span className="text-[10px] font-medium text-text-muted leading-tight truncate min-w-0">{progress.label}</span>}
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-border" />
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" fill="transparent"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress.value / 100)}`}
                className={cn("transition-all duration-1000 ease-out", progress.colorClass)} 
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-text-primary font-mono">{progress.value}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
