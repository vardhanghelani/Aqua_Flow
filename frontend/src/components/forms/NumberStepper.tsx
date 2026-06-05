import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: 'default' | 'large';
}

export function NumberStepper({ value, onChange, min = 0, max = 99, label, size = 'default' }: NumberStepperProps) {
  const isLarge = size === 'large';

  return (
    <div>
      {label && <p className="mb-2 text-sm font-medium text-muted-foreground">{label}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            'flex items-center justify-center rounded-md border bg-background transition-colors hover:bg-muted disabled:opacity-40',
            isLarge ? 'erp-touch-target h-12 w-12' : 'h-10 w-10'
          )}
          aria-label="Decrease"
        >
          <Minus className={isLarge ? 'h-5 w-5' : 'h-4 w-4'} />
        </button>
        <span
          className={cn(
            'flex items-center justify-center rounded-md border bg-muted font-semibold tabular-nums',
            isLarge ? 'h-12 min-w-[56px] text-xl' : 'h-10 min-w-[48px] text-base'
          )}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            'flex items-center justify-center rounded-md border bg-background transition-colors hover:bg-muted disabled:opacity-40',
            isLarge ? 'erp-touch-target h-12 w-12' : 'h-10 w-10'
          )}
          aria-label="Increase"
        >
          <Plus className={isLarge ? 'h-5 w-5' : 'h-4 w-4'} />
        </button>
      </div>
    </div>
  );
}
