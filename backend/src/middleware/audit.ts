import { AuditLog } from '../models';
import { AuthRequest } from '../types';

export async function logAudit(
  req: AuthRequest,
  action: 'create' | 'update' | 'delete' | 'export' | 'restore',
  entityType: string,
  entityId?: string,
  changes?: Record<string, unknown>,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>
): Promise<void> {
  try {
    await AuditLog.create({
      organizationId: req.user?.organizationId,
      userId: req.user?.id,
      action,
      entityType,
      entityId,
      changes,
      oldValue,
      newValue,
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
