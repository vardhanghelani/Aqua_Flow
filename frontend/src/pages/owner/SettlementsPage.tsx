import { useEffect, useState } from 'react';
import { Check, X, Send } from 'lucide-react';
import { api } from '@/lib/api';
import type { Settlement, Driver } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/data/DataTable';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  draft: 'default',
  submitted: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

export function SettlementsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Settlement[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filter, setFilter] = useState({ status: '', driverId: '' });

  const load = () => {
    const params: Record<string, string> = {};
    if (filter.status) params.status = filter.status;
    if (filter.driverId) params.driverId = filter.driverId;
    api.getSettlements(params).then((d) => setItems(d.items));
  };

  useEffect(() => { load(); }, [filter.status, filter.driverId]);
  useEffect(() => { api.getDrivers().then(setDrivers); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'submit') => {
    try {
      if (action === 'approve') await api.approveSettlement(id);
      else if (action === 'reject') await api.rejectSettlement(id, 'Needs correction');
      else await api.submitSettlement(id);
      toast(`Settlement ${action}d`);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const columns: Column<Settlement>[] = [
    { key: 'date', header: 'Date', cell: (s) => formatDate(s.settlementDate) },
    { key: 'driver', header: 'Driver', cell: (s) => (s.driverId as Driver)?.name ?? '—' },
    { key: 'opening', header: 'Opening', cell: (s) => s.openingStock },
    { key: 'delivered', header: 'Delivered', cell: (s) => s.deliveriesMade },
    { key: 'returns', header: 'Returns', cell: (s) => s.emptyReturns },
    { key: 'closing', header: 'Closing', cell: (s) => s.closingStock },
    { key: 'variance', header: 'Variance', cell: (s) => <span className={s.variance !== 0 ? 'text-destructive font-medium' : ''}>{s.variance}</span> },
    { key: 'cash', header: 'Cash', cell: (s) => `₹${s.cashCollected}` },
    { key: 'status', header: 'Status', cell: (s) => <Badge variant={statusVariant[s.status]}>{s.status}</Badge> },
    {
      key: 'actions',
      header: '',
      cell: (s) => (
        <div className="flex gap-1">
          {s.status === 'submitted' && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleAction(s._id, 'approve')}><Check className="h-3 w-3" /></Button>
              <Button size="sm" variant="outline" onClick={() => handleAction(s._id, 'reject')}><X className="h-3 w-3" /></Button>
            </>
          )}
          {s.status === 'draft' && (
            <Button size="sm" variant="outline" onClick={() => handleAction(s._id, 'submit')}><Send className="h-3 w-3" /></Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Driver Settlements"
        description="Daily stock reconciliation and owner approval"
        action={
          <Button variant="outline" size="sm" onClick={async () => {
            const today = new Date().toISOString().slice(0, 10);
            const drivers = await api.getDrivers();
            if (!drivers[0]) return toast('No drivers', 'error');
            await api.upsertSettlement({ driverId: drivers[0]._id, settlementDate: today, openingStock: 0, closingStock: 0 });
            toast('Draft settlement created');
            load();
          }}>Create Draft</Button>
        }
      />
      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-3 pt-4">
          <select className="h-10 rounded-md border px-3 text-sm" value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="h-10 rounded-md border px-3 text-sm" value={filter.driverId} onChange={(e) => setFilter((f) => ({ ...f, driverId: e.target.value }))}>
            <option value="">All drivers</option>
            {drivers.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </CardContent>
      </Card>
      <DataTable data={items} columns={columns} emptyMessage="No settlements yet" />
    </div>
  );
}
