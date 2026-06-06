import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Area } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';

const emptyForm = () => ({ name: '', description: '', isActive: true });

export function AreasPage() {
  const { toast } = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);

  const load = () => api.getAreas().then(setAreas);
  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (area: Area) => {
    setEditingId(area._id);
    setShowForm(false);
    setForm({
      name: area.name,
      description: area.description ?? '',
      isActive: area.isActive,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createArea({ name: form.name, description: form.description });
      toast('Area added');
      resetForm();
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add area', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setBusy(true);
    try {
      await api.updateArea(editingId, {
        name: form.name,
        description: form.description,
        isActive: form.isActive,
      });
      toast('Area updated');
      resetForm();
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update area', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (area: Area) => {
    if (!window.confirm(`Remove ${area.name}? This only works if no customers are assigned to this area.`)) return;
    setBusy(true);
    try {
      await api.deleteArea(area._id);
      toast('Area removed');
      if (editingId === area._id) resetForm();
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove area', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Master Data"
        title="Areas"
        description="Add, edit, or remove delivery zones"
        action={
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Area
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 border-[#E5E7EB]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New area</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={busy}>
                  Save Area
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
            <CardTitle className="text-base">Edit area</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <label className="flex min-h-[44px] items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                Active (available for customer assignment)
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <Card key={area._id} className="border-[#E5E7EB]">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{area.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{area.description || 'No description'}</p>
                </div>
                <Badge variant={area.isActive ? 'success' : 'destructive'}>{area.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => startEdit(area)} disabled={busy}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="min-h-[44px] text-destructive" onClick={() => handleRemove(area)} disabled={busy}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remove
                </Button>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1.5 min-h-[44px]"
      />
    </div>
  );
}
