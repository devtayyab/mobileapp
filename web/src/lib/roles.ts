import type { Role } from '@/types/database';

/** Every role can use the web app now (customers included, like mobile). */
export const WEB_ROLES: Role[] = ['admin', 'supplier', 'b2b', 'customer'];

/**
 * Landing route per role, mirroring app/index.tsx on mobile:
 * suppliers go to their dashboard, admins to the admin area, shoppers to the storefront.
 */
export function homeForRole(role: Role | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'supplier':
      return '/supplier/dashboard';
    case 'b2b':
    case 'customer':
      return '/';
    default:
      return '/';
  }
}
