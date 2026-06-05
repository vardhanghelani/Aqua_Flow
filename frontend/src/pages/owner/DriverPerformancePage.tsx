import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Award, Truck, IndianRupee, Calendar, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import type { DriverPerformance } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export function DriverPerformancePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DriverPerformance | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!id) return;
    api.getDriverPerformance(id, { month }).then(setData);
  }, [id, month]);

  if (!data) return <div className="p-8 text-muted-foreground">Loading...</div>;

  const gradeColor = data.grade === 'A' ? 'success' : data.grade === 'B' ? 'default' : data.grade === 'C' ? 'warning' : 'destructive';

  return (
    <div>
      <Link to="/drivers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Drivers
      </Link>

      <PageHeader
        title={data.driver.name}
        description={`Performance analytics · ${data.driver.mobile}`}
        action={
          <div className="flex items-center gap-2">
            <input type="month" className="h-9 rounded-md border px-3 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} />
            <Badge variant={gradeColor} className="text-lg px-3 py-1"><Award className="mr-1 h-4 w-4 inline" />{data.grade} · {data.scores.overall}</Badge>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Delivery Score" value={`${data.scores.delivery}%`} icon={Truck} />
        <StatCard label="Collection Score" value={`${data.scores.collection}%`} icon={IndianRupee} />
        <StatCard label="Attendance" value={`${data.scores.attendance}%`} icon={Calendar} />
        <StatCard label="Damage Penalty" value={`${data.scores.damagePenalty}%`} icon={AlertTriangle} iconColor="destructive" />
        <StatCard label="Overall" value={`${data.scores.overall}%`} icon={Award} iconColor="primary" />
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Metrics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <p><span className="text-muted-foreground">Deliveries completed:</span> {data.metrics.deliveriesCompleted} / {data.metrics.deliveriesAttempted}</p>
            <p><span className="text-muted-foreground">Billable amount:</span> {formatCurrency(data.metrics.totalBillable)}</p>
            <p><span className="text-muted-foreground">Collected:</span> {formatCurrency(data.metrics.totalCollected)}</p>
            <p><span className="text-muted-foreground">Days worked:</span> {data.metrics.daysWorked} / {data.metrics.workingDays}</p>
            <p><span className="text-muted-foreground">Damaged coolers:</span> {data.metrics.damagedCoolers}</p>
            <p><span className="text-muted-foreground">Lost coolers:</span> {data.metrics.lostCoolers}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
