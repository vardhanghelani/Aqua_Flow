import { useEffect, useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import { api } from '@/lib/api';
import type { Area, Assignment, Customer, Delivery, Driver } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/data/DataTable';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';

type PopulatedDelivery = Delivery & {
  customerId: Customer | string;
  driverId: Driver | string;
  areaId: Area | string;
};

function resolveShopName(ref: Customer | string) {
  return typeof ref === 'string' ? '—' : ref.shopName;
}

function resolvePersonName(ref: Driver | string) {
  return typeof ref === 'string' ? '—' : ref.name;
}

function resolveAreaName(ref: Area | string) {
  return typeof ref === 'string' ? '—' : ref.name;
}

function resolveAreaId(ref: Area | string) {
  return typeof ref === 'string' ? ref : ref._id;
}

export function OwnerDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<PopulatedDelivery[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    api.getDeliveryHistory({ limit: '200' }).then((d) => setDeliveries(d.items as PopulatedDelivery[]));
    api.getActiveAssignments().then(setAssignments);
  }, []);

  const assignmentByArea = useMemo(() => {
    const map: Record<string, Assignment> = {};
    assignments.forEach((a) => {
      const areaId = typeof a.areaId === 'object' ? a.areaId._id : String(a.areaId);
      map[areaId] = a;
    });
    return map;
  }, [assignments]);

  const columns: Column<PopulatedDelivery>[] = [
    {
      key: 'deliveryDate',
      header: 'Delivery Date',
      sortable: true,
      sortValue: (d) => d.deliveryDate,
      cell: (d) => formatDate(d.deliveryDate),
    },
    {
      key: 'assigned',
      header: 'Area Assigned',
      cell: (d) => {
        const a = assignmentByArea[resolveAreaId(d.areaId)];
        return a ? formatDate(a.startDate) : '—';
      },
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      sortValue: (d) => resolveShopName(d.customerId),
      cell: (d) => <span className="font-medium">{resolveShopName(d.customerId)}</span>,
    },
    {
      key: 'driver',
      header: 'Driver',
      cell: (d) => resolvePersonName(d.driverId),
    },
    {
      key: 'area',
      header: 'Area',
      cell: (d) => resolveAreaName(d.areaId),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (d) => (
        <Badge variant={d.status === 'delivered' ? 'success' : 'destructive'}>
          {d.status === 'delivered' ? 'Delivered' : 'Skipped'}
        </Badge>
      ),
    },
    {
      key: 'given',
      header: 'Given',
      sortable: true,
      sortValue: (d) => d.filledGiven,
      cell: (d) => d.filledGiven,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      sortValue: (d) => d.billableAmount,
      cell: (d) => (d.status === 'delivered' ? formatCurrency(d.billableAmount) : '—'),
    },
  ];

  return (
    <div>
      <PageHeader breadcrumb="Operations" title="Deliveries" description="Who delivered what, where, and when" />

      {deliveries.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No deliveries found"
          description="Delivery records will appear here once drivers start marking deliveries."
        />
      ) : (
        <>
          <div className="mb-6 space-y-3 md:hidden">
            {deliveries.slice(0, 50).map((d) => {
              const assigned = assignmentByArea[resolveAreaId(d.areaId)];
              return (
                <div key={d._id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#111827]">{resolveShopName(d.customerId)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {resolvePersonName(d.driverId)} · {resolveAreaName(d.areaId)}
                      </p>
                    </div>
                    <Badge variant={d.status === 'delivered' ? 'success' : 'destructive'}>
                      {d.status === 'delivered' ? 'Delivered' : 'Skipped'}
                    </Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Delivered</dt>
                      <dd className="font-medium">{formatDate(d.deliveryDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Area assigned</dt>
                      <dd className="font-medium">{assigned ? formatDate(assigned.startDate) : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Quantity</dt>
                      <dd className="font-medium">{d.filledGiven} given</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Amount</dt>
                      <dd className="font-medium">
                        {d.status === 'delivered' ? formatCurrency(d.billableAmount) : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block">
            <DataTable
              data={deliveries}
              columns={columns}
              pageSize={15}
              searchPlaceholder="Search customer or driver..."
              searchFilter={(d, q) => {
                const shop = resolveShopName(d.customerId).toLowerCase();
                const driver = resolvePersonName(d.driverId).toLowerCase();
                const area = resolveAreaName(d.areaId).toLowerCase();
                return shop.includes(q) || driver.includes(q) || area.includes(q);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
