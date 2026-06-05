import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, MapPin, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import type { Customer360, LedgerEntry, Invoice, Payment, Delivery } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/data/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Package, IndianRupee } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = 'overview' | 'deliveries' | 'payments' | 'invoices' | 'ledger' | 'coolers' | 'timeline';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Customer360 | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [creditForm, setCreditForm] = useState({ creditLimit: '', creditOverride: '' });

  const load = () => {
    if (!id) return;
    api.getCustomer360(id).then((d) => {
      setData(d);
      setCreditForm({
        creditLimit: String(d.credit.creditLimit ?? 0),
        creditOverride: d.credit.creditOverride != null ? String(d.credit.creditOverride) : '',
      });
    });
  };

  useEffect(() => { load(); }, [id]);

  if (!data) return <div className="p-8 text-muted-foreground">Loading...</div>;

  const { analytics, credit, customer } = data;
  const statusVariant = analytics.analyticsStatus === 'active' ? 'success' : analytics.analyticsStatus === 'at_risk' ? 'warning' : 'destructive';
  const creditVariant = credit.status === 'over_limit' ? 'destructive' : credit.isNearLimit ? 'warning' : 'success';

  const mapsUrl = analytics.location.googleMapsUrl ||
    (analytics.location.latitude && analytics.location.longitude
      ? `https://www.google.com/maps?q=${analytics.location.latitude},${analytics.location.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(analytics.location.address)}`);

  const ledgerColumns: Column<LedgerEntry>[] = [
    { key: 'date', header: 'Date', cell: (e) => formatDate(e.date) },
    { key: 'particular', header: 'Particular', cell: (e) => e.particular },
    { key: 'debit', header: 'Debit', cell: (e) => e.debit ? formatCurrency(e.debit) : '—' },
    { key: 'credit', header: 'Credit', cell: (e) => e.credit ? formatCurrency(e.credit) : '—' },
    { key: 'balance', header: 'Balance', cell: (e) => <span className="font-medium">{formatCurrency(e.balance)}</span> },
  ];

  const deliveryColumns: Column<Delivery>[] = [
    { key: 'date', header: 'Date', cell: (d) => formatDate(d.deliveryDate) },
    { key: 'status', header: 'Status', cell: (d) => <Badge variant={d.status === 'delivered' ? 'success' : 'destructive'}>{d.status}</Badge> },
    { key: 'filled', header: 'Filled', cell: (d) => d.filledGiven },
    { key: 'returned', header: 'Returned', cell: (d) => d.emptyReturned },
    { key: 'amount', header: 'Amount', cell: (d) => formatCurrency(d.billableAmount) },
  ];

  const paymentColumns: Column<Payment>[] = [
    { key: 'date', header: 'Date', cell: (p) => formatDate(p.paymentDate) },
    { key: 'amount', header: 'Amount', cell: (p) => formatCurrency(p.amount) },
    { key: 'method', header: 'Method', cell: (p) => p.paymentMethod.toUpperCase() },
    { key: 'ref', header: 'Reference', cell: (p) => p.referenceNumber || '—' },
  ];

  const invoiceColumns: Column<Invoice>[] = [
    { key: 'number', header: 'Invoice', cell: (i) => i.invoiceNumber },
    { key: 'period', header: 'Period', cell: (i) => `${formatDate(i.periodStart)} – ${formatDate(i.periodEnd)}` },
    { key: 'total', header: 'Total', cell: (i) => formatCurrency(i.totalAmount) },
    { key: 'due', header: 'Due', cell: (i) => formatCurrency(i.amountDue ?? 0) },
    { key: 'status', header: 'Status', cell: (i) => <Badge>{i.status}</Badge> },
  ];

  const tabs: Tab[] = ['overview', 'deliveries', 'payments', 'invoices', 'ledger', 'coolers', 'timeline'];

  const handleCreditSave = async () => {
    await api.updateCustomerCredit(id!, {
      creditLimit: parseFloat(creditForm.creditLimit) || 0,
      creditOverride: creditForm.creditOverride ? parseFloat(creditForm.creditOverride) : null,
    });
    load();
  };

  const downloadLedgerFile = async (format: 'pdf' | 'csv') => {
    if (!id) return;
    const params: Record<string, string> = {};
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    const url = format === 'pdf' ? api.getLedgerPdfUrl(id, params) : api.getLedgerCsvUrl(id, params);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${api.getToken()}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ledger-${id}.${format === 'pdf' ? 'pdf' : 'csv'}`;
    a.click();
  };

  const filteredLedger = dateFrom || dateTo
    ? data.ledger.filter((e) => {
        const d = new Date(e.date);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo && d > new Date(dateTo)) return false;
        return true;
      })
    : data.ledger;

  return (
    <div>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Link>

      <PageHeader
        title={analytics.shopName}
        description={`${analytics.name} · ${analytics.averagePurchaseFrequency} buyer`}
        action={
          <div className="flex gap-2">
            <Badge variant={statusVariant}>{analytics.analyticsStatus.replace('_', ' ')}</Badge>
            <Badge variant={creditVariant}>Credit: {credit.status.replace('_', ' ')}</Badge>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-accent">
              <MapPin className="mr-1 h-4 w-4" />Open Maps
            </a>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Deliveries" value={analytics.totalDeliveries} icon={Package} />
        <StatCard label="Revenue" value={formatCurrency(analytics.totalRevenue)} icon={IndianRupee} />
        <StatCard label="Outstanding" value={formatCurrency(analytics.outstandingAmount)} icon={IndianRupee} iconColor="warning" />
        <StatCard label="Ledger" value={formatCurrency(analytics.ledgerBalance)} icon={IndianRupee} />
        <StatCard label="Cooler Balance" value={analytics.currentCoolerBalance} icon={Package} />
        <StatCard label="Lost / Damaged" value={`${analytics.lostCoolers} / ${analytics.damagedCoolers}`} icon={AlertTriangle} iconColor="destructive" />
      </div>

      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border bg-muted/50 p-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-2 text-sm font-medium capitalize ${tab === t ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-5 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <p><span className="text-muted-foreground">Last delivery:</span> {analytics.lastDeliveryDate ? formatDate(analytics.lastDeliveryDate) : 'Never'}</p>
                <p><span className="text-muted-foreground">Days since:</span> {analytics.daysSinceLastDelivery ?? '—'}</p>
                <p><span className="text-muted-foreground">Mobile:</span> {customer.mobile}</p>
                <p><span className="text-muted-foreground">Address:</span> {analytics.location.address}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Credit Management</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Outstanding: {formatCurrency(credit.outstanding)} · {credit.overdueCount} overdue ({formatCurrency(credit.overdueAmount)})</p>
              <div className="flex gap-2">
                <input className="h-9 flex-1 rounded-md border px-3" placeholder="Credit limit" value={creditForm.creditLimit} onChange={(e) => setCreditForm((f) => ({ ...f, creditLimit: e.target.value }))} />
                <input className="h-9 flex-1 rounded-md border px-3" placeholder="Override (optional)" value={creditForm.creditOverride} onChange={(e) => setCreditForm((f) => ({ ...f, creditOverride: e.target.value }))} />
                <Button size="sm" onClick={handleCreditSave}>Save</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyTrend}>
                  <XAxis dataKey="_id" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="#2563EB" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'deliveries' && <DataTable data={data.deliveries} columns={deliveryColumns} emptyMessage="No deliveries" />}
      {tab === 'payments' && <DataTable data={data.payments} columns={paymentColumns} emptyMessage="No payments" />}
      {tab === 'invoices' && <DataTable data={data.invoices} columns={invoiceColumns} emptyMessage="No invoices" />}

      {tab === 'ledger' && (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div><label className="text-xs text-muted-foreground">From</label><input type="date" className="flex h-10 rounded-md border px-3 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">To</label><input type="date" className="flex h-10 rounded-md border px-3 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
            <Button size="sm" variant="outline" onClick={() => downloadLedgerFile('pdf')}>
              <Download className="mr-1 h-4 w-4" />PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadLedgerFile('csv')}>
              <FileSpreadsheet className="mr-1 h-4 w-4" />Excel
            </Button>
          </div>
          <DataTable data={filteredLedger} columns={ledgerColumns} pageSize={20} emptyMessage="No ledger entries" />
        </>
      )}

      {tab === 'coolers' && (
        <Card>
          <CardHeader><CardTitle>Cooler Transaction History</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="pb-2">Date</th><th className="pb-2">Type</th><th className="pb-2">Qty</th><th className="pb-2">Notes</th></tr></thead>
              <tbody>
                {data.coolerTransactions.map((t, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{formatDate(t.createdAt)}</td>
                    <td className="py-2 capitalize"><Badge>{t.type}</Badge></td>
                    <td className="py-2">{t.quantity}</td>
                    <td className="py-2 text-muted-foreground">{t.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === 'timeline' && (
        <Card>
          <CardHeader><CardTitle>Unified Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.timeline.map((ev, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border px-4 py-3 text-sm">
                <div>
                  <Badge variant="outline" className="mr-2 capitalize">{ev.type}</Badge>
                  <span>{ev.title}</span>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">{formatDate(ev.date)}</p>
                  {ev.amount > 0 && <p className="font-medium">{formatCurrency(ev.amount)}</p>}
                </div>
              </div>
            ))}
            {data.timeline.length === 0 && <p className="text-muted-foreground">No activity yet</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
