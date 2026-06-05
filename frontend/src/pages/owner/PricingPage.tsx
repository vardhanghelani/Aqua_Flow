import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export function PricingPage() {
  const [currentPrice, setCurrentPrice] = useState(0);
  const [newPrice, setNewPrice] = useState('');
  const [history, setHistory] = useState<Array<{ price: number; effectiveFrom: string; effectiveTo?: string }>>([]);

  const load = () => {
    api.getCurrentPrice().then((d) => setCurrentPrice(d.price));
    api.getPriceHistory().then(setHistory);
  };
  useEffect(() => { load(); }, []);

  const handleSetPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.setPrice(parseFloat(newPrice));
    setNewPrice('');
    load();
  };

  return (
    <div>
      <PageHeader title="Price Management" description="Price changes apply to new deliveries only — history preserved" />

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Current Price</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold text-primary">₹{currentPrice}</p><p className="text-sm text-muted-foreground">per cooler</p></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Set New Price</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSetPrice} className="flex gap-4">
              <div className="flex-1"><Label>New Price (₹)</Label><Input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required /></div>
              <div className="flex items-end"><Button type="submit">Update</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Price History</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">Price</th>
                <th className="pb-2">Effective From</th>
                <th className="pb-2">Effective To</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 font-medium">₹{h.price}</td>
                  <td className="py-2">{formatDate(h.effectiveFrom)}</td>
                  <td className="py-2">{h.effectiveTo ? formatDate(h.effectiveTo) : 'Current'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
