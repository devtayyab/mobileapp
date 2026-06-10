import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, AlertCircle, ChevronDown, ChevronUp, UploadCloud } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

type Category = {
  id: string;
  name: string;
};

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
  shipping_cost: string;
};

export default function AddProductScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    shipping_cost: '0',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    loadInitialData();
  }, [user?.id]);

  const loadInitialData = async () => {
    if (!user?.id) {
      setInitializing(false);
      return;
    }
    setInitializing(true);

    let { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!supplier) {
      const businessName = profile?.company_name || profile?.full_name || profile?.email?.split('@')[0] || 'My Business';
      const { data: newSupplier, error: createError } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          business_name: businessName,
          kyc_status: 'pending',
          is_active: true,
          commission_rate: 10,
        })
        .select('id')
        .single();

      if (createError) {
        setSupplierError('Could not initialize supplier profile. Please try again.');
        setInitializing(false);
        return;
      }
      supplier = newSupplier;
    }

    setSupplierId(supplier.id);

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('name');

    if (categoriesData) setCategories(categoriesData);
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

    if (formData.shipping_cost && (isNaN(parseFloat(formData.shipping_cost)) || parseFloat(formData.shipping_cost) < 0)) {
      newErrors.shipping_cost = 'Enter a valid shipping cost';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the highlighted fields before submitting.');
      return;
    }

    if (!supplierId) {
      Alert.alert('Error', 'Supplier profile not ready. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const slug = formData.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

      const productData = {
        supplier_id: supplierId,
        name: formData.name.trim(),
        slug,
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        b2c_price: parseFloat(formData.b2c_price),
        b2b_price: formData.b2b_price ? parseFloat(formData.b2b_price) : null,
        moq: formData.moq ? parseInt(formData.moq) : 1,
        stock_quantity: parseInt(formData.stock_quantity),
        sku: formData.sku.trim() || null,
        currency: 'USD',
        shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : 0,
        is_active: true,
        is_featured: false,
      };

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (productError) throw productError;

      if (product && formData.image_url.trim()) {
        await supabase.from('product_images').insert([{
          product_id: product.id,
          image_url: formData.image_url.trim(),
          is_primary: true,
          display_order: 1,
        }]);
      }

      Alert.alert('Product Added', 'Your product has been listed successfully.', [
        { text: 'Add Another', onPress: () => {
          setFormData({ name: '', description: '', category_id: '', b2c_price: '', b2b_price: '', moq: '1', stock_quantity: '', sku: '', image_url: '', shipping_cost: '0' });
          setErrors({});
        }},
        { text: 'Done', onPress: () => router.canGoBack() ? router.back() : router.replace('/supplier/dashboard') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        uploadImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string, base64Data?: string | null) => {
    setUploadingImage(true);
    try {
      if (!base64Data) {
        throw new Error('Image data is missing. Please try again.');
      }
      
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, decode(base64Data), {
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      updateField('image_url', publicUrl);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Could not upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Setting up supplier profile...</Text>
      </View>
    );
  }

  if (supplierError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/supplier/dashboard')} style={styles.backBtn}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Product</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Setup Failed</Text>
          <Text style={styles.errorSub}>{supplierError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadInitialData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/supplier/dashboard')} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
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

            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
              <Text style={styles.label}>Shipping Cost (USD)</Text>
              <Text style={styles.labelSub}>Flat shipping fee for this product</Text>
              <TextInput
                style={[styles.input, errors.shipping_cost && styles.inputError]}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                value={formData.shipping_cost}
                onChangeText={(t) => updateField('shipping_cost', t)}
                keyboardType="decimal-pad"
              />
              {errors.shipping_cost && <FieldError text={errors.shipping_cost} />}
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
              <Text style={styles.label}>Product Image</Text>
              
              <TouchableOpacity 
                style={[styles.uploadBtn, uploadingImage && styles.submitBtnDisabled]} 
                onPress={pickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color="#1D4ED8" size="small" />
                ) : (
                  <>
                    <UploadCloud size={20} color="#1D4ED8" />
                    <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

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
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Plus size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>Add Product</Text>
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
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <View style={styles.fieldError}>
      <AlertCircle size={13} color="#EF4444" />
      <Text style={styles.fieldErrorText}>{text}</Text>
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748B' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: Colors.background.secondary, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.background.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  errorSub: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  retryBtn: { backgroundColor: '#1D4ED8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  content: { flex: 1 },
  form: { padding: 20 },
  section: {
    backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  fieldGroup: { marginBottom: 14 },
  row: { flexDirection: 'row' },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 },
  labelSub: { fontSize: 11, color: Colors.text.tertiary, marginBottom: 6, marginTop: -4 },
  required: { color: Colors.error },
  input: {
    backgroundColor: Colors.background.primary, borderWidth: 1.5, borderColor: Colors.border.medium,
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 13,
    fontSize: 14, color: Colors.text.primary,
  },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  textArea: { height: 90, textAlignVertical: 'top' },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.background.primary, borderWidth: 1.5, borderColor: Colors.border.medium,
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 13,
  },
  selectBtnText: { fontSize: 14, color: Colors.text.primary, fontWeight: '500' },
  placeholderText: { color: Colors.text.tertiary, fontWeight: '400' },
  categoryDropdown: {
    marginTop: 6, backgroundColor: Colors.background.secondary, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border.medium, overflow: 'hidden',
  },
  categoryOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  categoryOptionActive: { backgroundColor: '#EFF6FF' },
  categoryOptionText: { fontSize: 14, color: Colors.text.primary },
  categoryOptionTextActive: { color: '#1D4ED8', fontWeight: '700' },
  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  fieldErrorText: { fontSize: 12, color: Colors.error, flex: 1 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1D4ED8', padding: 16, borderRadius: 14, gap: 8, marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EFF6FF', padding: 14, borderRadius: 10, gap: 8,
    borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed',
    marginBottom: 8,
  },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: '#1D4ED8' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 10, fontSize: 12, color: '#94A3B8', fontWeight: '600' },
});
