import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import ProductForm from '@/components/ProductForm';

export default async function NewSupplierProductPage() {
  const { user, profile } = await requireRole(['supplier']);
  const supabase = await createClient();

  const { data: categories } = await supabase.from('categories').select('id, name').order('name');

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Add product</h1>
      <ProductForm
        categories={categories ?? []}
        userId={user.id}
        businessNameFallback={profile.full_name ?? profile.email}
      />
    </div>
  );
}
