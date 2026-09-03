import Link from 'next/link';
import { Compass, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui';

/** Styled 404, replacing Next's default page. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-4 py-10">
      <div className="w-full max-w-md text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-tint text-primary">
          <Compass size={30} />
        </span>

        <p className="mt-5 text-sm font-extrabold uppercase tracking-[1px] text-content-tertiary">
          Error 404
        </p>
        <h1 className="mt-1 text-7xl font-extrabold tracking-[-0.6px] text-content-primary">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-lg text-content-tertiary">
          The page you were looking for has moved, or never existed. Everything on SATHUN is still
          a click away from the storefront.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/">
            <Button size="lg">
              <Home size={18} />
              Back to home
            </Button>
          </Link>
          <Link href="/shop">
            <Button size="lg" variant="outline">
              <Search size={18} />
              Browse products
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
