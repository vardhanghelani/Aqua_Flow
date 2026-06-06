import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';

/** Hidden admin page — not linked in navigation. Requires PROVISION_SECRET on the server. */
export function ProvisionPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    provisionSecret: '',
    businessName: '',
    ownerName: '',
    loginId: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await api.provisionBusiness(form);
      toast(`Business "${result.organization.name}" created. Login as ${result.owner.loginId}`);
      navigate('/login');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create business', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-[#E5E7EB]">
        <CardHeader>
          <CardTitle>Create New Business</CardTitle>
          <p className="text-sm text-muted-foreground">
            Each business gets isolated data — areas, drivers, customers, invoices, and inventory are separate.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Provision secret</Label>
              <Input
                type="password"
                value={form.provisionSecret}
                onChange={(e) => setForm({ ...form, provisionSecret: e.target.value })}
                required
                className="mt-1.5 min-h-[44px]"
                placeholder="Server PROVISION_SECRET"
              />
            </div>
            <div>
              <Label>Business name</Label>
              <Input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                required
                className="mt-1.5 min-h-[44px]"
                placeholder="Shree Water Supply"
              />
            </div>
            <div>
              <Label>Owner name</Label>
              <Input
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                required
                className="mt-1.5 min-h-[44px]"
              />
            </div>
            <div>
              <Label>Owner login ID</Label>
              <Input
                value={form.loginId}
                onChange={(e) => setForm({ ...form, loginId: e.target.value })}
                required
                className="mt-1.5 min-h-[44px]"
                placeholder="owner2"
              />
            </div>
            <div>
              <Label>Owner password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="mt-1.5 min-h-[44px]"
              />
            </div>
            <Button type="submit" className="w-full min-h-[44px]" disabled={busy}>
              Create Business & Owner
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
