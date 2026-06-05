import { useEffect, useState, useCallback } from 'react';

import { MapPin, Receipt, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { api } from '@/lib/api';

import type { TodayDeliveryItem } from '@/types';

import { DeliveryCard } from '@/components/cards/DeliveryCard';

import { EmptyState } from '@/components/feedback/EmptyState';

import { useToast } from '@/hooks/useToast';



interface RowState {

  status: 'delivered' | 'not_delivered' | 'pending';

  filledGiven: number;

  emptyReturned: number;

  remarks: string;

}



export function DeliveriesPage() {

  const { toast } = useToast();

  const [items, setItems] = useState<TodayDeliveryItem[]>([]);

  const [summary, setSummary] = useState<Record<string, number | string> | null>(null);

  const [rows, setRows] = useState<Record<string, RowState>>({});

  const [saving, setSaving] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showSettlement, setShowSettlement] = useState(false);

  const [settlementBusy, setSettlementBusy] = useState(false);



  const load = useCallback(() => {
    api.getTodayDeliveries().then((data) => {
      setItems(data);
      const initial: Record<string, RowState> = {};
      data.forEach(({ customer, delivery }) => {
        initial[customer._id] = {
          status: delivery?.status ?? 'pending',
          filledGiven: delivery?.filledGiven ?? 1,
          emptyReturned: delivery?.emptyReturned ?? 1,
          remarks: delivery?.remarks ?? '',
        };
      });
      setRows(initial);
    });
    api.getTodaySummary().then(setSummary);
  }, []);

  useEffect(() => {
    load();
    api.getTodayDeliveries().then((data) => {
      const firstPending = data.find(({ delivery }) => (delivery?.status ?? 'pending') === 'pending');
      if (firstPending) setExpandedId(firstPending.customer._id);
    });
  }, [load]);



  const updateRow = (id: string, patch: Partial<RowState>) => {

    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  };



  const goToNextPending = (currentId: string) => {

    const idx = items.findIndex(({ customer }) => customer._id === currentId);

    const next = items.slice(idx + 1).find(({ customer, delivery }) => {

      const st = rows[customer._id]?.status ?? delivery?.status ?? 'pending';

      return st === 'pending';

    });

    setExpandedId(next ? next.customer._id : null);

  };



  const save = async (customerId: string, status: 'delivered' | 'not_delivered') => {

    setSaving(customerId);

    try {

      const row = rows[customerId];

      await api.saveDelivery({

        customerId,

        status,

        filledGiven: status === 'delivered' ? row.filledGiven : 0,

        emptyReturned: status === 'delivered' ? row.emptyReturned : 0,

        remarks: row.remarks,

      });

      updateRow(customerId, { status });

      toast(status === 'delivered' ? 'Delivery saved' : 'Marked as not delivered', status === 'delivered' ? 'success' : 'error');

      if (status === 'delivered') {

        goToNextPending(customerId);

      }

      load();

    } catch (err) {

      toast(err instanceof Error ? err.message : 'Failed to save', 'error');

    } finally {

      setSaving(null);

    }

  };



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

            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />

          </div>

        </div>

      )}



      <div className="mb-5 space-y-3">

        {pendingItems.map(({ customer, delivery }) => {

          const row = rows[customer._id] ?? { status: 'pending', filledGiven: 1, emptyReturned: 1, remarks: '' };

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

              const row = rows[customer._id] ?? { status: 'pending', filledGiven: 1, emptyReturned: 1, remarks: '' };

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

                  onNext={() => goToNextPending(customer._id)}

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


