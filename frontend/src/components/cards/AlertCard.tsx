import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alert } from '@/types';

const config = {
  critical: {
    icon: AlertCircle,
    className: 'border-destructive/30 bg-destructive/5',
    iconClass: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-warning/30 bg-warning/5',
    iconClass: 'text-warning',
  },
  info: {
    icon: Info,
    className: 'border-info/30 bg-info/5',
    iconClass: 'text-info',
  },
};

export function AlertCard({ alert }: { alert: Alert }) {
  const c = config[alert.severity];
  const Icon = c.icon;

  return (
    <div className={cn('flex items-start gap-3 rounded-md border px-4 py-3', c.className)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', c.iconClass)} />
      <p className="text-sm text-foreground">{alert.message}</p>
    </div>
  );
}
