import { useEffect, useState } from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Driver } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', loginId: '', password: '' });

  const load = () => api.getDrivers().then(setDrivers);
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createDriver(form);
    setForm({ name: '', mobile: '', loginId: '', password: '' });
    setShowForm(false);
    load();
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Master Data"
        title="Drivers"
        description="Manage delivery drivers"
        action={<Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" />Add Driver</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required /></div>
              <div><Label>Login ID</Label><Input value={form.loginId} onChange={(e) => setForm({ ...form, loginId: e.target.value })} placeholder="driver3" /></div>
              <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div className="sm:col-span-2"><Button type="submit">Save Driver</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">Name</th>
                <th className="pb-2">Mobile</th>
                <th className="pb-2">Login ID</th>
                <th className="pb-2">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d._id} className="border-b">
                  <td className="py-3 font-medium">{d.name}</td>
                  <td className="py-3">{d.mobile}</td>
                  <td className="py-3">{d.userId?.loginId || '—'}</td>
                  <td className="py-3"><Badge variant={d.isActive ? 'success' : 'destructive'}>{d.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="py-3">
                    <Link to={`/drivers/${d._id}/performance`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      <BarChart3 className="h-4 w-4" />Performance
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
