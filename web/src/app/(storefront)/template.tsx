import { PageTransition } from '@/components/PageTransition';

/*
  Lives inside the storefront layout (not at the root) so the header, nav and
  cart/notification state persist across navigations — only the page content
  re-animates. A root-level template remounts the entire shell on every route
  change, which both costs render time and resets the animated nav indicator.
*/
export default function StorefrontTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
