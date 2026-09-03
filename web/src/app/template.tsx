import { PageTransition } from '@/components/PageTransition';

// A template (not a layout) remounts per navigation, which is what drives the
// enter animation on every route change.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
