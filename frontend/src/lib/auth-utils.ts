import type { User, UserRole } from '@/types';

export function isBusinessUser(role?: UserRole) {
  return role === 'owner' || role === 'co_owner';
}

export function businessHomePath(user: User | null) {
  if (!user) return '/login';
  return isBusinessUser(user.role) ? '/dashboard' : '/driver/deliveries';
}
