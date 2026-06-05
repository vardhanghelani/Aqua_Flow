import { useEffect, useState } from 'react';
import { IndianRupee, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Invoice, Payment } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/data/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

export function PaymentsPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    invoiceId: '', amount: '', paymentMethod: 'cash', referenceNumber: '', notes: '',
  });

  const load = () => {
    api.getPaymentSummary().then(setSummary);
    api.getPayments().then((d) => setPayments(d.items));
    api.getInvoices().then((d) => setInvoices(d.items));
  };
  useEffect(() => { load(); }, []);

  const unpaidInvoices = invoices.filter(
    (i) => ['unpaid', 'partially_paid', 'pending'].includes(i.status)
  );

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordPayment({
        invoiceId: form.invoiceId,
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod,
        referenceNumber: form.referenceNumber,
        notes: form.notes,
      });
      toast('Payment recorded');
      setShowForm(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const columns: Column<Payment>[] = [
    { key: 'date', header: 'Date', cell: (p) => formatDate(p.paymentDate) },
    { key: 'customer', header: 'Customer', cell: (p) => (p.customerId as { shopName?: string })?.shopName ?? '—' },
    { key: 'invoice', header: 'Invoice', cell: (p) => (p.invoiceId as Invoice)?.invoiceNumber ?? '—' },
    { key: 'amount', header: 'Amount', cell: (p) => formatCurrency(p.amount) },
    { key: 'method', header: 'Method', cell: (p) => p.paymentMethod.toUpperCase() },
    { key: 'ref', header: 'Reference', cell: (p) => p.referenceNumber || '—' },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb="Billing"
        title="Payments"
        description="Record collections against invoices — supports partial and multiple payments"
        action={<Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" />Record Payment</Button>}
      />

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Outstanding" value={formatCurrency(summary.totalOutstanding as number)} icon={IndianRupee} iconColor="warning" />
          <StatCard label="Total Collected" value={formatCurrency(summary.totalPaid as number)} icon={IndianRupee} iconColor="success" />
          <StatCard label="Unpaid Invoices" value={summary.outstandingInvoiceCount as number} icon={IndianRupee} iconColor="destructive" />
          <StatCard label="Overdue" value={summary.overdueCount as number} icon={IndianRupee} iconColor="destructive" />
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <form onSubmit={handlePay} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Invoice</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })} required>
                  <option value="">Select invoice</option>
                  {unpaidInvoices.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.invoiceNumber} — {(i.customerId as { shopName?: string })?.shopName} — Due: {formatCurrency(i.amountDue ?? i.totalAmount)}
                    </option>
                  ))}
                </select>
              </div>
              <div><Label>Amount (₹)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div>
                <Label>Method</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div><Label>Reference #</Label><Input value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} /></div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex items-end gap-2">
                <Button type="submit">Save Payment</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable data={payments} columns={columns} pageSize={15} emptyMessage="No payments recorded yet" />
    </div>
  );
}
