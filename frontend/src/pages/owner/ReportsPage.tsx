import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/data/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';

type Tab = 'customers' | 'areas' | 'drivers';

const CHART = { primary: '#2563EB', secondary: '#0F766E', grid: '#E2E8F0' };

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('customers');
  const [customerReports, setCustomerReports] = useState<Array<Record<string, unknown>>>([]);
  const [areaReports, setAreaReports] = useState<Array<Record<string, unknown>>>([]);
  const [driverReports, setDriverReports] = useState<Array<Record<string, unknown>>>([]);
  const [trend, setTrend] = useState<Array<{ month: string; revenue: number }>>([]);

  useEffect(() => {
    api.getCustomerReports().then(setCustomerReports);
    api.getAreaReports().then(setAreaReports);
    api.getDriverReports().then(setDriverReports);
    api.getRevenueTrend(12).then(setTrend);
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'customers', label: 'Customers' },
    { id: 'areas', label: 'Areas' },
    { id: 'drivers', label: 'Drivers' },
  ];

  const customerColumns: Column<Record<string, unknown>>[] = [
    { key: 'shop', header: 'Shop', sortable: true, sortValue: (r) => r.shopName as string, cell: (r) => <span className="font-medium">{r.shopName as string}</span> },
    { key: 'deliveries', header: 'Deliveries', sortable: true, sortValue: (r) => r.totalDeliveries as number, cell: (r) => r.totalDeliveries as number },
    { key: 'qty', header: 'Quantity', sortable: true, sortValue: (r) => r.totalQuantity as number, cell: (r) => r.totalQuantity as number },
    { key: 'balance', header: 'Cooler Balance', sortable: true, sortValue: (r) => r.currentCoolerBalance as number, cell: (r) => r.currentCoolerBalance as number },
    { key: 'freq', header: 'Frequency', cell: (r) => r.purchaseFrequency as string },
    { key: 'last', header: 'Last Delivery', cell: (r) => r.lastDeliveryDate ? formatDate(r.lastDeliveryDate as string) : '—' },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb="Analytics"
        title="Reports"
        description="Customer, area, and driver performance analytics"
        action={
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" />Export
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader><CardTitle>12-Month Revenue Trend</CardTitle></CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke={CHART.primary} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="mb-4 flex gap-1 rounded-lg border bg-muted/50 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'customers' && (
        <DataTable
          data={customerReports}
          columns={customerColumns}
          pageSize={12}
          searchPlaceholder="Search customers..."
          searchFilter={(r, q) => (r.shopName as string).toLowerCase().includes(q)}
        />
      )}

      {tab === 'areas' && (
        <>
          <div className="mb-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaReports}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="areaName" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill={CHART.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Card>
            <CardContent className="pt-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2">Area</th><th className="pb-2">Customers</th><th className="pb-2">Revenue</th><th className="pb-2">Deliveries</th><th className="pb-2">Driver</th><th className="pb-2">Coolers Out</th>
                  </tr>
                </thead>
                <tbody>
                  {areaReports.map((r, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-2.5 font-medium">{r.areaName as string}</td>
                      <td className="py-2.5">{r.customers as number}</td>
                      <td className="py-2.5">{formatCurrency(r.revenue as number)}</td>
                      <td className="py-2.5">{r.deliveries as number}</td>
                      <td className="py-2.5">{r.assignedDriver as string}</td>
                      <td className="py-2.5">{r.coolersCirculating as number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'drivers' && (
        <Card>
          <CardContent className="pt-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2">Driver</th><th className="pb-2">Total</th><th className="pb-2">Today</th><th className="pb-2">This Month</th><th className="pb-2">Customers</th><th className="pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {driverReports.map((r, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="py-2.5 font-medium">{r.driverName as string}</td>
                    <td className="py-2.5">{r.totalDeliveries as number}</td>
                    <td className="py-2.5">{r.todayDeliveries as number}</td>
                    <td className="py-2.5">{r.monthlyDeliveries as number}</td>
                    <td className="py-2.5">{r.customersCovered as number}</td>
                    <td className="py-2.5">{formatCurrency(r.totalRevenue as number)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
