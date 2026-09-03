import type { Role } from '@/types/database';

export const WEB_ROLES: Role[] = ['admin', 'supplier', 'b2b'];

export function homeForRole(role: Role | undefined): string {
  switch (role) {
    case 'admin':
      return '/products';
    case 'supplier':
      return '/supplier/products';
    case 'b2b':
      return '/shop';
    default:
      return '/login';
  }
}
