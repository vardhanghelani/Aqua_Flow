import { useEffect, useState, useCallback, useRef } from 'react';
import { MapPin, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { TodayDeliveryItem } from '@/types';
import { DeliveryCard } from '@/components/cards/DeliveryCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DriverPageSkeleton } from '@/components/layout/DriverPageSkeleton';
import { useToast } from '@/hooks/useToast';
import { useDriverData } from '@/hooks/useDriverData';

interface RowState {
  status: 'delivered' | 'not_delivered' | 'pending';
  filledGiven: number;
  emptyReturned: number;
  remarks: string;
}

const defaultRow = (): RowState => ({
  status: 'pending',
  filledGiven: 1,
  emptyReturned: 1,
  remarks: '',
});

function buildRowsFromItems(data: TodayDeliveryItem[]) {
  const initial: Record<string, RowState> = {};
  data.forEach(({ customer, delivery }) => {
    initial[customer._id] = {
      status: delivery?.status ?? 'pending',
      filledGiven: delivery?.filledGiven ?? 1,
      emptyReturned: delivery?.emptyReturned ?? 1,
      remarks: delivery?.remarks ?? '',
    };
  });
  return initial;
}

export function DeliveriesPage() {
  const { toast } = useToast();
  const {
    todayItems,
    summary,
    loadingToday,
    patchCustomerAfterDelivery,
    updateSummaryCounts,
  } = useDriverData();
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSettlement, setShowSettlement] = useState(false);
  const [settlementBusy, setSettlementBusy] = useState(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const rowsInitialized = useRef(false);
  const items = todayItems ?? [];

  useEffect(() => {
    if (!todayItems || rowsInitialized.current) return;
    rowsInitialized.current = true;
    setRows(buildRowsFromItems(todayItems));
    const firstPending = todayItems.find(({ delivery }) => (delivery?.status ?? 'pending') === 'pending');
    if (firstPending) setExpandedId(firstPending.customer._id);
  }, [todayItems]);

  const updateRow = (id: string, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [id]: { ...(prev[id] ?? defaultRow()), ...patch } }));
  };

  const goToNextPending = useCallback(
    (currentId: string, nextRows: Record<string, RowState>) => {
      const idx = items.findIndex(({ customer }) => customer._id === currentId);
      const next = items.slice(idx + 1).find(({ customer }) => {
        const st = nextRows[customer._id]?.status ?? 'pending';
        return st === 'pending';
      });
      setExpandedId(next ? next.customer._id : null);
    },
    [items]
  );

  const save = async (
    customerId: string,
    status: 'delivered' | 'not_delivered',
    overrides?: Partial<Pick<RowState, 'filledGiven' | 'emptyReturned' | 'remarks'>>
  ) => {
    if (saving === customerId) return;

    const prevRow = rowsRef.current[customerId] ?? defaultRow();
    const filledGiven = status === 'delivered' ? (overrides?.filledGiven ?? prevRow.filledGiven) : 0;
    const emptyReturned = status === 'delivered' ? (overrides?.emptyReturned ?? prevRow.emptyReturned) : 0;
    const remarks = overrides?.remarks ?? prevRow.remarks;
    const wasPending = prevRow.status === 'pending';

    const optimisticRow: RowState = { status, filledGiven, emptyReturned, remarks };
    updateRow(customerId, optimisticRow);

    if (wasPending) {
      updateSummaryCounts({
        delivered: status === 'delivered' ? 1 : 0,
        notDelivered: status === 'not_delivered' ? 1 : 0,
        pending: -1,
      });
    }

    if (status === 'delivered') {
      patchCustomerAfterDelivery(customerId, { filledGiven, emptyReturned });
      goToNextPending(customerId, { ...rowsRef.current, [customerId]: optimisticRow });
    } else {
      setExpandedId(null);
    }

    setSaving(customerId);
    try {
      await api.saveDelivery({
        customerId,
        status,
        filledGiven,
        emptyReturned,
        remarks,
      });
    } catch (err) {
      updateRow(customerId, prevRow);
      if (wasPending) {
        updateSummaryCounts({
          delivered: status === 'delivered' ? -1 : 0,
          notDelivered: status === 'not_delivered' ? -1 : 0,
          pending: 1,
        });
      }
      setExpandedId(customerId);
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loadingToday && !todayItems) {
    return <DriverPageSkeleton />;
  }

  const total = Number(summary?.totalCustomers ?? 0);
  const delivered = Number(summary?.delivered ?? 0);
  const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

  const submitDailySettlement = async () => {
    setSettlementBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const s = await api.upsertSettlement({
        settlementDate: today,
        openingStock: Number(summary?.totalFilled ?? 0),
        closingStock: 0,
        notes: 'Auto-submitted from driver app',
      });
      await api.submitSettlement(s._id);
      toast('Daily settlement submitted for owner approval');
      setShowSettlement(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Settlement failed', 'error');
    } finally {
      setSettlementBusy(false);
    }
  };

  const pendingItems = items.filter(({ customer, delivery }) => {
    const st = rows[customer._id]?.status ?? delivery?.status ?? 'pending';
    return st === 'pending';
  });

  const doneItems = items.filter(({ customer, delivery }) => {
    const st = rows[customer._id]?.status ?? delivery?.status ?? 'pending';
    return st !== 'pending';
  });

  return (
    <div className="mx-auto max-w-lg lg:max-w-2xl">
      <div className="mb-5">
        <p className="text-sm font-medium text-muted-foreground">Your route</p>
        <h1 className="text-2xl font-bold text-[#111827]">Today&apos;s Customers</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {summary && (
        <div className="mb-5 rounded-xl border border-[#E5E7EB] bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-[#111827]">
              {delivered} of {total} completed
            </span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="mb-5 space-y-3">
        {pendingItems.map(({ customer, delivery }) => {
          const row = rows[customer._id] ?? defaultRow();
          const effectiveStatus = row.status === 'pending' && delivery ? delivery.status : row.status;
          return (
            <DeliveryCard
              key={customer._id}
              customer={customer}
              filledGiven={row.filledGiven}
              emptyReturned={row.emptyReturned}
              remarks={row.remarks}
              status={effectiveStatus}
              saving={saving === customer._id}
              expanded={expandedId === customer._id}
              onToggle={() => setExpandedId(expandedId === customer._id ? null : customer._id)}
              onFilledChange={(v) => updateRow(customer._id, { filledGiven: v })}
              onReturnedChange={(v) => updateRow(customer._id, { emptyReturned: v })}
              onRemarksChange={(v) => updateRow(customer._id, { remarks: v })}
              onQuickDeliver={() => save(customer._id, 'delivered', { filledGiven: 1, emptyReturned: 1 })}
              onDeliver={() => save(customer._id, 'delivered')}
              onNotDeliver={() => save(customer._id, 'not_delivered')}
            />
          );
        })}

        {items.length === 0 && (
          <EmptyState
            icon={MapPin}
            title="No customers in your area"
            description="Contact the owner to assign you to an area with active customers."
          />
        )}
      </div>

      {doneItems.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed today</p>
          <div className="space-y-2 opacity-80">
            {doneItems.map(({ customer, delivery }) => {
              const row = rows[customer._id] ?? defaultRow();
              const effectiveStatus = row.status === 'pending' && delivery ? delivery.status : row.status;
              return (
                <DeliveryCard
                  key={customer._id}
                  customer={customer}
                  filledGiven={row.filledGiven}
                  emptyReturned={row.emptyReturned}
                  remarks={row.remarks}
                  status={effectiveStatus}
                  saving={false}
                  expanded={expandedId === customer._id}
                  onToggle={() => setExpandedId(expandedId === customer._id ? null : customer._id)}
                  onFilledChange={() => {}}
                  onReturnedChange={() => {}}
                  onRemarksChange={() => {}}
                  onDeliver={() => {}}
                  onNotDeliver={() => {}}
                  onNext={() => goToNextPending(customer._id, rowsRef.current)}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <button
          type="button"
          onClick={() => setShowSettlement((s) => !s)}
          className="flex w-full items-center justify-between p-4 text-left text-sm font-medium"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Receipt className="h-4 w-4" />
            End-of-day settlement
          </span>
          {showSettlement ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showSettlement && (
          <div className="border-t px-4 pb-4">
            <p className="mb-3 text-sm text-muted-foreground">Submit stock reconciliation when your route is complete.</p>
            <Button size="touch" className="w-full" onClick={submitDailySettlement} disabled={settlementBusy}>
              {settlementBusy ? 'Submitting...' : 'Submit Settlement'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
