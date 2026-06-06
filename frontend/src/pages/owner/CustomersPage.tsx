import { useEffect, useState } from 'react';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Area, Customer } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/data/DataTable';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

const emptyForm = () => ({
  name: '',
  shopName: '',
  mobile: '',
  address: '',
  areaId: '',
  customPrice: '',
  latitude: '',
  longitude: '',
  googleMapsUrl: '',
  locationNotes: '',
  status: 'active' as 'active' | 'inactive',
});

function areaIdOf(customer: Customer) {
  return typeof customer.areaId === 'string' ? customer.areaId : customer.areaId._id;
}

function CustomerFormFields({
  form,
  setForm,
  areas,
  showStatus,
}: {
  form: ReturnType<typeof emptyForm>;
  setForm: (f: ReturnType<typeof emptyForm>) => void;
  areas: Area[];
  showStatus?: boolean;
}) {
  return (
    <>
      <div>
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5 min-h-[44px]" />
      </div>
      <div>
        <Label>Shop Name</Label>
        <Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required className="mt-1.5 min-h-[44px]" />
      </div>
      <div>
        <Label>Mobile</Label>
        <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required className="mt-1.5 min-h-[44px]" />
      </div>
      <div>
        <Label>Address</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required className="mt-1.5 min-h-[44px]" />
      </div>
      <div>
        <Label>Area</Label>
        <select
          className="mt-1.5 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.areaId}
          onChange={(e) => setForm({ ...form, areaId: e.target.value })}
          required
        >
          <option value="">Select area</option>
          {areas.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Custom Price (₹)</Label>
        <Input
          type="number"
          value={form.customPrice}
          onChange={(e) => setForm({ ...form, customPrice: e.target.value })}
          placeholder="Optional override"
          className="mt-1.5 min-h-[44px]"
        />
      </div>
      {showStatus && (
        <div>
          <Label>Status</Label>
          <select
            className="mt-1.5 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}
    </>
  );
}

export function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.getCustomers(areaFilter ? { areaId: areaFilter } : undefined).then(setCustomers);
    api.getAreas().then(setAreas);
  };
  useEffect(() => {
    load();
  }, [areaFilter]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer._id);
    setShowForm(false);
    setForm({
      name: customer.name,
      shopName: customer.shopName,
      mobile: customer.mobile,
      address: customer.address,
      areaId: areaIdOf(customer),
      customPrice: customer.customPrice != null ? String(customer.customPrice) : '',
      latitude: customer.latitude != null ? String(customer.latitude) : '',
      longitude: customer.longitude != null ? String(customer.longitude) : '',
      googleMapsUrl: customer.googleMapsUrl ?? '',
      locationNotes: customer.locationNotes ?? '',
      status: customer.status,
    });
  };

  const buildPayload = () => ({
    name: form.name,
    shopName: form.shopName,
    mobile: form.mobile,
    address: form.address,
    areaId: form.areaId,
    customPrice: form.customPrice ? parseFloat(form.customPrice) : undefined,
    latitude: form.latitude ? parseFloat(form.latitude) : undefined,
    longitude: form.longitude ? parseFloat(form.longitude) : undefined,
    googleMapsUrl: form.googleMapsUrl || undefined,
    locationNotes: form.locationNotes || undefined,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createCustomer(buildPayload());
      toast('Customer added');
      resetForm();
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add customer', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setBusy(true);
    try {
      await api.updateCustomer(editingId, { ...buildPayload(), status: form.status });
      toast('Customer updated');
      resetForm();
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update customer', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (customer: Customer) => {
    if (!window.confirm(`Remove ${customer.shopName}? They will be archived and hidden from active lists.`)) return;
    setBusy(true);
    try {
      await api.deleteCustomer(customer._id);
      toast('Customer removed');
      if (editingId === customer._id) resetForm();
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove customer', 'error');
    } finally {
      setBusy(false);
    }
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
      cell: (c) => (c.lastDeliveryDate ? formatDate(c.lastDeliveryDate) : '—'),
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
      cell: (c) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="min-h-[36px]" onClick={() => startEdit(c)} disabled={busy}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="min-h-[36px] text-destructive" onClick={() => handleRemove(c)} disabled={busy}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
          <Link to={`/customers/${c._id}`} className="text-sm font-medium text-primary hover:underline">
            View
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb="Master Data"
        title="Customers"
        description="Add, edit, or remove shops receiving water coolers"
        action={
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 border-[#E5E7EB]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CustomerFormFields form={form} setForm={setForm} areas={areas} />
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={busy}>
                  Save Customer
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingId && (
        <Card className="mb-6 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Edit customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CustomerFormFields form={form} setForm={setForm} areas={areas} showStatus />
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={busy}>
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {customers.length === 0 && !showForm && !editingId ? (
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
            c.name.toLowerCase().includes(q) || c.shopName.toLowerCase().includes(q) || c.mobile.includes(q)
          }
          toolbar={
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="">All Areas</option>
              {areas.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          }
          emptyMessage="No customers match your search"
        />
      )}
    </div>
  );
}
