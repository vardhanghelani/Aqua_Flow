import { useEffect, useState } from 'react';
import { Plus, BarChart3, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Driver } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';

const emptyForm = () => ({ name: '', mobile: '', loginId: '', password: '', isActive: true });

export function DriversPage() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);

  const load = () => api.getDrivers().then(setDrivers);
  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (driver: Driver) => {
    setEditingId(driver._id);
    setShowForm(false);
    setForm({
      name: driver.name,
      mobile: driver.mobile,
      loginId: driver.userId?.loginId ?? '',
      password: '',
      isActive: driver.isActive,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createDriver({
        name: form.name,
        mobile: form.mobile,
        loginId: form.loginId,
        password: form.password,
      });
      toast('Driver added');
      resetForm();
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add driver', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setBusy(true);
    try {
      const payload: Record<string, string | boolean> = {
        name: form.name,
        mobile: form.mobile,
        isActive: form.isActive,
      };
      if (form.loginId.trim()) payload.loginId = form.loginId.trim();
      if (form.password.trim()) payload.password = form.password;
      await api.updateDriver(editingId, payload);
      toast('Driver updated');
      resetForm();
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update driver', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (driver: Driver) => {
    if (!window.confirm(`Remove ${driver.name}? Their area assignment will end and login will be disabled.`)) return;
    setBusy(true);
    try {
      await api.deleteDriver(driver._id);
      toast('Driver removed');
      if (editingId === driver._id) resetForm();
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove driver', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumb="Customers"
        title="Drivers"
        description="Add, edit, or remove delivery drivers"
        action={
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 border-[#E5E7EB]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New driver</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Mobile" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} required />
              <Field label="Login ID" value={form.loginId} onChange={(v) => setForm({ ...form, loginId: v })} placeholder="driver3" />
              <Field label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={busy}>
                  Save Driver
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
            <CardTitle className="text-base">Edit driver</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Mobile" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} required />
              <Field label="Login ID" value={form.loginId} onChange={(v) => setForm({ ...form, loginId: v })} />
              <Field
                label="New password"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                type="password"
                placeholder="Leave blank to keep current"
              />
              <label className="flex min-h-[44px] items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                Active (can log in and receive deliveries)
              </label>
              <div className="flex gap-2 sm:col-span-2">
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

      <div className="space-y-3">
        {drivers.map((d) => (
          <Card key={d._id} className="border-[#E5E7EB]">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{d.name}</h3>
                  <Badge variant={d.isActive ? 'success' : 'destructive'}>{d.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {d.mobile} · Login: {d.userId?.loginId || '—'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => startEdit(d)} disabled={busy}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="min-h-[44px] text-destructive" onClick={() => handleRemove(d)} disabled={busy}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remove
                </Button>
                <Link to={`/drivers/${d._id}/performance`}>
                  <Button variant="ghost" size="sm" className="min-h-[44px]">
                    <BarChart3 className="mr-1 h-4 w-4" />
                    Performance
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 min-h-[44px]"
      />
    </div>
  );
}
