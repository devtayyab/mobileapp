'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Plus, Trash2, Truck } from 'lucide-react';
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

/**
 * `couriers.tracking_url_format` and `is_active` are both **nullable**
 * (migration 20260615145100). Mobile's local `Courier` type declares
 * `tracking_url_format: string` — that is wrong; it is `string | null`.
 */
export type AdminCourierRow = {
  id: string;
  name: string;
  code: string;
  tracking_url_format: string | null;
  is_active: boolean | null;
};

type FormState = {
  name: string;
  code: string;
  tracking_url_format: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  code: '',
  tracking_url_format: '',
  is_active: true,
};

/** The token `shipments`-facing screens substitute at render time. */
const PLACEHOLDER = '{tracking_number}';

/** Obviously-fake sample so the preview is never mistaken for real data. */
const SAMPLE_TRACKING_NUMBER = 'TRACK123456789';

const resolveExample = (format: string) =>
  format.split(PLACEHOLDER).join(SAMPLE_TRACKING_NUMBER);

export function CourierEditor({ initialCouriers }: { initialCouriers: AdminCourierRow[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [couriers, setCouriers] = useState(initialCouriers);
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCourierRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; code?: string; url?: string }>({});
  const [pendingDelete, setPendingDelete] = useState<AdminCourierRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return couriers;

    return couriers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [couriers, search]);

  const trimmedFormat = form.tracking_url_format.trim();
  const formatHasPlaceholder = trimmedFormat.includes(PLACEHOLDER);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setEditorOpen(true);
  };

  const openEdit = (courier: AdminCourierRow) => {
    setEditing(courier);
    setForm({
      name: courier.name,
      code: courier.code,
      tracking_url_format: courier.tracking_url_format ?? '',
      is_active: courier.is_active !== false,
    });
    setErrors({});
    setEditorOpen(true);
  };

  const save = async () => {
    const code = form.code.trim().toUpperCase();

    const nextErrors: { name?: string; code?: string; url?: string } = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!code) nextErrors.code = 'Code is required';
    // The column is nullable, so a blank format is allowed — but a format that
    // is present and has no placeholder would produce dead tracking links.
    if (trimmedFormat && !trimmedFormat.includes(PLACEHOLDER))
      nextErrors.url = `The format must contain ${PLACEHOLDER}`;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      code,
      // Store NULL rather than '' so "no tracking URL" is one value, not two.
      tracking_url_format: trimmedFormat || null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    const supabase = createClient();

    const { data, error } = editing
      ? await supabase
          .from('couriers')
          .update(payload)
          .eq('id', editing.id)
          .select('id, name, code, tracking_url_format, is_active')
      : await supabase
          .from('couriers')
          .insert(payload)
          .select('id, name, code, tracking_url_format, is_active');

    setSaving(false);

    if (error) {
      toast({
        title: editing ? 'Could not save courier' : 'Could not create courier',
        message:
          error.code === '23505' ? `Courier code "${code}" already exists.` : error.message,
        kind: 'error',
      });
      return;
    }

    const saved = (data ?? [])[0] as AdminCourierRow | undefined;

    if (!saved) {
      toast({
        title: 'Change was not applied',
        message:
          'The database accepted the request but changed no row — your account may lack permission on couriers.',
        kind: 'error',
      });
      return;
    }

    setCouriers((prev) =>
      editing
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditorOpen(false);
    toast({
      title: editing ? 'Courier updated' : 'Courier created',
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
      .from('couriers')
      .delete()
      .eq('id', pendingDelete.id)
      .select('id');

    setDeleting(false);

    if (error) {
      toast({
        title: 'Delete failed',
        message:
          error.code === '23503'
            ? 'This courier is still referenced by existing rows and cannot be deleted.'
            : error.message,
        kind: 'error',
      });
      return;
    }

    if (!data || data.length === 0) {
      toast({
        title: 'Delete blocked',
        message:
          'No row was deleted — row-level security rejected the request. Deactivate the courier instead.',
        kind: 'error',
      });
      setPendingDelete(null);
      return;
    }

    setCouriers((prev) => prev.filter((c) => c.id !== pendingDelete.id));
    setPendingDelete(null);
    toast({ title: 'Courier deleted', message: pendingDelete.name, kind: 'success' });
    router.refresh();
  };

  const columns: Column<AdminCourierRow>[] = [
    {
      key: 'name',
      header: 'Courier',
      sortValue: (c) => c.name.toLowerCase(),
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-tint text-primary">
            <Truck size={17} />
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
      key: 'tracking_url_format',
      header: 'Tracking URL Format',
      className: 'max-w-[22rem]',
      sortValue: (c) => c.tracking_url_format ?? '',
      render: (c) =>
        c.tracking_url_format ? (
          <code className="block truncate text-sm text-content-tertiary">
            {c.tracking_url_format}
          </code>
        ) : (
          <span className="text-sm text-content-tertiary">Not set</span>
        ),
    },
    {
      key: 'placeholder',
      header: 'Placeholder',
      render: (c) =>
        !c.tracking_url_format ? (
          <Badge tone="neutral">None</Badge>
        ) : c.tracking_url_format.includes(PLACEHOLDER) ? (
          <Badge tone="success">OK</Badge>
        ) : (
          <Badge tone="warning">Missing</Badge>
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
          placeholder="Search couriers…"
          className="w-full sm:w-80"
        />
        <Button onClick={openCreate}>
          <Plus size={17} />
          Add Courier
        </Button>
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(c) => c.id}
        onRowClick={openEdit}
        emptyState={
          <EmptyState
            icon={<Truck size={26} />}
            title="No couriers found"
            message={
              couriers.length === 0
                ? 'Add the couriers you ship with so shipments can link to tracking pages.'
                : 'Try a different search term.'
            }
            action={
              <Button onClick={openCreate}>
                <Plus size={17} />
                Add Courier
              </Button>
            }
          />
        }
      />

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? 'Edit Courier' : 'Add Courier'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              {editing ? 'Save Courier' : 'Create Courier'}
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Input
            label="Courier Name"
            value={form.name}
            error={errors.name}
            placeholder="e.g. DHL"
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />

          <Input
            label="Courier Code"
            value={form.code}
            error={errors.code}
            placeholder="e.g. DHL"
            spellCheck={false}
            className="uppercase"
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
          />

          <div>
            <Input
              label="Tracking URL Format"
              value={form.tracking_url_format}
              error={errors.url}
              placeholder={`e.g. https://dhl.com/track?id=${PLACEHOLDER}`}
              spellCheck={false}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tracking_url_format: e.target.value }))
              }
            />
            <p className="mt-1.5 text-sm text-content-tertiary">
              Use <code className="font-bold">{PLACEHOLDER}</code> where the shipment&rsquo;s
              tracking number belongs. Leave blank to store no tracking URL.
            </p>

            {trimmedFormat && (
              <div className="mt-2 rounded-xl border border-edge bg-surface-page p-3">
                <p className="text-sm font-bold uppercase tracking-[0.5px] text-content-tertiary">
                  Example for {SAMPLE_TRACKING_NUMBER}
                </p>
                {formatHasPlaceholder ? (
                  <p className="mt-1 inline-flex items-start gap-1.5 break-all text-base font-bold text-content-primary">
                    <ExternalLink size={13} className="mt-0.5 shrink-0" />
                    <code>{resolveExample(trimmedFormat)}</code>
                  </p>
                ) : (
                  <p className="mt-1 text-base font-bold text-error">
                    No {PLACEHOLDER} in the format — every shipment would link to the same page.
                  </p>
                )}
              </div>
            )}
          </div>

          <AdminToggleRow
            label="Active"
            hint="Inactive couriers can't be picked for new shipments."
            checked={form.is_active}
            onChange={(is_active) => setForm((prev) => ({ ...prev, is_active }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void remove()}
        title="Delete Courier"
        message={`Delete "${
          pendingDelete?.name ?? ''
        }"? Existing shipments keep their tracking number but lose the courier link. If any row still blocks the delete the database error is shown.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
