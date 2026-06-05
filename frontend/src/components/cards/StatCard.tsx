import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info';
  trend?: { value: string; positive?: boolean };
}

const iconColors = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
};

export function StatCard({ label, value, subtext, icon: Icon, iconColor = 'primary', trend }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-card transition-shadow duration-150 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="erp-kpi-value mt-2 text-foreground">{value}</p>
          {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
          {trend && (
            <p className={cn('mt-1 text-xs font-medium', trend.positive ? 'text-success' : 'text-muted-foreground')}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md', iconColors[iconColor])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
