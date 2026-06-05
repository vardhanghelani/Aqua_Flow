import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

export function SettingsPage() {
  const { toast } = useToast();
  const [currentPrice, setCurrentPrice] = useState(0);
  const [newPrice, setNewPrice] = useState('');
  const [priceHistory, setPriceHistory] = useState<Array<{ price: number; effectiveFrom: string; effectiveTo?: string }>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, unknown>>>([]);

  const load = () => {
    api.getCurrentPrice().then((d) => setCurrentPrice(d.price));
    api.getPriceHistory().then(setPriceHistory);
    api.getAuditLogs().then((d) => setAuditLogs(d.items));
  };
  useEffect(() => { load(); }, []);

  const handleSetPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.setPrice(parseFloat(newPrice));
    toast('Price updated — applies to new deliveries only');
    setNewPrice('');
    load();
  };

  return (
    <div>
      <PageHeader breadcrumb="System" title="Settings" description="Pricing, audit trail, and system configuration" />

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cooler Pricing</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-3xl font-bold text-primary">₹{currentPrice}<span className="text-sm font-normal text-muted-foreground"> / cooler</span></p>
            <form onSubmit={handleSetPrice} className="flex gap-3">
              <div className="flex-1"><Label>New Price (₹)</Label><Input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required /></div>
              <div className="flex items-end"><Button type="submit">Update Price</Button></div>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">Price changes apply to new deliveries. Historical records are never recalculated.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Price History</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2">Price</th>
                  <th className="pb-2">From</th>
                  <th className="pb-2">To</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.map((h, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="py-2 font-medium">₹{h.price}</td>
                    <td className="py-2">{formatDate(h.effectiveFrom)}</td>
                    <td className="py-2">{h.effectiveTo ? formatDate(h.effectiveTo) : <Badge variant="success">Current</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">User</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Entity</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, i) => {
                const user = log.userId as { name?: string } | undefined;
                return (
                  <tr key={i} className="border-b border-border/60">
                    <td className="py-2.5">{new Date(log.createdAt as string).toLocaleString('en-IN')}</td>
                    <td className="py-2.5">{user?.name ?? '—'}</td>
                    <td className="py-2.5"><Badge>{log.action as string}</Badge></td>
                    <td className="py-2.5">{log.entityType as string}</td>
                  </tr>
                );
              })}
              {auditLogs.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No audit records yet</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
