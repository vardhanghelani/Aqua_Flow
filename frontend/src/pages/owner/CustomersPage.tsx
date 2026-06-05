import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Area, Customer } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/data/DataTable';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

export function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [areaFilter, setAreaFilter] = useState('');
  const [form, setForm] = useState({
    name: '', shopName: '', mobile: '', address: '', areaId: '', customPrice: '',
    latitude: '', longitude: '', googleMapsUrl: '', locationNotes: '',
  });

  const load = () => {
    api.getCustomers(areaFilter ? { areaId: areaFilter } : undefined).then(setCustomers);
    api.getAreas().then(setAreas);
  };
  useEffect(() => { load(); }, [areaFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createCustomer({
      ...form,
      customPrice: form.customPrice ? parseFloat(form.customPrice) : undefined,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      googleMapsUrl: form.googleMapsUrl || undefined,
      locationNotes: form.locationNotes || undefined,
    });
    toast('Customer added successfully');
    setForm({ name: '', shopName: '', mobile: '', address: '', areaId: '', customPrice: '', latitude: '', longitude: '', googleMapsUrl: '', locationNotes: '' });
    setShowForm(false);
    load();
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      sortValue: (c) => c.name,
      cell: (c) => (
        <div>
          <p className="font-medium">{c.name}</p>
          <p className="text-xs text-muted-foreground">{c.shopName}</p>
        </div>
      ),
    },
    {
      key: 'area',
      header: 'Area',
      sortable: true,
      sortValue: (c) => (c.areaId as Area)?.name ?? '',
      cell: (c) => (c.areaId as Area)?.name ?? '—',
    },
    { key: 'mobile', header: 'Phone', cell: (c) => c.mobile },
    {
      key: 'balance',
      header: 'Cooler Balance',
      sortable: true,
      sortValue: (c) => c.currentBalance,
      cell: (c) => (
        <span className={c.currentBalance > 10 ? 'font-semibold text-warning' : ''}>{c.currentBalance}</span>
      ),
    },
    {
      key: 'lastDelivery',
      header: 'Last Delivery',
      sortable: true,
      sortValue: (c) => c.lastDeliveryDate ?? '',
      cell: (c) => c.lastDeliveryDate ? formatDate(c.lastDeliveryDate) : '—',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => (
        <div className="flex items-center gap-2">
          <Badge variant={c.status === 'active' ? 'success' : 'outline'}>{c.status}</Badge>
          {c.analyticsStatus && c.analyticsStatus !== 'active' && (
            <Badge variant={c.analyticsStatus === 'at_risk' ? 'warning' : 'destructive'}>{c.analyticsStatus}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (c) => <Link to={`/customers/${c._id}`} className="text-sm font-medium text-primary hover:underline">View</Link>,
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb="Master Data"
        title="Customers"
        description="Manage shops and businesses receiving water coolers"
        action={<Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" />Add Customer</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><Label>Shop Name</Label><Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required /></div>
              <div><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
              <div>
                <Label>Area</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })} required>
                  <option value="">Select area</option>
                  {areas.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
              <div><Label>Custom Price (₹)</Label><Input type="number" value={form.customPrice} onChange={(e) => setForm({ ...form, customPrice: e.target.value })} placeholder="Optional override" /></div>
              <div className="flex items-end gap-2 sm:col-span-2">
                <Button type="submit">Save Customer</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {customers.length === 0 && !showForm ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Add your first customer to start tracking deliveries and billing."
          action={{ label: 'Add Customer', onClick: () => setShowForm(true) }}
        />
      ) : (
        <DataTable
          data={customers}
          columns={columns}
          searchPlaceholder="Search by name, shop, phone..."
          searchFilter={(c, q) =>
            c.name.toLowerCase().includes(q) ||
            c.shopName.toLowerCase().includes(q) ||
            c.mobile.includes(q)
          }
          toolbar={
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="">All Areas</option>
              {areas.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          }
          emptyMessage="No customers match your search"
        />
      )}
    </div>
  );
}
