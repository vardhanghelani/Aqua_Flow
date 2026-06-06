import { Types } from 'mongoose';
import { AuthRequest } from '../types';
import { ApiError } from './apiError';

export function requireOrgId(req: AuthRequest): Types.ObjectId {
  if (!req.user?.organizationId) {
    throw new ApiError(403, 'Organization context required');
  }
  return new Types.ObjectId(req.user.organizationId);
}

export function withOrg<T extends Record<string, unknown>>(req: AuthRequest, query: T = {} as T) {
  return { ...query, organizationId: requireOrgId(req) };
}

export function orgIdString(req: AuthRequest): string {
  return requireOrgId(req).toString();
}

export async function assertBelongsToOrg(
  req: AuthRequest,
  doc: { organizationId?: Types.ObjectId | null } | null,
  label = 'Resource'
) {
  if (!doc) throw new ApiError(404, `${label} not found`);
  const orgId = requireOrgId(req);
  if (doc.organizationId && !doc.organizationId.equals(orgId)) {
    throw new ApiError(404, `${label} not found`);
  }
}

export function slugifyBusinessName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'business';
}
