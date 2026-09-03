'use client';

/**
 * Account overview — port of mobile `app/(tabs)/profile.tsx`.
 *
 * Same sections, same destinations: Account, Supplier Tools (supplier/admin),
 * Admin Tools (admin), Support, then sign out and the quieter "Delete Account"
 * affordance. Deletion calls the `delete_user` RPC exactly as mobile's
 * `AuthContext.deleteAccount()` does, then clears the local session.
 *
 * Mobile's guest branch is not ported: this route is role-gated server-side, so
 * a signed-out visitor is redirected to /login before rendering.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  User,
  UserX,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar, Badge, ConfirmDialog } from '@/components/ui';
import type { Profile, Role } from '@/types/database';

type MenuEntry = {
  href: string;
  label: string;
  icon: React.ReactNode;
  tint: string;
};

/** Mobile `getRoleConfig()` — labels come from the shared translation bundle. */
function roleBadge(role: Role, t: Record<string, string>) {
  switch (role) {
    case 'b2b':
      return { label: t.wholesaleCustomer ?? 'Wholesale Customer', tone: 'info' as const };
    case 'supplier':
      return { label: t.supplier ?? 'Supplier', tone: 'warning' as const };
    case 'admin':
      return { label: t.administrator ?? 'Administrator', tone: 'error' as const };
    default:
      return { label: t.customerRole ?? 'Customer', tone: 'success' as const };
  }
}

export function ProfileMenu({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManage = profile.role === 'supplier' || profile.role === 'admin';
  const badge = roleBadge(profile.role, t);

  const handleSignOut = async () => {
    setSignOutOpen(false);
    await createClient().auth.signOut();
    router.replace('/welcome');
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);

    const supabase = createClient();
    const { error } = await supabase.rpc('delete_user');

    if (error) {
      setDeleting(false);
      toast({
        title: t.error ?? 'Error',
        message: error.message || 'Failed to delete account. Please try again.',
        kind: 'error',
      });
      return;
    }

    // The account is gone server-side; drop the local session too. Sign-out can
    // fail harmlessly now that the user no longer exists, so it is not checked.
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }

    setDeleting(false);
    setDeleteOpen(false);
    router.replace('/');
    router.refresh();
  };

  const accountMenu: MenuEntry[] = [
    {
      href: '/profile/edit',
      label: t.editProfile ?? 'Edit Profile',
      icon: <User size={20} />,
      tint: 'text-info',
    },
    {
      href: '/chat',
      label: 'My Chats',
      icon: <MessageSquare size={20} />,
      tint: 'text-warning',
    },
    {
      href: '/profile/settings',
      label: t.settings ?? 'Settings',
      icon: <Settings size={20} />,
      tint: 'text-success',
    },
  ];

  const supplierMenu: MenuEntry[] = [
    {
      href: '/supplier/dashboard',
      label: 'Supplier Dashboard',
      icon: <LayoutDashboard size={20} />,
      tint: 'text-warning',
    },
    {
      href: '/supplier/products',
      label: 'Manage Products',
      icon: <Package size={20} />,
      tint: 'text-secondary',
    },
    {
      href: '/supplier/orders',
      label: 'Manage Orders',
      icon: <Truck size={20} />,
      tint: 'text-success',
    },
    {
      href: '/supplier/kyc',
      label: 'KYC Verification',
      icon: <ShieldCheck size={20} />,
      tint: 'text-error',
    },
  ];

  const adminMenu: MenuEntry[] = [
    {
      href: '/admin',
      label: 'Admin Dashboard',
      icon: <LayoutDashboard size={20} />,
      tint: 'text-error',
    },
  ];

  const supportMenu: MenuEntry[] = [
    {
      href: '/chat',
      label: 'Chat with Owner',
      icon: <MessageSquare size={20} />,
      tint: 'text-warning',
    },
    {
      href: '/help',
      label: t.helpCenter ?? 'Help Center',
      icon: <CircleHelp size={20} />,
      tint: 'text-content-tertiary',
    },
    {
      href: '/terms',
      label: t.termsConditions ?? 'Terms & Conditions',
      icon: <FileText size={20} />,
      tint: 'text-content-tertiary',
    },
    {
      href: '/privacy',
      label: t.privacyPolicy ?? 'Privacy Policy',
      icon: <FileText size={20} />,
      tint: 'text-content-tertiary',
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        className="flex items-center gap-4 rounded-2xl border border-edge bg-surface p-5"
      >
        <Avatar name={profile.full_name ?? profile.email} size={64} className="rounded-pill" />
        <div className="min-w-0">
          <h1 className="truncate text-4xl font-extrabold tracking-[-0.3px] text-content-primary">
            {profile.full_name || 'User'}
          </h1>
          <p className="mt-0.5 truncate text-md text-content-secondary">{profile.email}</p>
          <Badge tone={badge.tone} className="mt-1.5">
            {badge.label}
          </Badge>
        </div>
      </motion.header>

      <MenuSection title={t.account ?? 'Account'} entries={accountMenu} />
      {canManage && (
        <MenuSection title={t.supplierTools ?? 'Supplier Tools'} entries={supplierMenu} />
      )}
      {profile.role === 'admin' && (
        <MenuSection title={t.adminTools ?? 'Admin Tools'} entries={adminMenu} />
      )}
      <MenuSection title={t.support ?? 'Support'} entries={supportMenu} />

      <button
        type="button"
        onClick={() => setSignOutOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-error/20 bg-surface py-3.5 text-lg font-bold text-error transition-colors hover:bg-error/5"
      >
        <LogOut size={18} />
        {t.signOut ?? 'Sign Out'}
      </button>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 py-3 text-md font-bold text-content-tertiary transition-colors hover:text-error"
      >
        <UserX size={16} />
        Delete Account
      </button>

      <p className="pb-4 text-center text-sm text-content-tertiary">
        {t.version ?? 'Version'} 1.0.0
      </p>

      <ConfirmDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => void handleSignOut()}
        title={t.signOut ?? 'Sign Out'}
        message={t.signOutConfirm ?? 'Are you sure you want to sign out?'}
        confirmLabel={t.signOut ?? 'Sign Out'}
        destructive
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => (deleting ? undefined : setDeleteOpen(false))}
        onConfirm={() => void handleDelete()}
        title={t.deleteAccount ?? 'Delete Account'}
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmLabel={t.delete ?? 'Delete'}
        destructive
        loading={deleting}
      />
    </div>
  );
}

function MenuSection({ title, entries }: { title: string; entries: MenuEntry[] }) {
  return (
    <section>
      <h2 className="mb-2.5 text-sm font-bold uppercase tracking-[0.8px] text-content-tertiary">
        {title}
      </h2>
      <ul className="overflow-hidden rounded-2xl border border-edge bg-surface">
        {entries.map((entry, index) => (
          <li key={`${entry.href}-${entry.label}`}>
            <Link
              href={entry.href}
              className={`flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-page ${
                index > 0 ? 'border-t border-edge' : ''
              }`}
            >
              <span
                className={`flex h-[38px] w-[38px] items-center justify-center rounded-md bg-surface-tint ${entry.tint}`}
              >
                {entry.icon}
              </span>
              <span className="flex-1 text-lg font-bold text-content-primary">{entry.label}</span>
              <ChevronRight size={18} className="text-content-tertiary" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
