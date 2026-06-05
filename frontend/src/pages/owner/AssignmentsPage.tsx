import { useEffect, useState } from 'react';

import { ClipboardList, ArrowRightLeft } from 'lucide-react';

import { api } from '@/lib/api';

import type { Area, Assignment, Driver } from '@/types';

import { PageHeader } from '@/components/layout/PageHeader';

import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { formatDate } from '@/lib/utils';



export function AssignmentsPage() {

  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [areas, setAreas] = useState<Area[]>([]);

  const [active, setActive] = useState<Assignment[]>([]);

  const [history, setHistory] = useState<Assignment[]>([]);

  const [driverId, setDriverId] = useState('');

  const [areaId, setAreaId] = useState('');

  const [showForm, setShowForm] = useState(false);

  const [busy, setBusy] = useState(false);



  const load = () => {

    api.getDrivers().then(setDrivers);

    api.getAreas().then(setAreas);

    api.getActiveAssignments().then(setActive);

    api.getAssignmentHistory().then(setHistory);

  };

  useEffect(() => {

    load();

  }, []);



  const openChangeForm = (assignment?: Assignment) => {

    if (assignment) {

      const d = assignment.driverId as Driver;

      const a = assignment.areaId as Area;

      setDriverId(typeof d === 'object' ? d._id : String(assignment.driverId));

      setAreaId(typeof a === 'object' ? a._id : String(assignment.areaId));

    } else {

      setDriverId('');

      setAreaId('');

    }

    setShowForm(true);

  };



  const handleAssign = async (e: React.FormEvent) => {

    e.preventDefault();

    setBusy(true);

    try {

      await api.assignDriver({ driverId, areaId });

      setDriverId('');

      setAreaId('');

      setShowForm(false);

      load();

    } finally {

      setBusy(false);

    }

  };



  const inactiveHistory = history.filter((a) => !a.isActive);



  return (

    <div className="mx-auto max-w-3xl">

      <PageHeader

        breadcrumb="Customers"

        title="Area Mappings"

        description="Drivers stay on their area until you change it. Previous mappings are saved automatically."

      />



      <div className="mb-6 space-y-3">

        {active.length === 0 && (

          <Card className="border-[#E5E7EB] bg-white">

            <CardContent className="py-8 text-center text-muted-foreground">

              No drivers assigned yet. Set up your first area mapping.

            </CardContent>

          </Card>

        )}

        {active.map((a) => {

          const driver = a.driverId as Driver;

          const area = a.areaId as Area;

          return (

            <Card key={a._id} className="border-[#E5E7EB] bg-white">

              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="text-lg font-semibold text-[#111827]">{driver?.name}</span>

                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />

                    <span className="text-lg font-semibold text-[#111827]">{area?.name}</span>

                    <Badge variant="success">Active</Badge>

                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">

                    Assigned {formatDate(a.startDate)}

                    {a.assignedBy?.name && ` · by ${a.assignedBy.name}`}

                  </p>

                </div>

                <Button variant="outline" className="min-h-[44px] shrink-0" onClick={() => openChangeForm(a)}>

                  Change assignment

                </Button>

              </CardContent>

            </Card>

          );

        })}

      </div>



      {!showForm ? (

        <Button className="mb-8 min-h-[48px] w-full sm:w-auto" onClick={() => openChangeForm()}>

          Assign driver to area

        </Button>

      ) : (

        <Card className="mb-8 border-[#E5E7EB] bg-white">

          <CardHeader>

            <CardTitle className="text-base">Change area mapping</CardTitle>

          </CardHeader>

          <CardContent>

            <p className="mb-4 text-sm text-muted-foreground">

              If this driver or area already has an active mapping, the old one will close and appear in history.

            </p>

            <form onSubmit={handleAssign} className="space-y-4">

              <div>

                <Label className="text-base">Driver</Label>

                <select

                  className="mt-1.5 flex h-12 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-base"

                  value={driverId}

                  onChange={(e) => setDriverId(e.target.value)}

                  required

                >

                  <option value="">Select driver</option>

                  {drivers.map((d) => (

                    <option key={d._id} value={d._id}>

                      {d.name}

                    </option>

                  ))}

                </select>

              </div>

              <div>

                <Label className="text-base">Area</Label>

                <select

                  className="mt-1.5 flex h-12 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-base"

                  value={areaId}

                  onChange={(e) => setAreaId(e.target.value)}

                  required

                >

                  <option value="">Select area</option>

                  {areas.map((ar) => (

                    <option key={ar._id} value={ar._id}>

                      {ar.name}

                    </option>

                  ))}

                </select>

              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                <Button type="submit" size="touch" className="flex-1" disabled={busy}>

                  {busy ? 'Saving...' : 'Save mapping'}

                </Button>

                <Button type="button" variant="outline" size="touch" onClick={() => setShowForm(false)}>

                  Cancel

                </Button>

              </div>

            </form>

          </CardContent>

        </Card>

      )}



      <div>

        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">

          <ClipboardList className="h-4 w-4" />

          Assignment history

        </h2>

        {inactiveHistory.length === 0 ? (

          <p className="text-sm text-muted-foreground">No past changes yet.</p>

        ) : (

          <div className="space-y-2">

            {inactiveHistory.map((a) => {

              const driver = a.driverId as Driver;

              const area = a.areaId as Area;

              return (

                <div key={a._id} className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm">

                  <p className="font-medium text-[#111827]">

                    {driver?.name} → {area?.name}

                  </p>

                  <p className="mt-1 text-muted-foreground">

                    Assigned {formatDate(a.startDate)}

                    {a.endDate && ` · Changed ${formatDate(a.endDate)}`}

                    {a.assignedBy?.name && ` · by ${a.assignedBy.name}`}

                  </p>

                </div>

              );

            })}

          </div>

        )}

      </div>

    </div>

  );

}


