import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AuditPage() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.getAuditLogs().then((d) => setLogs(d.items));
  }, []);

  return (
    <div>
      <PageHeader title="Audit Log" description="Track all system actions for accountability" />
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">Time</th>
                <th className="pb-2">User</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const user = log.userId as { name?: string; loginId?: string } | undefined;
                return (
                  <tr key={i} className="border-b">
                    <td className="py-2">{new Date(log.createdAt as string).toLocaleString('en-IN')}</td>
                    <td className="py-2">{user?.name || user?.loginId || '—'}</td>
                    <td className="py-2"><Badge>{log.action as string}</Badge></td>
                    <td className="py-2">{log.entityType as string}</td>
                  </tr>
                );
              })}
              {logs.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No audit logs yet</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
