import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  label: string;
  to: string;
  icon: LucideIcon;
  className?: string;
}

export function QuickActionButton({ label, to, icon: Icon, className }: QuickActionButtonProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] shadow-sm transition-colors active:bg-primary/5 hover:border-primary/40 hover:text-primary',
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 text-primary" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
