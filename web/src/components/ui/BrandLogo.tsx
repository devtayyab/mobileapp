'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  asLink?: boolean;
}

const SIZES = {
  sm: { image: 32, text: 'text-lg', subtext: 'text-2xs' },
  md: { image: 42, text: 'text-2xl', subtext: 'text-xs' },
  lg: { image: 52, text: 'text-3xl', subtext: 'text-xs' },
  xl: { image: 68, text: 'text-4xl', subtext: 'text-sm' },
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
      <div className="relative shrink-0 overflow-hidden rounded-xl bg-white/5 p-1 transition-transform group-hover:scale-105">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="Sathun Global Marketplace Logo"
          width={currentSize.image}
          height={currentSize.image}
          className="h-auto w-auto object-contain max-h-[48px]"
          onError={(e) => {
            // Fallback to icon if logo fails to load
            (e.target as HTMLImageElement).src = '/images/icon.png';
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn('font-extrabold tracking-[-0.5px] text-primary', currentSize.text)}>
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
