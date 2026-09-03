'use client';

import { motion } from 'framer-motion';

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-edge bg-surface px-6 py-14 text-center"
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-tint text-primary">
          {icon}
        </div>
      )}
      <h3 className="text-2xl font-bold text-content-primary">{title}</h3>
      {message && <p className="max-w-sm text-lg text-content-tertiary">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}
