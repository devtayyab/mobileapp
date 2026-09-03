'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Bell, Info, ShoppingBag, Truck, X, CheckCircle2, AlertCircle } from 'lucide-react';

export type ToastKind =
  | 'info'
  | 'success'
  | 'error'
  | 'new_order'
  | 'order_status'
  | 'new_product';

export type Toast = {
  id: string;
  title: string;
  message?: string;
  kind: ToastKind;
  onClick?: () => void;
};

/** Icon + color per type, matching contexts/NotificationContext.tsx */
const TOAST_STYLE: Record<ToastKind, { icon: typeof Bell; color: string }> = {
  new_order: { icon: ShoppingBag, color: '#1D4ED8' },
  order_status: { icon: Truck, color: '#059669' },
  new_product: { icon: Bell, color: '#EA580C' },
  success: { icon: CheckCircle2, color: '#4CAF50' },
  error: { icon: AlertCircle, color: '#EF4444' },
  info: { icon: Info, color: '#6B7280' },
};

type ToastContextValue = {
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/** Mobile auto-dismisses toasts after 6s. */
const AUTO_DISMISS_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [{ ...t, id }, ...prev].slice(0, 4));
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-5 z-[9999] flex flex-col items-center gap-2.5 px-4">
        <AnimatePresence>
          {toasts.map((t) => {
            const { icon: Icon, color } = TOAST_STYLE[t.kind] ?? TOAST_STYLE.info;

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40, scale: 0.96 }}
                // Tuned to mobile's Animated.spring(tension 40, friction 7)
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                onClick={t.onClick}
                role={t.onClick ? 'button' : 'status'}
                tabIndex={t.onClick ? 0 : undefined}
                onKeyDown={
                  t.onClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          t.onClick?.();
                        }
                      }
                    : undefined
                }
                className={cn(
                  'pointer-events-auto w-full max-w-md rounded-2xl border border-edge-light bg-surface shadow-float',
                  t.onClick && 'cursor-pointer'
                )}
              >
                <div className="flex items-start gap-3 p-3.5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-page"
                    style={{ color }}
                  >
                    <Icon size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-md font-bold text-content-secondary">{t.title}</p>
                    {t.message && (
                      <p className="mt-0.5 text-sm leading-4 text-content-tertiary">{t.message}</p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(t.id);
                    }}
                    aria-label="Dismiss"
                    className="text-content-tertiary hover:text-content-primary"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
