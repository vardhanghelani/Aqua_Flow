import type { Invoice, Customer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface InvoicePreviewProps {
  invoice: Invoice;
  className?: string;
}

export function InvoicePreview({ invoice, className }: InvoicePreviewProps) {
  const customer = invoice.customerId as Customer;

  return (
    <div className={`rounded-lg border bg-white p-8 text-slate-900 shadow-card print:shadow-none ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#2563EB]">AQUA FLOW</h2>
          <p className="text-sm text-slate-500">Water Cooler Distribution</p>
          <p className="mt-1 text-xs text-slate-400">GSTIN: — · Phone: —</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">TAX INVOICE</p>
          <p className="mt-1 font-mono text-sm font-semibold">{invoice.invoiceNumber}</p>
          <p className="text-sm text-slate-500">Date: {formatDate(invoice.createdAt)}</p>
          <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'} className="mt-2">
            {invoice.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Bill To */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill To</p>
          <p className="mt-1 font-semibold">{customer?.shopName}</p>
          <p className="text-sm text-slate-600">{customer?.name}</p>
          <p className="text-sm text-slate-500">{customer?.mobile}</p>
          <p className="text-sm text-slate-500">{customer?.address}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Billing Period</p>
          <p className="mt-1 text-sm">{formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}</p>
          <p className="mt-2 text-xs text-slate-400">Type: {invoice.invoiceType}</p>
        </div>
      </div>

      {/* Line items */}
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="pb-2 pr-4">#</th>
            <th className="pb-2 pr-4">Delivery Date</th>
            <th className="pb-2 pr-4 text-right">Qty</th>
            <th className="pb-2 pr-4 text-right">Rate (₹)</th>
            <th className="pb-2 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-2.5 pr-4 text-slate-400">{i + 1}</td>
              <td className="py-2.5 pr-4">{formatDate(item.date)}</td>
              <td className="py-2.5 pr-4 text-right">{item.quantity}</td>
              <td className="py-2.5 pr-4 text-right">{item.unitPrice}</td>
              <td className="py-2.5 text-right font-medium">{item.amount.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="pt-4 text-right font-semibold">Total Quantity</td>
            <td className="pt-4 text-right font-semibold">{invoice.totalQuantity}</td>
          </tr>
          <tr>
            <td colSpan={4} className="pt-2 text-right text-lg font-bold">Total Amount</td>
            <td className="pt-2 text-right text-lg font-bold text-[#2563EB]">{formatCurrency(invoice.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <div className="mt-10 flex items-end justify-between border-t border-slate-200 pt-6">
        <div>
          <div className="flex h-20 w-20 items-center justify-center rounded border-2 border-dashed border-slate-200 text-xs text-slate-300">
            QR Code
          </div>
          <p className="mt-1 text-xs text-slate-400">Scan to verify</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Authorized Signature</p>
          <div className="mt-8 w-48 border-b border-slate-400" />
          <p className="mt-1 text-xs text-slate-500">For Aqua Flow</p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        This is a computer-generated invoice. Generated from delivery records.
      </p>
    </div>
  );
}
