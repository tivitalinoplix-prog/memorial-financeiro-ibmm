'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  variant?: 'default' | 'hero' | 'gradient-teal' | 'gradient-rose' | 'gradient-violet' | 'gradient-amber';
  className?: string;
}

/* ── Animated Counter Hook ── */
function useCountUp(target: string, duration = 800) {
  const [display, setDisplay] = useState(target);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    
    const numMatch = target.match(/[\d.,]+/);
    if (!numMatch) {
      // No numeric content — just show target as-is (already initialized via useState)
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const numStr = numMatch[0].replace(/\./g, '').replace(',', '.');
        const num = parseFloat(numStr);
        if (isNaN(num)) { return; }
        
        const prefix = target.substring(0, numMatch.index);
        const suffix = target.substring((numMatch.index || 0) + numMatch[0].length);
        const startTime = performance.now();
        
        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          const current = num * eased;
          
          if (target.includes(',')) {
            const formatted = current.toLocaleString('pt-BR', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: numMatch[0].includes(',') ? 2 : 0 
            });
            setDisplay(`${prefix}${formatted}${suffix}`);
          } else {
            setDisplay(`${prefix}${Math.round(current).toLocaleString('pt-BR')}${suffix}`);
          }
          
          if (progress < 1) requestAnimationFrame(animate);
          else setDisplay(target);
        };
        
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { display, ref };
}

export function KpiCard({ title, value, icon: Icon, trend, progress, colorStyle = 'default', variant = 'default', className }: KpiCardProps) {
  const { display, ref } = useCountUp(value);

  const getIconColors = () => {
    switch (colorStyle) {
      case 'danger': return 'text-rose bg-rose/10';
      case 'success': return 'text-positive bg-positive/10';
      case 'warning': return 'text-amber bg-amber/10';
      case 'info': return 'text-info bg-info/10';
      default: return 'text-primary bg-primary-muted';
    }
  };

  const isGradient = variant.startsWith('gradient-');
  const isHero = variant === 'hero';
  const isCircular = progress?.type === 'circular';

  const getCardClasses = () => {
    if (isGradient) {
      return cn(
        variant === 'gradient-teal' && 'gradient-teal glow-teal',
        variant === 'gradient-rose' && 'gradient-rose glow-rose',
        variant === 'gradient-violet' && 'gradient-violet glow-violet',
        variant === 'gradient-amber' && 'gradient-amber glow-gold',
      );
    }
    if (isHero) return 'hero-balance';
    return 'bg-card border border-border card-interactive';
  };

  return (
    <div 
      ref={ref}
      className={cn(
        "p-5 transition-all duration-200 group cursor-default flex flex-col",
        getCardClasses(),
        className
      )}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h3 className={cn(
          "font-bold text-[10px] uppercase tracking-[0.08em] leading-tight min-w-0",
          isGradient ? "text-white/70" : "text-text-ghost"
        )}>
          {title}
        </h3>
        <div className={cn(
          "p-1.5 shrink-0",
          isGradient ? "bg-white/15 text-white" : getIconColors()
        )}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      
      <div className="flex flex-wrap items-end gap-3 mb-3 flex-1">
        <div className={cn(
          "text-2xl font-bold tracking-tight leading-none whitespace-nowrap truncate min-w-0 font-tabular-nums animate-count-up",
          isGradient ? "text-white" : "text-text-primary"
        )} style={{ fontFamily: 'var(--font-geist-sans, var(--font-sans))' }}>
          {display}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 shrink-0",
            isGradient 
              ? (trend.isUp ? "text-white bg-white/20" : "text-white bg-white/20")
              : (trend.isUp ? "text-positive bg-positive/10" : "text-rose bg-rose/10")
          )}>
            {trend.isUp ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>

      {progress && !isCircular && (
        <div className="mt-auto">
          {progress.label && (
            <div className="flex items-end justify-between gap-2 text-[10px] font-medium mb-1.5">
              <span className={cn(
                "truncate min-w-0 leading-tight",
                isGradient ? "text-white/60" : "text-text-muted"
              )}>
                {progress.label}
              </span>
              <span className={cn(
                "shrink-0 leading-tight font-mono",
                isGradient ? "text-white/80" : "text-text-muted"
              )}>
                {progress.value}%
              </span>
            </div>
          )}
          <div className={cn("h-1 w-full overflow-hidden", isGradient ? "bg-white/20" : "bg-border")}>
            <div 
              className={cn(
                "h-full animate-progress-fill",
                isGradient ? "bg-white/80" : progress.colorClass
              )} 
              style={{ width: `${progress.value}%` }} 
            />
          </div>
        </div>
      )}

      {progress && isCircular && (
        <div className="mt-auto flex items-center justify-between gap-2">
          {progress.label && (
            <span className={cn(
              "text-[10px] font-medium leading-tight truncate min-w-0",
              isGradient ? "text-white/60" : "text-text-muted"
            )}>
              {progress.label}
            </span>
          )}
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" fill="transparent" className={isGradient ? "text-white/20" : "text-border"} />
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" fill="transparent"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress.value / 100)}`}
                className={cn("transition-all duration-1000 ease-out", isGradient ? "text-white" : progress.colorClass)} 
              />
            </svg>
            <span className={cn(
              "absolute text-[9px] font-bold font-mono",
              isGradient ? "text-white" : "text-text-primary"
            )}>
              {progress.value}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
