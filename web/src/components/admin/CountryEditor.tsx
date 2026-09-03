'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe2, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Input,
  Modal,
  SearchInput,
  type Column,
} from '@/components/ui';
import { AdminToggleRow } from '@/components/admin/AdminToggleRow';

/** `countries.vat_type` is free-text with a 'excluded' default; only these two values are used. */
export type VatType = 'included' | 'excluded';

export type AdminCountryRow = {
  id: string;
  name: string;
  code: string;
  /** numeric(5,2) — arrives as a JS number through PostgREST. */
  vat_percentage: number;
  vat_type: string;
  is_active: boolean;
};

type FormState = {
  name: string;
  code: string;
  vat_percentage: string;
  vat_type: VatType;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  code: '',
  vat_percentage: '0',
  vat_type: 'excluded',
  is_active: true,
};

const VAT_TYPES: { value: VatType; label: string; hint: string }[] = [
  { value: 'excluded', label: 'Excluded', hint: 'VAT is added at checkout' },
  { value: 'included', label: 'Included', hint: 'Prices already contain VAT' },
];

const vatTypeLabel = (value: string) =>
  value === 'included' ? 'Included in Price' : 'Added at Checkout';

export function CountryEditor({ initialCountries }: { initialCountries: AdminCountryRow[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [countries, setCountries] = useState(initialCountries);
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCountryRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; code?: string; vat?: string }>({});
  const [pendingDelete, setPendingDelete] = useState<AdminCountryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;

    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countries, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setEditorOpen(true);
  };

  const openEdit = (country: AdminCountryRow) => {
    setEditing(country);
    setForm({
      name: country.name,
      code: country.code,
      vat_percentage: String(country.vat_percentage ?? 0),
      vat_type: country.vat_type === 'included' ? 'included' : 'excluded',
      is_active: country.is_active !== false,
    });
    setErrors({});
    setEditorOpen(true);
  };

  const save = async () => {
    const code = form.code.trim().toUpperCase();
    const vat = Number.parseFloat(form.vat_percentage);

    const nextErrors: { name?: string; code?: string; vat?: string } = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!/^[A-Z]{2}$/.test(code)) nextErrors.code = 'Enter a 2-letter country code (e.g. GB)';
    // numeric(5,2) caps the stored value at 999.99; a VAT rate is a percentage.
    if (!Number.isFinite(vat) || vat < 0 || vat > 100)
      nextErrors.vat = 'Enter a percentage between 0 and 100';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      code,
      vat_percentage: vat,
      vat_type: form.vat_type,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    const supabase = createClient();

    const { data, error } = editing
      ? await supabase
          .from('countries')
          .update(payload)
          .eq('id', editing.id)
          .select('id, name, code, vat_percentage, vat_type, is_active')
      : await supabase
          .from('countries')
          .insert(payload)
          .select('id, name, code, vat_percentage, vat_type, is_active');

    setSaving(false);

    if (error) {
      toast({
        title: editing ? 'Could not save country' : 'Could not create country',
        message:
          error.code === '23505'
            ? `Country code "${code}" already exists.`
            : error.message,
        kind: 'error',
      });
      return;
    }

    const saved = (data ?? [])[0] as AdminCountryRow | undefined;

    if (!saved) {
      toast({
        title: 'Change was not applied',
        message:
          'The database accepted the request but changed no row — your account may lack permission on countries.',
        kind: 'error',
      });
      return;
    }

    setCountries((prev) =>
      editing
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditorOpen(false);
    toast({
      title: editing ? 'Country updated' : 'Country created',
      message: `${saved.name} (${saved.code})`,
      kind: 'success',
    });
    router.refresh();
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setDeleting(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('countries')
      .delete()
      .eq('id', pendingDelete.id)
      .select('id');

    setDeleting(false);

    if (error) {
      toast({
        title: 'Delete failed',
        message:
          error.code === '23503'
            ? 'This country is still referenced by existing rows and cannot be deleted.'
            : error.message,
        kind: 'error',
      });
      return;
    }

    if (!data || data.length === 0) {
      toast({
        title: 'Delete blocked',
        message:
          'No row was deleted — row-level security rejected the request. Deactivate the country instead.',
        kind: 'error',
      });
      setPendingDelete(null);
      return;
    }

    setCountries((prev) => prev.filter((c) => c.id !== pendingDelete.id));
    setPendingDelete(null);
    toast({ title: 'Country deleted', message: pendingDelete.name, kind: 'success' });
    router.refresh();
  };

  const columns: Column<AdminCountryRow>[] = [
    {
      key: 'name',
      header: 'Country',
      sortValue: (c) => c.name.toLowerCase(),
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-tint text-primary">
            <Globe2 size={17} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-content-primary">{c.name}</p>
            <p className="truncate text-sm font-bold uppercase tracking-[0.5px] text-content-tertiary">
              {c.code}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'vat_percentage',
      header: 'VAT',
      align: 'right',
      sortValue: (c) => Number(c.vat_percentage ?? 0),
      render: (c) => (
        <span className="font-bold text-content-primary">{Number(c.vat_percentage ?? 0)}%</span>
      ),
    },
    {
      key: 'vat_type',
      header: 'VAT Type',
      sortValue: (c) => c.vat_type,
      render: (c) => (
        <Badge tone={c.vat_type === 'included' ? 'info' : 'neutral'}>
          {vatTypeLabel(c.vat_type)}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortValue: (c) => (c.is_active !== false ? 1 : 0),
      render: (c) =>
        c.is_active !== false ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="error">Inactive</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(c);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Delete ${c.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setPendingDelete(c);
            }}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search countries…"
          className="w-full sm:w-80"
        />
        <Button onClick={openCreate}>
          <Plus size={17} />
          Add Country
        </Button>
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(c) => c.id}
        onRowClick={openEdit}
        emptyState={
          <EmptyState
            icon={<Globe2 size={26} />}
            title="No countries found"
            message={
              countries.length === 0
                ? 'Add the countries you ship to and their VAT settings.'
                : 'Try a different search term.'
            }
            action={
              <Button onClick={openCreate}>
                <Plus size={17} />
                Add Country
              </Button>
            }
          />
        }
      />

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? 'Edit Country' : 'Add Country'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              {editing ? 'Save Country' : 'Create Country'}
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Input
            label="Country Name"
            value={form.name}
            error={errors.name}
            placeholder="e.g. United Kingdom"
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />

          <Input
            label="Country Code (2-letter)"
            value={form.code}
            error={errors.code}
            placeholder="e.g. GB"
            maxLength={2}
            spellCheck={false}
            className="uppercase"
            onChange={(e) =>
              setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase().slice(0, 2) }))
            }
          />

          <Input
            label="VAT Percentage (%)"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.01"
            value={form.vat_percentage}
            error={errors.vat}
            placeholder="e.g. 20"
            onChange={(e) => setForm((prev) => ({ ...prev, vat_percentage: e.target.value }))}
          />

          <div>
            <p className="mb-1.5 text-md font-bold text-content-primary">VAT Type</p>
            <div className="grid grid-cols-2 gap-2">
              {VAT_TYPES.map((option) => {
                const isActive = form.vat_type === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, vat_type: option.value }))}
                    className={`rounded-xl border-[1.5px] p-3 text-left transition-colors ${
                      isActive
                        ? 'border-primary bg-surface-tint'
                        : 'border-edge hover:bg-surface-page'
                    }`}
                  >
                    <span className="block text-md font-bold text-content-primary">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-sm text-content-tertiary">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AdminToggleRow
            label="Active"
            hint="Inactive countries are not selectable at checkout."
            checked={form.is_active}
            onChange={(is_active) => setForm((prev) => ({ ...prev, is_active }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void remove()}
        title="Delete Country"
        message={`Delete "${
          pendingDelete?.name ?? ''
        }"? Supplier shipping rates for it are removed with it, and past orders lose their shipping country. If any row still blocks the delete the database error is shown.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
