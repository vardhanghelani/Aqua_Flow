import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OperationCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  to: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variants = {
  default: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};

export function OperationCard({ label, value, subtext, to, icon: Icon, variant = 'default' }: OperationCardProps) {
  return (
    <Link
      to={to}
      className="flex min-h-[88px] flex-col justify-between rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm transition-colors active:bg-muted/30 hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={cn('h-4 w-4 shrink-0', variants[variant])} />
      </div>
      <div>
        <p className={cn('text-2xl font-bold leading-none', variants[variant])}>{value}</p>
        {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </Link>
  );
}
