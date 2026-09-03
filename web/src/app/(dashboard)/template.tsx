import { PageTransition } from '@/components/PageTransition';

/** Keeps the sidebar mounted across navigations; see the storefront template. */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
