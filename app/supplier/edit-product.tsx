import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react-native';

type Category = { id: string; name: string };

type FormData = {
  name: string;
  description: string;
  category_id: string;
  b2c_price: string;
  b2b_price: string;
  moq: string;
  stock_quantity: string;
  sku: string;
  image_url: string;
};

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category_id: '',
    b2c_price: '',
    b2b_price: '',
    moq: '1',
    stock_quantity: '',
    sku: '',
    image_url: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setInitializing(true);

    const [productResult, categoriesResult] = await Promise.all([
      supabase
        .from('products')
        .select(`
          id, name, description, category_id, b2c_price, b2b_price,
          moq, stock_quantity, sku, currency, is_active,
          product_images (image_url, is_primary, display_order)
        `)
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('name'),
    ]);

    if (categoriesResult.data) setCategories(categoriesResult.data);

    if (productResult.data) {
      const p = productResult.data as any;
      const primaryImage = p.product_images?.find((img: any) => img.is_primary);
      const imageUrl = primaryImage?.image_url || p.product_images?.[0]?.image_url || '';

      setFormData({
        name: p.name || '',
        description: p.description || '',
        category_id: p.category_id || '',
        b2c_price: p.b2c_price?.toString() || '',
        b2b_price: p.b2b_price?.toString() || '',
        moq: p.moq?.toString() || '1',
        stock_quantity: p.stock_quantity?.toString() || '',
        sku: p.sku || '',
        image_url: imageUrl,
      });
    }

    setInitializing(false);
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category_id) newErrors.category_id = 'Please select a category';

    if (!formData.b2c_price.trim()) {
      newErrors.b2c_price = 'Retail price is required';
    } else if (isNaN(parseFloat(formData.b2c_price)) || parseFloat(formData.b2c_price) <= 0) {
      newErrors.b2c_price = 'Enter a valid price greater than 0';
    }

    if (formData.b2b_price && (isNaN(parseFloat(formData.b2b_price)) || parseFloat(formData.b2b_price) <= 0)) {
      newErrors.b2b_price = 'Enter a valid wholesale price';
    }

    if (formData.b2b_price && parseFloat(formData.b2b_price) >= parseFloat(formData.b2c_price)) {
      newErrors.b2b_price = 'Wholesale price must be less than retail price';
    }

    if (!formData.stock_quantity.trim()) {
      newErrors.stock_quantity = 'Stock quantity is required';
    } else if (isNaN(parseInt(formData.stock_quantity)) || parseInt(formData.stock_quantity) < 0) {
      newErrors.stock_quantity = 'Enter a valid stock quantity';
    }

    if (formData.moq && (isNaN(parseInt(formData.moq)) || parseInt(formData.moq) < 1)) {
      newErrors.moq = 'MOQ must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the highlighted fields before saving.');
      return;
    }

    setLoading(true);

    try {
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category_id: formData.category_id,
          b2c_price: parseFloat(formData.b2c_price),
          b2b_price: formData.b2b_price ? parseFloat(formData.b2b_price) : null,
          moq: formData.moq ? parseInt(formData.moq) : 1,
          stock_quantity: parseInt(formData.stock_quantity),
          sku: formData.sku.trim() || null,
        })
        .eq('id', id);

      if (productError) throw productError;

      if (formData.image_url.trim()) {
        const { data: existing } = await supabase
          .from('product_images')
          .select('id')
          .eq('product_id', id)
          .eq('is_primary', true)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('product_images')
            .update({ image_url: formData.image_url.trim() })
            .eq('id', existing.id);
        } else {
          await supabase.from('product_images').insert([{
            product_id: id,
            image_url: formData.image_url.trim(),
            is_primary: true,
            display_order: 1,
          }]);
        }
      }

      Alert.alert('Saved', 'Product updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="e.g. Premium Cotton T-Shirt"
                placeholderTextColor="#94A3B8"
                value={formData.name}
                onChangeText={(t) => updateField('name', t)}
              />
              {errors.name && <FieldError text={errors.name} />}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your product..."
                placeholderTextColor="#94A3B8"
                value={formData.description}
                onChangeText={(t) => updateField('description', t)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.selectBtn, errors.category_id && styles.inputError]}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={[styles.selectBtnText, !selectedCategory && styles.placeholderText]}>
                  {selectedCategory ? selectedCategory.name : 'Select a category'}
                </Text>
                {showCategoryPicker ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
              </TouchableOpacity>
              {errors.category_id && <FieldError text={errors.category_id} />}
              {showCategoryPicker && (
                <View style={styles.categoryDropdown}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryOption, formData.category_id === cat.id && styles.categoryOptionActive]}
                      onPress={() => { updateField('category_id', cat.id); setShowCategoryPicker(false); }}
                    >
                      <Text style={[styles.categoryOptionText, formData.category_id === cat.id && styles.categoryOptionTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Retail Price (USD) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.b2c_price && styles.inputError]}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  value={formData.b2c_price}
                  onChangeText={(t) => updateField('b2c_price', t)}
                  keyboardType="decimal-pad"
                />
                {errors.b2c_price && <FieldError text={errors.b2c_price} />}
              </View>
              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Wholesale Price</Text>
                <TextInput
                  style={[styles.input, errors.b2b_price && styles.inputError]}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  value={formData.b2b_price}
                  onChangeText={(t) => updateField('b2b_price', t)}
                  keyboardType="decimal-pad"
                />
                {errors.b2b_price && <FieldError text={errors.b2b_price} />}
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Minimum Order Qty (MOQ)</Text>
              <Text style={styles.labelSub}>Minimum units a wholesale customer must order</Text>
              <TextInput
                style={[styles.input, errors.moq && styles.inputError]}
                placeholder="1"
                placeholderTextColor="#94A3B8"
                value={formData.moq}
                onChangeText={(t) => updateField('moq', t)}
                keyboardType="number-pad"
              />
              {errors.moq && <FieldError text={errors.moq} />}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory</Text>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Stock Qty <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.stock_quantity && styles.inputError]}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={formData.stock_quantity}
                  onChangeText={(t) => updateField('stock_quantity', t)}
                  keyboardType="number-pad"
                />
                {errors.stock_quantity && <FieldError text={errors.stock_quantity} />}
              </View>
              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>SKU</Text>
                <TextInput
                  style={styles.input}
                  placeholder="SKU-001"
                  placeholderTextColor="#94A3B8"
                  value={formData.sku}
                  onChangeText={(t) => updateField('sku', t)}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Image</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Image URL</Text>
              <Text style={styles.labelSub}>Paste a public image link (Pexels, Unsplash, etc.)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor="#94A3B8"
                value={formData.image_url}
                onChangeText={(t) => updateField('image_url', t)}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Save size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function FieldError({ text }: { text: string }) {
  return (
    <View style={styles.fieldError}>
      <AlertCircle size={13} color="#EF4444" />
      <Text style={styles.fieldErrorText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748B' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { flex: 1 },
  form: { padding: 20 },
  section: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  fieldGroup: { marginBottom: 14 },
  row: { flexDirection: 'row' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  labelSub: { fontSize: 11, color: '#94A3B8', marginBottom: 6, marginTop: -4 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 13,
    fontSize: 14, color: '#111827',
  },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  textArea: { height: 90, textAlignVertical: 'top' },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 13,
  },
  selectBtnText: { fontSize: 14, color: '#111827', fontWeight: '500' },
  placeholderText: { color: '#94A3B8', fontWeight: '400' },
  categoryDropdown: {
    marginTop: 6, backgroundColor: '#FFF', borderRadius: 10,
    borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden',
  },
  categoryOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  categoryOptionActive: { backgroundColor: '#EFF6FF' },
  categoryOptionText: { fontSize: 14, color: '#374151' },
  categoryOptionTextActive: { color: '#1D4ED8', fontWeight: '700' },
  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  fieldErrorText: { fontSize: 12, color: '#EF4444', flex: 1 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1D4ED8', padding: 16, borderRadius: 14, gap: 8, marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
