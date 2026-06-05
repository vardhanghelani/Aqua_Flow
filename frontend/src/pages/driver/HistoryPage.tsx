import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { api } from '@/lib/api';
import type { Delivery } from '@/types';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';

export function HistoryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    api.getDeliveryHistory({ limit: '100' }).then((d) => setDeliveries(d.items));
  }, []);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5">
        <p className="text-sm font-medium text-muted-foreground">Past deliveries</p>
        <h1 className="text-2xl font-bold text-[#111827]">History</h1>
      </div>

      {deliveries.length === 0 ? (
        <EmptyState icon={History} title="No delivery history" description="Your past delivery records will appear here." />
      ) : (
        <div className="space-y-3">
          {deliveries.map((d) => (
            <div key={d._id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#111827]">{formatDate(d.deliveryDate)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Given {d.filledGiven} · Returned {d.emptyReturned}
                  </p>
                </div>
                <Badge variant={d.status === 'delivered' ? 'success' : 'destructive'}>
                  {d.status === 'delivered' ? 'Delivered' : 'Skipped'}
                </Badge>
              </div>
              {d.status === 'delivered' && (
                <p className="mt-2 text-sm font-medium text-primary">{formatCurrency(d.billableAmount)}</p>
              )}
              {d.remarks && <p className="mt-1 text-xs text-muted-foreground">{d.remarks}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
