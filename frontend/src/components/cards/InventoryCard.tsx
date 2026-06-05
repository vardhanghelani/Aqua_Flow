import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  status?: 'normal' | 'warning' | 'danger' | 'success';
  description?: string;
}

const statusStyles = {
  normal: 'border-border',
  warning: 'border-warning/40 bg-warning/5',
  danger: 'border-destructive/40 bg-destructive/5',
  success: 'border-success/40 bg-success/5',
};

const valueStyles = {
  normal: 'text-foreground',
  warning: 'text-warning',
  danger: 'text-destructive',
  success: 'text-success',
};

export function InventoryCard({ label, value, icon: Icon, status = 'normal', description }: InventoryCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-5 shadow-card', statusStyles[status])}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className={cn('erp-kpi-value mt-3', valueStyles[status])}>{value.toLocaleString('en-IN')}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
