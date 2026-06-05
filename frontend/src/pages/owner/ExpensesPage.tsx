import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Expense } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/data/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { IndianRupee, TrendingUp } from 'lucide-react';

const CATEGORIES = ['diesel', 'salary', 'maintenance', 'office', 'other'] as const;

export function ExpensesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'diesel', description: '', amount: '', expenseDate: '', referenceNumber: '' });

  const load = () => {
    api.getExpenses().then((d) => setItems(d.items));
    api.getExpenseSummary().then(setSummary);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExpense({ ...form, amount: parseFloat(form.amount) });
      toast('Expense recorded');
      setShowForm(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteExpense(id);
      toast('Deleted');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const columns: Column<Expense>[] = [
    { key: 'date', header: 'Date', cell: (e) => formatDate(e.expenseDate) },
    { key: 'category', header: 'Category', cell: (e) => <span className="capitalize">{e.category}</span> },
    { key: 'desc', header: 'Description', cell: (e) => e.description },
    { key: 'amount', header: 'Amount', cell: (e) => formatCurrency(e.amount) },
    { key: 'actions', header: '', cell: (e) => <Button size="sm" variant="ghost" onClick={() => handleDelete(e._id)}><Trash2 className="h-3 w-3" /></Button> },
  ];

  return (
    <div>
      <PageHeader
        title="Expenses & Profit"
        description="Track business expenses and calculate profit"
        action={<Button onClick={() => setShowForm(!showForm)}><Plus className="mr-1 h-4 w-4" />Add Expense</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(Number(summary?.totalRevenue ?? 0))} icon={IndianRupee} iconColor="secondary" />
        <StatCard label="Expenses" value={formatCurrency(Number(summary?.totalExpenses ?? 0))} icon={IndianRupee} iconColor="warning" />
        <StatCard label="Profit" value={formatCurrency(Number(summary?.profit ?? 0))} icon={TrendingUp} iconColor="primary" />
        <StatCard label="Margin" value={`${Number(summary?.marginPercent ?? 0).toFixed(1)}%`} icon={TrendingUp} />
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <select className="h-10 rounded-md border px-3 text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="h-10 rounded-md border px-3 text-sm" placeholder="Description" required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <input className="h-10 rounded-md border px-3 text-sm" placeholder="Amount" type="number" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              <input className="h-10 rounded-md border px-3 text-sm" type="date" value={form.expenseDate} onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))} />
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable data={items} columns={columns} emptyMessage="No expenses recorded" />
    </div>
  );
}
