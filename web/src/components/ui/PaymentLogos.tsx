'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface PaymentLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VisaLogo({ className }: PaymentLogoProps) {
  return (
    <svg viewBox="0 0 48 32" className={cn('h-6 w-auto', className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#0A2540" />
      <path
        d="M20.2 21.5h-2.8l1.7-10.7h2.8l-1.7 10.7zm12.3-10.4c-.6-.2-1.5-.4-2.6-.4-2.9 0-4.9 1.5-5 3.7 0 1.6 1.5 2.5 2.6 3.1 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1.1-1.8 1.1-1.2 0-1.8-.2-2.8-.6l-.4-.2-.4 2.5c.7.3 2 .6 3.3.6 3.1 0 5.1-1.5 5.1-3.8 0-1.3-.8-2.2-2.5-3-.1-.5-1.5-.9-1.5-1.4 0-.5.5-1 1.6-1 .9 0 1.6.2 2.1.4l.2.1.6-2.5zm7.3 0h-2.2c-.7 0-1.2.2-1.5.9l-4.3 10.2h3l.6-1.7h3.7l.3 1.7h2.6l-2.2-11.1zm-3.6 7l1.5-4.1.9 4.1h-2.4zm-19.8-7l-2.7 7.3-.3-1.5c-.5-1.7-2.1-3.6-3.9-4.5l2.5 9.4h3l4.5-10.7h-3.1z"
        fill="#FFFFFF"
      />
      <path
        d="M10.7 10.8H6.5l-.1.4c3.4.9 5.6 3 6.5 5.5l-.9-4.8c-.2-.8-.7-1.1-1.3-1.1z"
        fill="#F7B600"
      />
    </svg>
  );
}

export function MastercardLogo({ className }: PaymentLogoProps) {
  return (
    <svg viewBox="0 0 48 32" className={cn('h-6 w-auto', className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#252525" />
      <circle cx="19" cy="16" r="8" fill="#EB001B" />
      <circle cx="29" cy="16" r="8" fill="#F79E1B" />
      <path
        d="M24 10.4a7.95 7.95 0 0 0-3 5.6 7.95 7.95 0 0 0 3 5.6 7.95 7.95 0 0 0 3-5.6 7.95 7.95 0 0 0-3-5.6z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function AmexLogo({ className }: PaymentLogoProps) {
  return (
    <svg viewBox="0 0 48 32" className={cn('h-6 w-auto', className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#006FCF" />
      <path
        d="M10 13h3.5l1.5 3.5 1.5-3.5H20v6h-2.5v-3.5l-1.5 3.5h-1l-1.5-3.5V19H10v-6zm12 0h6v1.5h-3.5v.8H28v1.5h-3.5v.7H28V19h-6v-6zm8 0h3l1.8 2.5 1.8-2.5h3l-3.2 4 3.4 4h-3l-2-2.6-2 2.6h-3l3.3-4-3.1-4z"
        fill="#FFFFFF"
        fontWeight="bold"
      />
    </svg>
  );
}

export function StripeLogo({ className }: PaymentLogoProps) {
  return (
    <svg viewBox="0 0 48 32" className={cn('h-6 w-auto', className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#635BFF" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.5 14.8c0-.7.6-1.1 1.6-1.1 1.4 0 3 .5 4.3 1.2v-3.8c-1.4-.6-2.9-.8-4.3-.8-3.7 0-6.1 1.9-6.1 5.2 0 5 6.9 4.2 6.9 6.4 0 .9-.8 1.2-1.9 1.2-1.6 0-3.6-.7-5.2-1.6v3.9c1.7.7 3.5 1.1 5.2 1.1 3.8 0 6.4-1.9 6.4-5.2-.1-5.3-6.9-4.4-6.9-6.5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function ApplePayLogo({ className }: PaymentLogoProps) {
  return (
    <svg viewBox="0 0 48 32" className={cn('h-6 w-auto', className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#000000" />
      <path
        d="M17.4 12.8c-.4.5-1 .8-1.7.8-.1-.6.2-1.3.5-1.7.4-.5 1-.8 1.6-.8.1.6-.1 1.2-.4 1.7zm.4 1c-.9 0-1.7-.5-2.2-.5-.5 0-1.2.5-2 .5-.9 0-1.8-.5-2.3-1.4-1-1.7-.3-4.3.7-5.7.5-.7 1.1-1.1 1.8-1.1.7 0 1.3.5 1.8.5.4 0 1.2-.5 2-.5.8 0 1.5.4 1.9 1-1.7.9-1.4 3.1.3 3.8-.4 1-.9 2-1.6 2.9h-.4zm5 3.7V9.7h3.1c1.5 0 2.5 1 2.5 2.4s-1 2.4-2.5 2.4H24v3h-1.2zm1.2-4.1h1.8c.8 0 1.4-.5 1.4-1.3 0-.8-.6-1.3-1.4-1.3h-1.8v2.6zm6.8 4.2c-.8 0-1.4-.4-1.8-1.1l1-.6c.2.4.5.6.8.6.5 0 .8-.3.8-.7v-.4c-.2.3-.6.5-1.1.5-1.1 0-1.9-.8-1.9-2s.8-2.1 1.9-2.1c.5 0 .9.2 1.1.5v-.4h1.1v4c0 1.1-.7 1.7-1.9 1.7zm0-2.3c.6 0 1.1-.4 1.1-1.1 0-.6-.5-1.1-1.1-1.1s-1.1.4-1.1 1.1c0 .6.5 1.1 1.1 1.1zm7.3 2.2l-1.3-3.6-1.3 3.6h-1.3l2-5-2-4.6h1.3l1.3 3.4 1.3-3.4h1.3l-3.3 7.6h-.7l2-1z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function GooglePayLogo({ className }: PaymentLogoProps) {
  return (
    <svg viewBox="0 0 48 32" className={cn('h-6 w-auto', className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
      {/* Google G */}
      <path
        d="M17.5 16.1c0-.4 0-.8-.1-1.1H12v2.2h3.1c-.1.7-.6 1.4-1.3 1.8v1.5h2.1c1.2-1.1 1.8-2.7 1.8-4.4z"
        fill="#4285F4"
      />
      <path
        d="M12 21.7c1.5 0 2.8-.5 3.8-1.4l-2.1-1.5c-.5.3-1.1.5-1.7.5-1.3 0-2.5-.9-2.9-2.1H6.9v1.6c1 1.9 3 2.9 5.1 2.9z"
        fill="#34A853"
      />
      <path
        d="M9.1 17.2c-.2-.6-.2-1.3 0-1.9v-1.6H6.9c-.8 1.6-.8 3.5 0 5.1l2.2-1.6z"
        fill="#FBBC04"
      />
      <path
        d="M12 12.6c.8 0 1.6.3 2.2.9l1.6-1.6C14.8 11 13.4 10.4 12 10.4c-2.1 0-4.1 1.1-5.1 2.9l2.2 1.6c.4-1.2 1.6-2.3 2.9-2.3z"
        fill="#EA4335"
      />
      {/* Pay text */}
      <path
        d="M23.3 14.5v-3.8h-1.4v8.8h1.4v-3.2h2c1.7 0 2.9-1.2 2.9-2.7 0-1.6-1.2-2.7-2.9-2.7h-2zm2 4.1h-2v-2.8h2c1 0 1.6.6 1.6 1.4 0 .9-.6 1.4-1.6 1.4zm5.5.9c-.8 0-1.5-.3-1.8-.9l1.2-.5c.2.4.6.5.9.5.4 0 .8-.2.8-.6v-.3c-.2.3-.6.5-1.1.5-1.1 0-1.8-.7-1.8-1.7s.7-1.7 1.8-1.7c.5 0 .9.2 1.1.5v-.4h1.3v3.7c0 1.1-.7 1.7-1.8 1.7zm.1-2.1c.5 0 .9-.4.9-1s-.4-1-.9-1-.9.4-.9 1 .4 1 .9 1zm6.9 2.1l-1.3-3.6-1.3 3.6h-1.4l2-5-2-4.5h1.4l1.3 3.4 1.3-3.4h1.4l-3.3 7.5h-.7l2-1z"
        fill="#5F6368"
      />
    </svg>
  );
}

export function PaymentMethodBadges({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="group relative flex items-center justify-center rounded-lg border border-edge bg-surface shadow-subtle p-1 transition-transform hover:-translate-y-0.5" title="Visa">
        <VisaLogo className="h-7 w-11" />
      </div>
      <div className="group relative flex items-center justify-center rounded-lg border border-edge bg-surface shadow-subtle p-1 transition-transform hover:-translate-y-0.5" title="Mastercard">
        <MastercardLogo className="h-7 w-11" />
      </div>
      <div className="group relative flex items-center justify-center rounded-lg border border-edge bg-surface shadow-subtle p-1 transition-transform hover:-translate-y-0.5" title="American Express">
        <AmexLogo className="h-7 w-11" />
      </div>
      <div className="group relative flex items-center justify-center rounded-lg border border-edge bg-surface shadow-subtle p-1 transition-transform hover:-translate-y-0.5" title="Stripe">
        <StripeLogo className="h-7 w-11" />
      </div>
      <div className="group relative flex items-center justify-center rounded-lg border border-edge bg-surface shadow-subtle p-1 transition-transform hover:-translate-y-0.5" title="Apple Pay">
        <ApplePayLogo className="h-7 w-11" />
      </div>
      <div className="group relative flex items-center justify-center rounded-lg border border-edge bg-surface shadow-subtle p-1 transition-transform hover:-translate-y-0.5" title="Google Pay">
        <GooglePayLogo className="h-7 w-11" />
      </div>
    </div>
  );
}
