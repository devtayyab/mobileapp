'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Input recipe: radius 14, 1.5px border.medium, bg background.primary, h-[50px] */
const FIELD =
  'w-full rounded-xl border-[1.5px] border-edge bg-surface-page px-3.5 text-md text-content-primary ' +
  'placeholder:text-content-tertiary outline-none transition-colors focus:border-secondary ' +
  'disabled:opacity-60';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon, className, type = 'text', ...props },
  ref
) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && reveal ? 'text' : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-md font-bold text-content-primary">{label}</label>}

      <div className="relative flex items-center">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 text-content-tertiary">{icon}</span>
        )}
        <input
          ref={ref}
          type={resolvedType}
          className={cn(
            FIELD,
            'h-[50px]',
            icon && 'pl-11',
            isPassword && 'pr-11',
            error && 'border-error',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            tabIndex={-1}
            className="absolute right-3 text-content-tertiary hover:text-content-primary"
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <p className="text-base font-medium text-error">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(function Textarea({ label, error, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-md font-bold text-content-primary">{label}</label>}
      <textarea
        ref={ref}
        className={cn(FIELD, 'py-3', error && 'border-error', className)}
        {...props}
      />
      {error && <p className="text-base font-medium text-error">{error}</p>}
    </div>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }
>(function Select({ label, error, className, children, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-md font-bold text-content-primary">{label}</label>}
      <select
        ref={ref}
        className={cn(FIELD, 'h-[50px]', error && 'border-error', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-base font-medium text-error">{error}</p>}
    </div>
  );
});
