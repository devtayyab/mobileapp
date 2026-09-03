import Link from 'next/link';

/** Shared shell for the standalone auth pages (login, password recovery). */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-5 block text-center text-6xl font-extrabold tracking-[-0.5px] text-primary"
        >
          SATHUN
        </Link>

        <div className="rounded-4xl border border-edge bg-surface p-6">
          <h1 className="text-4xl font-extrabold tracking-[-0.3px] text-content-primary">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-lg text-content-tertiary">{subtitle}</p>}

          <div className="mt-5">{children}</div>
        </div>

        {footer && <div className="mt-4 text-center text-md">{footer}</div>}
      </div>
    </div>
  );
}
