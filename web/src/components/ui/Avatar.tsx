import { cn } from '@/lib/cn';

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-tint font-extrabold text-primary',
        className
      )}
    >
      {src ? (
        // Remote avatars are arbitrary URLs; plain img avoids next/image domain config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        initials || '?'
      )}
    </span>
  );
}
