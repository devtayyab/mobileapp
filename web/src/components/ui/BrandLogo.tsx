'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  asLink?: boolean;
}

const SIZES = {
  sm: { box: 'h-9 w-9', image: 36, text: 'text-lg', subtext: 'text-2xs' },
  md: { box: 'h-11 w-11', image: 44, text: 'text-xl sm:text-2xl', subtext: 'text-[10px]' },
  lg: { box: 'h-14 w-14', image: 56, text: 'text-3xl', subtext: 'text-xs' },
  xl: { box: 'h-[76px] w-[76px]', image: 76, text: 'text-4xl', subtext: 'text-sm' },
};

export function BrandLogo({
  className,
  showText = true,
  size = 'md',
  asLink = true,
}: BrandLogoProps) {
  const currentSize = SIZES[size];

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-full bg-[#04050A] border border-[#D4AF37]/75 ring-2 ring-[#0066CC]/15 shadow-sm transition-transform duration-200 group-hover:scale-105',
          currentSize.box
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-circle.png"
          alt="Sathun Global Marketplace Logo"
          width={currentSize.image}
          height={currentSize.image}
          className="h-full w-full rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/icon.png';
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn('font-extrabold tracking-[-0.5px] text-[#0066CC] dark:text-[#38BDF8]', currentSize.text)}>
            SATHUN GLOBAL
          </span>
          <span className={cn('font-semibold uppercase tracking-widest text-content-tertiary', currentSize.subtext)}>
            Marketplace
          </span>
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link href="/" className="group shrink-0 inline-flex items-center" aria-label="Sathun Global Marketplace">
        {content}
      </Link>
    );
  }

  return content;
}
