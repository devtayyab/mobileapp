'use client';

/**
 * Edit profile — port of mobile `app/profile/edit.tsx`.
 *
 * `profiles.address` is a free-form jsonb column. Mobile writes exactly
 * `{ street, city, state, zipCode, country }` (note the camelCase `zipCode`),
 * and reads the same keys back, so this form keeps that shape byte-for-byte:
 * a profile edited on either app stays readable by the other.
 *
 * Business Info is shown for b2b and supplier, matching the mobile condition
 * `profile.role === 'b2b' || profile.role === 'supplier'`.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button, Input } from '@/components/ui';
import type { Profile } from '@/types/database';

/** The exact jsonb shape mobile persists. */
type ProfileAddress = {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
};

export function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();

  const address = (profile.address ?? {}) as ProfileAddress;

  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [companyName, setCompanyName] = useState(profile.company_name ?? '');
  const [taxId, setTaxId] = useState(profile.tax_id ?? '');
  const [street, setStreet] = useState(address.street ?? '');
  const [city, setCity] = useState(address.city ?? '');
  const [state, setState] = useState(address.state ?? '');
  const [zipCode, setZipCode] = useState(address.zipCode ?? '');
  const [country, setCountry] = useState(address.country ?? '');
  const [saving, setSaving] = useState(false);

  const showBusiness = profile.role === 'b2b' || profile.role === 'supplier';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await createClient()
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        company_name: companyName,
        tax_id: taxId,
        address: { street, city, state, zipCode, country },
      })
      .eq('id', profile.id);

    setSaving(false);

    if (error) {
      toast({ title: t.error ?? 'Error', message: error.message, kind: 'error' });
      return;
    }

    toast({
      title: t.success ?? 'Success',
      message: t.profileUpdated ?? 'Profile updated successfully',
      kind: 'success',
    });
    router.push('/profile');
    router.refresh();
  };

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="Back to account"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary transition-colors hover:text-content-primary"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
          {t.editProfile ?? 'Edit Profile'}
        </h1>
      </div>

      <Section title={t.personalInfo ?? 'Personal Information'}>
        <Input
          label={t.fullName ?? 'Full Name'}
          placeholder={t.enterFullName ?? 'Enter your full name'}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
        <Input
          label={t.phone ?? 'Phone'}
          type="tel"
          placeholder={t.phone ?? 'Phone'}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
        <Input
          label={t.email ?? 'Email'}
          value={profile.email}
          disabled
          readOnly
          className="bg-surface-tint text-content-tertiary"
        />
      </Section>

      {showBusiness && (
        <Section title={t.businessInfo ?? 'Business Information'}>
          <Input
            label={t.companyName ?? 'Company Name'}
            placeholder={t.companyName ?? 'Company Name'}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoComplete="organization"
          />
          <Input
            label={t.taxId ?? 'Tax ID'}
            placeholder={t.taxId ?? 'Tax ID'}
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />
        </Section>
      )}

      <Section title={t.address ?? 'Address'}>
        <Input
          label={t.streetAddress ?? 'Street Address'}
          placeholder={t.streetAddress ?? 'Street Address'}
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          autoComplete="street-address"
        />
        <Input
          label={t.city ?? 'City'}
          placeholder={t.city ?? 'City'}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          autoComplete="address-level2"
        />
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Input
            label={t.state ?? 'State'}
            placeholder={t.state ?? 'State'}
            value={state}
            onChange={(e) => setState(e.target.value)}
            autoComplete="address-level1"
          />
          <Input
            label={t.zipCode ?? 'ZIP Code'}
            placeholder={t.zipCode ?? 'ZIP Code'}
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            autoComplete="postal-code"
          />
        </div>
        <Input
          label={t.country ?? 'Country'}
          placeholder={t.country ?? 'Country'}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          autoComplete="country-name"
        />
      </Section>

      <Button type="submit" fullWidth size="lg" loading={saving}>
        <Save size={20} />
        {t.save ?? 'Save'}
      </Button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-4">
      <h2 className="mb-3.5 text-md font-bold uppercase tracking-[0.6px] text-content-tertiary">
        {title}
      </h2>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}
