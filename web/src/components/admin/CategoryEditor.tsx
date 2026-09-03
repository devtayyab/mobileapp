'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderTree, Plus, Trash2 } from 'lucide-react';
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
  Textarea,
  type Column,
} from '@/components/ui';
import { AdminToggleRow } from '@/components/admin/AdminToggleRow';

/**
 * Only the columns the mobile screen manages. `categories` also has
 * `parent_id` and `image_url`, which app/admin/categories.tsx never touches —
 * the update payload leaves them alone rather than nulling them out.
 *
 * NOTE: `categories` has **no `updated_at` column** (migration 20260115152126),
 * unlike countries/couriers — never send one.
 */
export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  display_order: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  display_order: '0',
  is_active: true,
};

/**
 * Mobile normalizes with `name.toLowerCase().replace(/\s+/g, '-')`; this keeps
 * that behavior and additionally collapses/trims runs of dashes.
 */
const slugify = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

export function CategoryEditor({ initialCategories }: { initialCategories: AdminCategoryRow[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});
  const [pendingDelete, setPendingDelete] = useState<AdminCategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setErrors({});
    setEditorOpen(true);
  };

  const openEdit = (category: AdminCategoryRow) => {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      display_order: String(category.display_order ?? 0),
      // Mobile defaults a null flag to active.
      is_active: category.is_active !== false,
    });
    // Never re-derive the slug of a live category from its name.
    setSlugTouched(true);
    setErrors({});
    setEditorOpen(true);
  };

  const onNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name),
    }));
  };

  const save = async () => {
    const nextErrors: { name?: string; slug?: string } = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!slugify(form.slug)) nextErrors.slug = 'Slug is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      description: form.description.trim() || null,
      display_order: Number.parseInt(form.display_order, 10) || 0,
      is_active: form.is_active,
    };

    setSaving(true);
    const supabase = createClient();

    const { data, error } = editing
      ? await supabase
          .from('categories')
          .update(payload)
          .eq('id', editing.id)
          .select('id, name, slug, description, display_order, is_active')
      : await supabase
          .from('categories')
          .insert(payload)
          .select('id, name, slug, description, display_order, is_active');

    setSaving(false);

    if (error) {
      toast({
        title: editing ? 'Could not save category' : 'Could not create category',
        message:
          error.code === '23505'
            ? `The slug "${payload.slug}" is already used by another category.`
            : error.message,
        kind: 'error',
      });
      return;
    }

    const saved = (data ?? [])[0] as AdminCategoryRow | undefined;

    if (!saved) {
      // RLS matched no row: PostgREST reports success with an empty body.
      toast({
        title: 'Change was not applied',
        message:
          'The database accepted the request but changed no row — your account may lack permission on categories.',
        kind: 'error',
      });
      return;
    }

    setCategories((prev) =>
      editing
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [...prev, saved].sort((a, b) => a.display_order - b.display_order)
    );
    setEditorOpen(false);
    toast({
      title: editing ? 'Category updated' : 'Category created',
      message: saved.name,
      kind: 'success',
    });
    router.refresh();
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setDeleting(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', pendingDelete.id)
      .select('id');

    setDeleting(false);

    if (error) {
      toast({
        title: 'Delete failed',
        // 23503 = still referenced by another table.
        message:
          error.code === '23503'
            ? 'This category is still referenced by existing rows and cannot be deleted.'
            : error.message,
        kind: 'error',
      });
      return;
    }

    if (!data || data.length === 0) {
      toast({
        title: 'Delete blocked',
        message:
          'No row was deleted — row-level security rejected the request. Deactivate the category instead.',
        kind: 'error',
      });
      setPendingDelete(null);
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== pendingDelete.id));
    setPendingDelete(null);
    toast({ title: 'Category deleted', message: pendingDelete.name, kind: 'success' });
    router.refresh();
  };

  const columns: Column<AdminCategoryRow>[] = [
    {
      key: 'name',
      header: 'Category',
      sortValue: (c) => c.name.toLowerCase(),
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-tint text-primary">
            <FolderTree size={17} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-content-primary">{c.name}</p>
            <p className="truncate text-sm text-content-tertiary">{c.description ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      sortValue: (c) => c.slug,
      render: (c) => <code className="text-sm text-content-tertiary">{c.slug}</code>,
    },
    {
      key: 'display_order',
      header: 'Order',
      align: 'right',
      sortValue: (c) => c.display_order ?? 0,
      render: (c) => <span className="text-content-tertiary">{c.display_order ?? 0}</span>,
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
          placeholder="Search categories…"
          className="w-full sm:w-80"
        />
        <Button onClick={openCreate}>
          <Plus size={17} />
          Add Category
        </Button>
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(c) => c.id}
        onRowClick={openEdit}
        emptyState={
          <EmptyState
            icon={<FolderTree size={26} />}
            title="No categories found"
            message={
              categories.length === 0
                ? 'Create your first product category to get started.'
                : 'Try a different search term.'
            }
            action={
              <Button onClick={openCreate}>
                <Plus size={17} />
                Add Category
              </Button>
            }
          />
        }
      />

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              {editing ? 'Save Category' : 'Create Category'}
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Input
            label="Category Name"
            value={form.name}
            error={errors.name}
            placeholder="e.g. Electronics"
            onChange={(e) => onNameChange(e.target.value)}
          />

          <div>
            <Input
              label="Slug (URL-friendly name)"
              value={form.slug}
              error={errors.slug}
              placeholder="e.g. electronics"
              autoCapitalize="none"
              spellCheck={false}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: e.target.value }));
              }}
            />
            <p className="mt-1.5 text-sm text-content-tertiary">
              {editing || slugTouched
                ? 'Saved as '
                : 'Derived from the name until you edit it — saved as '}
              <code className="font-bold">{slugify(form.slug) || '…'}</code>
            </p>
          </div>

          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            placeholder="Optional description"
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />

          <Input
            label="Display Order"
            type="number"
            inputMode="numeric"
            value={form.display_order}
            placeholder="e.g. 1"
            onChange={(e) => setForm((prev) => ({ ...prev, display_order: e.target.value }))}
          />

          <AdminToggleRow
            label="Active"
            hint="Inactive categories are hidden from shoppers."
            checked={form.is_active}
            onChange={(is_active) => setForm((prev) => ({ ...prev, is_active }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void remove()}
        title="Delete Category"
        message={`Delete "${
          pendingDelete?.name ?? ''
        }"? Products in this category keep their listing but lose their category. If any row still references it the database will refuse.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
