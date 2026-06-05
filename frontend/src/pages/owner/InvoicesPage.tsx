import { useEffect, useState } from 'react';
import { Download, FileText, Printer, Plus, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { Customer, Invoice } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/data/DataTable';
import { InvoicePreview } from '@/components/invoices/InvoicePreview';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

export function InvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ customerId: '', periodStart: '', periodEnd: '', invoiceType: 'monthly' });

  const load = () => api.getInvoices().then((d) => setInvoices(d.items));
  useEffect(() => {
    load();
    api.getCustomers().then(setCustomers);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const inv = await api.generateInvoice(form);
      toast('Invoice generated successfully');
      setShowForm(false);
      setPreview(inv);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to generate', 'error');
    }
  };

  const shareWhatsApp = async (id: string) => {
    const share = await api.getInvoiceShare(id);
    window.open(share.whatsappUrl, '_blank');
  };

  const downloadPdf = (id: string, number: string) => {
    const token = api.getToken();
    fetch(api.getInvoicePdfUrl(id), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${number}.pdf`;
        a.click();
      });
  };

  const columns: Column<Invoice>[] = [
    { key: 'number', header: 'Invoice #', sortable: true, sortValue: (i) => i.invoiceNumber, cell: (i) => <span className="font-mono font-medium">{i.invoiceNumber}</span> },
    { key: 'customer', header: 'Customer', cell: (i) => (i.customerId as Customer)?.shopName ?? '—' },
    { key: 'period', header: 'Period', cell: (i) => `${formatDate(i.periodStart)} – ${formatDate(i.periodEnd)}` },
    { key: 'qty', header: 'Qty', sortable: true, sortValue: (i) => i.totalQuantity, cell: (i) => i.totalQuantity },
    { key: 'amount', header: 'Amount', sortable: true, sortValue: (i) => i.totalAmount, cell: (i) => formatCurrency(i.totalAmount) },
    { key: 'status', header: 'Status', cell: (i) => <Badge variant={i.status === 'paid' ? 'success' : 'warning'}>{i.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      cell: (i) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => setPreview(i)}>View</Button>
          <Button size="sm" variant="outline" onClick={() => shareWhatsApp(i._id)} title="WhatsApp">
            <MessageCircle className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadPdf(i._id, i.invoiceNumber)}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb="Billing"
        title="Invoices"
        description="Auto-generated from delivery records — never manual counts"
        action={<Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" />Generate Invoice</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <form onSubmit={handleGenerate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label>Customer</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                  <option value="">Select customer</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.shopName}</option>)}
                </select>
              </div>
              <div><Label>Period Start</Label><Input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} required /></div>
              <div><Label>Period End</Label><Input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} required /></div>
              <div>
                <Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.invoiceType} onChange={(e) => setForm({ ...form, invoiceType: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit">Generate</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {preview && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Invoice Preview</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print</Button>
              <Button size="sm" variant="outline" onClick={() => shareWhatsApp(preview._id)}><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</Button>
              <Button size="sm" variant="outline" onClick={() => downloadPdf(preview._id, preview.invoiceNumber)}><Download className="mr-1 h-4 w-4" />PDF</Button>
              <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Close</Button>
            </div>
          </div>
          <InvoicePreview invoice={preview} />
        </div>
      )}

      {invoices.length === 0 && !showForm ? (
        <EmptyState icon={FileText} title="No invoices generated" description="Generate your first invoice from delivery records for any customer and date range." action={{ label: 'Generate Invoice', onClick: () => setShowForm(true) }} />
      ) : (
        <DataTable data={invoices} columns={columns} pageSize={10} emptyMessage="No invoices found" />
      )}
    </div>
  );
}
