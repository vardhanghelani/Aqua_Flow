import { useEffect, useState } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { DriverCollection, Driver, Customer } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/data/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { IndianRupee } from 'lucide-react';

export function CollectionsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<DriverCollection[]>([]);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    driverId: '', customerId: '', amount: '', paymentMethod: 'cash', referenceNumber: '', notes: '',
  });

  const load = () => {
    api.getCollections().then((d) => setItems(d.items));
    api.getCollectionReport().then(setReport);
  };

  useEffect(() => { load(); api.getDrivers().then(setDrivers); api.getCustomers().then(setCustomers); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordCollection({
        ...form,
        amount: parseFloat(form.amount),
        createPayment: false,
      });
      toast('Collection recorded');
      setShowForm(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const handleReconcile = async (id: string) => {
    try {
      await api.reconcileCollection(id);
      toast('Reconciled');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const summary = report?.summary as { total?: number; unreconciled?: number } | undefined;

  const columns: Column<DriverCollection>[] = [
    { key: 'date', header: 'Date', cell: (c) => formatDate(c.collectionDate) },
    { key: 'driver', header: 'Driver', cell: (c) => (c.driverId as Driver)?.name ?? '—' },
    { key: 'customer', header: 'Customer', cell: (c) => (c.customerId as Customer)?.shopName ?? '—' },
    { key: 'amount', header: 'Amount', cell: (c) => formatCurrency(c.amount) },
    { key: 'method', header: 'Method', cell: (c) => c.paymentMethod.toUpperCase() },
    { key: 'status', header: 'Status', cell: (c) => <Badge variant={c.reconciled ? 'success' : 'warning'}>{c.reconciled ? 'Reconciled' : 'Pending'}</Badge> },
    {
      key: 'actions',
      header: '',
      cell: (c) => !c.reconciled ? (
        <Button size="sm" variant="outline" onClick={() => handleReconcile(c._id)}><CheckCircle className="h-3 w-3" /></Button>
      ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Driver Collections"
        description="Cash, UPI, and cheque collections with reconciliation"
        action={<Button onClick={() => setShowForm(!showForm)}><Plus className="mr-1 h-4 w-4" />Record</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Collected" value={formatCurrency(summary?.total ?? 0)} icon={IndianRupee} />
        <StatCard label="Unreconciled" value={summary?.unreconciled ?? 0} icon={IndianRupee} iconColor="warning" />
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <select className="h-10 rounded-md border px-3 text-sm" required value={form.driverId} onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}>
                <option value="">Select driver</option>
                {drivers.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <select className="h-10 rounded-md border px-3 text-sm" value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}>
                <option value="">Customer (optional)</option>
                {customers.map((c) => <option key={c._id} value={c._id}>{c.shopName}</option>)}
              </select>
              <input className="h-10 rounded-md border px-3 text-sm" placeholder="Amount" type="number" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              <select className="h-10 rounded-md border px-3 text-sm" value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
              <input className="h-10 rounded-md border px-3 text-sm" placeholder="Reference" value={form.referenceNumber} onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))} />
              <Button type="submit">Save Collection</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable data={items} columns={columns} emptyMessage="No collections recorded" />
    </div>
  );
}
