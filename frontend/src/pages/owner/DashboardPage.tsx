import { useEffect, useState } from 'react';
import {
  Truck,
  Clock,
  Wallet,
  IndianRupee,
  Warehouse,
  AlertTriangle,
  UserPlus,
  Package,
  FileText,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { OperationCard } from '@/components/cards/OperationCard';
import { QuickActionButton } from '@/components/cards/QuickActionButton';
import { AlertCard } from '@/components/cards/AlertCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Alert, Customer } from '@/types';

export function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [collectionsPending, setCollectionsPending] = useState(0);
  const [deliveriesPending, setDeliveriesPending] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      api.getOperationalDashboard(),
      api.getAlerts(),
      api.getCollections({ reconciled: 'false' }),
      api.getDeliveryHistory({ from: today, to: today, limit: '500' }),
    ]).then(([dash, alertList, collections, todayDeliveries]) => {
      setData(dash);
      setAlerts(alertList);
      setCollectionsPending(collections.total);

      const s1 = dash.section1 as Record<string, number>;
      const delivered = todayDeliveries.items.filter((d) => d.status === 'delivered').length;
      const skipped = todayDeliveries.items.filter((d) => d.status === 'not_delivered').length;
      setDeliveriesPending(Math.max(0, Number(s1.activeCustomers ?? 0) - delivered - skipped));
    });
  }, []);

  if (!data) {
    return <div className="py-12 text-center text-muted-foreground">Loading today&apos;s operations...</div>;
  }

  const s1 = data.section1 as Record<string, number | boolean>;
  const s3 = data.section3 as {
    inactiveCustomers: Customer[];
    inventoryAlerts: Array<{ type: string; message: string }>;
  };

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Today</p>
        <h1 className="text-2xl font-bold text-[#111827] sm:text-3xl">{todayLabel}</h1>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Today&apos;s Operations
        </h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          <OperationCard
            label="Deliveries Completed"
            value={Number(s1.todayDeliveries)}
            subtext={`${s1.todayQuantity} coolers`}
            to="/deliveries"
            icon={Truck}
            variant="success"
          />
          <OperationCard
            label="Deliveries Pending"
            value={deliveriesPending}
            subtext="Active customers not yet delivered"
            to="/deliveries"
            icon={Clock}
            variant="warning"
          />
          <OperationCard
            label="Collections Pending"
            value={collectionsPending}
            subtext="Awaiting reconciliation"
            to="/collections"
            icon={Wallet}
            variant="warning"
          />
          <OperationCard
            label="Outstanding Payments"
            value={formatCurrency(Number(s1.outstandingPayments))}
            subtext={`${s1.outstandingInvoiceCount} invoices`}
            to="/payments"
            icon={IndianRupee}
            variant="danger"
          />
          <OperationCard
            label="Inventory Status"
            value={s1.inventoryHealthy ? 'Healthy' : 'Check'}
            subtext={`${s1.warehouseStock} in warehouse`}
            to="/inventory"
            icon={Warehouse}
            variant={s1.inventoryHealthy ? 'success' : 'danger'}
          />
          <OperationCard
            label="Alerts"
            value={alerts.length}
            subtext="Needs attention"
            to="/customers"
            icon={AlertTriangle}
            variant={alerts.length > 0 ? 'danger' : 'default'}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Actions</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <QuickActionButton label="Assign Driver" to="/assignments" icon={UserPlus} />
          <QuickActionButton label="Open Deliveries" to="/deliveries" icon={Package} />
          <QuickActionButton label="Generate Invoice" to="/invoices" icon={FileText} />
          <QuickActionButton label="Record Payment" to="/payments" icon={IndianRupee} />
          <QuickActionButton label="Customer Search" to="/customers" icon={Search} className="sm:col-span-1 col-span-2" />
        </div>
      </section>

      {(alerts.length > 0 || (s3.inactiveCustomers ?? []).length > 0 || (s3.inventoryAlerts ?? []).length > 0) && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alerts</h2>
            <Link to="/reports" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View reports <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {s3.inventoryAlerts?.map((a, i) => (
              <AlertCard key={`inv-${i}`} alert={{ ...a, severity: 'critical' }} />
            ))}
            {(s3.inactiveCustomers ?? []).slice(0, 4).map((c) => (
              <Link
                key={c._id}
                to={`/customers/${c._id}`}
                className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm hover:bg-muted/30"
              >
                <span className="font-medium">{c.shopName}</span>
                <Badge variant={c.analyticsStatus === 'inactive' ? 'destructive' : 'warning'}>
                  {c.analyticsStatus ?? 'at risk'}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Card className="border-[#E5E7EB] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Performance &amp; trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Revenue charts, area performance, and driver analytics are in Reports.
          </p>
          <Link
            to="/reports"
            className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Open Reports
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
