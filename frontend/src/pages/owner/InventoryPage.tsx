import { useEffect, useState } from 'react';
import { Warehouse, Users, Truck, AlertTriangle, Package, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { InventorySnapshot } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InventoryCard } from '@/components/cards/InventoryCard';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';

export function InventoryPage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventorySnapshot | null>(null);
  const [settings, setSettings] = useState({ totalCoolersOwned: '', warehouseStock: '', inCirculation: '' });

  const load = () => api.getInventory().then((data) => {
    setInventory(data);
    setSettings({
      totalCoolersOwned: String(data.totalCoolersOwned),
      warehouseStock: String(data.warehouseStock),
      inCirculation: String(data.inCirculation),
    });
  });
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateInventorySettings({
      totalCoolersOwned: parseInt(settings.totalCoolersOwned),
      warehouseStock: parseInt(settings.warehouseStock),
      inCirculation: parseInt(settings.inCirculation),
    });
    toast('Inventory settings updated');
    load();
  };

  if (!inventory) return <div className="p-8 text-muted-foreground">Loading inventory...</div>;

  return (
    <div>
      <PageHeader
        breadcrumb="Operations"
        title="Cooler Inventory"
        description="Warehouse stock + customer holdings must equal total coolers owned"
        action={
          <Badge variant={inventory.isBalanced ? 'success' : 'destructive'} className="text-sm px-3 py-1">
            {inventory.isBalanced ? (
              <><CheckCircle2 className="mr-1 h-3.5 w-3.5 inline" />Balanced</>
            ) : (
              <><AlertTriangle className="mr-1 h-3.5 w-3.5 inline" />{inventory.missingCoolers} unaccounted</>
            )}
          </Badge>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InventoryCard label="Total Coolers Owned" value={inventory.totalCoolersOwned} icon={Package} />
        <InventoryCard label="Warehouse Stock" value={inventory.warehouseStock} icon={Warehouse} status={inventory.warehouseStock < 50 ? 'warning' : 'normal'} description="Filled + empty in warehouse" />
        <InventoryCard label="With Customers" value={inventory.customerHoldings} icon={Users} status="success" description="Currently held by shops" />
        <InventoryCard label="In Circulation" value={inventory.inCirculation} icon={Truck} description="Loaded with drivers" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Inventory Reconciliation</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Warehouse Stock</span>
                <span className="font-medium">{inventory.warehouseStock}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Customer Holdings</span>
                <span className="font-medium">+ {inventory.customerHoldings}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">In Circulation</span>
                <span className="font-medium">+ {inventory.inCirculation}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Owned</span>
                <span className="font-semibold">{inventory.totalCoolersOwned}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-medium">Missing / Unaccounted</span>
                <span className={inventory.missingCoolers !== 0 ? 'font-bold text-destructive' : 'font-bold text-success'}>
                  {inventory.missingCoolers}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Update Inventory Settings</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div><Label>Total Coolers Owned</Label><Input type="number" value={settings.totalCoolersOwned} onChange={(e) => setSettings({ ...settings, totalCoolersOwned: e.target.value })} /></div>
              <div><Label>Warehouse Stock</Label><Input type="number" value={settings.warehouseStock} onChange={(e) => setSettings({ ...settings, warehouseStock: e.target.value })} /></div>
              <div><Label>In Circulation (with drivers)</Label><Input type="number" value={settings.inCirculation} onChange={(e) => setSettings({ ...settings, inCirculation: e.target.value })} /></div>
              <Button type="submit">Save Settings</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
