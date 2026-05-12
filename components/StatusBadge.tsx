import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle, FileWarning } from 'lucide-react';

export type StatusType = 'pendente' | 'regularizado' | 'divergente' | 'integrado' | 'em_fila' | 'falha' | 'reprocessando' | 'processando' | 'aguardando';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    pendente: {
      label: 'Pendente',
      icon: Clock,
      classes: 'bg-amber-500/10 text-amber-500'
    },
    aguardando: {
      label: 'Aguardando',
      icon: Clock,
      classes: 'bg-amber-500/10 text-amber-500'
    },
    regularizado: {
      label: 'Aprovado',
      icon: CheckCircle2,
      classes: 'bg-emerald-500/10 text-emerald-500'
    },
    integrado: {
      label: 'Integrado',
      icon: CheckCircle2,
      classes: 'bg-emerald-500/10 text-emerald-400'
    },
    divergente: {
      label: 'Divergente',
      icon: FileWarning,
      classes: 'bg-rose-500/10 text-rose-500'
    },
    falha: {
      label: 'Falha',
      icon: XCircle,
      classes: 'bg-rose-500/10 text-rose-400'
    },
    em_fila: {
      label: 'Na Fila',
      icon: RefreshCw,
      classes: 'bg-cyan-500/10 text-cyan-400'
    },
    processando: {
      label: 'Processando',
      icon: RefreshCw,
      classes: 'bg-primary/10 text-primary animate-pulse'
    },
    reprocessando: {
      label: 'Retry',
      icon: RefreshCw,
      classes: 'bg-violet-500/10 text-violet-400'
    }
  };

  const current = config[status] || config.pendente;
  const Icon = current.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 text-[9px] uppercase font-bold tracking-[0.08em]",
      current.classes,
      className
    )}>
      <Icon className="w-3 h-3" />
      {current.label}
    </span>
  );
}
