import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Area } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = () => api.getAreas().then(setAreas);
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createArea({ name, description });
    setName('');
    setDescription('');
    setShowForm(false);
    load();
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Master Data"
        title="Areas"
        description="Manage delivery zones"
        action={<Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" />Add Area</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="flex flex-wrap gap-4">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="flex items-end"><Button type="submit">Save</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <Card key={area._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{area.name}</h3>
                  <p className="text-sm text-muted-foreground">{area.description || 'No description'}</p>
                </div>
                <Badge variant={area.isActive ? 'success' : 'destructive'}>{area.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
