import { Check, X, MapPin, Package, Navigation, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NumberStepper } from '@/components/forms/NumberStepper';
import { cn, formatDaysAgo } from '@/lib/utils';
import type { Customer } from '@/types';

interface DeliveryCardProps {
  customer: Customer;
  filledGiven: number;
  emptyReturned: number;
  remarks: string;
  status: 'delivered' | 'not_delivered' | 'pending';
  saving: boolean;
  expanded: boolean;
  onToggle: () => void;
  onFilledChange: (v: number) => void;
  onReturnedChange: (v: number) => void;
  onRemarksChange: (v: string) => void;
  onDeliver: () => void;
  onNotDeliver: () => void;
  onNext?: () => void;
}

export function DeliveryCard({
  customer,
  filledGiven,
  emptyReturned,
  remarks,
  status,
  saving,
  expanded,
  onToggle,
  onFilledChange,
  onReturnedChange,
  onRemarksChange,
  onDeliver,
  onNotDeliver,
  onNext,
}: DeliveryCardProps) {
  const isDelivered = status === 'delivered';
  const isNotDelivered = status === 'not_delivered';
  const isDone = isDelivered || isNotDelivered;

  const mapsUrl =
    customer.googleMapsUrl ||
    (customer.latitude && customer.longitude
      ? `https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm',
        isDelivered && 'border-success/50',
        isNotDelivered && 'border-destructive/30 opacity-90'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left active:bg-muted/20"
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-tight text-[#111827]">{customer.shopName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Balance: <span className="font-semibold text-foreground">{customer.currentBalance}</span>
            {' · '}
            Last: {formatDaysAgo(customer.lastDeliveryDate)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {isDelivered && <Badge variant="success">Done</Badge>}
          {isNotDelivered && <Badge variant="destructive">Skipped</Badge>}
          {!isDone && <Badge variant="warning">Pending</Badge>}
          {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </div>
      </button>

      {!expanded && !isDone && (
        <div className="border-t px-4 pb-4">
          <Button variant="success" size="touch" className="w-full text-base" onClick={onToggle}>
            <Check className="h-5 w-5" />
            Delivered
          </Button>
        </div>
      )}

      {expanded && (
        <div className="space-y-4 border-t bg-muted/10 p-4">
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {customer.address}
          </p>

          {!isDone && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <NumberStepper label="Given" value={filledGiven} onChange={onFilledChange} size="large" />
                <NumberStepper label="Returned" value={emptyReturned} onChange={onReturnedChange} size="large" />
              </div>

              <Input
                value={remarks}
                onChange={(e) => onRemarksChange(e.target.value)}
                placeholder="Remarks (optional)"
                className="h-11 text-base"
              />

              <div className="flex flex-col gap-2">
                <Button variant="success" size="touch" className="w-full text-base" onClick={onDeliver} disabled={saving}>
                  <Check className="h-5 w-5" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" size="touch" className="w-full" onClick={onNotDeliver} disabled={saving}>
                  <X className="h-5 w-5" />
                  Not Delivered
                </Button>
              </div>
            </>
          )}

          {isDone && onNext && (
            <Button variant="default" size="touch" className="w-full" onClick={onNext}>
              Next Customer
            </Button>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Navigation className="h-4 w-4" />
            Open in Maps
          </a>
        </div>
      )}

      {expanded && isDone && !onNext && (
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            {isDelivered ? `Given ${filledGiven}, returned ${emptyReturned}` : 'Marked as not delivered'}
          </span>
        </div>
      )}
    </div>
  );
}
