import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, AlertCircle, ChevronDown, ChevronUp, UploadCloud, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

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
  shipping_cost: string;
};

export default function EditProductScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

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
    loadData();
  }, [id]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Validation', 'Category name is required');
      return;
    }
    setAddingCategory(true);
    const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
    const { data, error } = await supabase.from('categories').insert([{
      name: newCategoryName.trim(),
      slug: slug,
      is_active: true,
      display_order: 0
    }]).select().single();

    if (error) {
      Alert.alert('Error', error.message || 'Could not create category');
    } else if (data) {
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      updateField('category_id', data.id);
      setShowAddCategoryModal(false);
      setNewCategoryName('');
    }
    setAddingCategory(false);
  };

  const loadData = async () => {
    if (!id) return;
    setInitializing(true);

    const [productResult, categoriesResult] = await Promise.all([
      supabase
        .from('products')
        .select(`
          id, name, description, category_id, b2c_price, b2b_price,
          moq, stock_quantity, sku, currency, is_active, shipping_cost,
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
        shipping_cost: p.shipping_cost?.toString() || '0',
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

    if (formData.shipping_cost && (isNaN(parseFloat(formData.shipping_cost)) || parseFloat(formData.shipping_cost) < 0)) {
      newErrors.shipping_cost = 'Enter a valid shipping cost';
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
          shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : 0,
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
        { text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/supplier/products') },
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
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
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/supplier/products')} style={styles.backBtn}>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                <Text style={[styles.label, { marginBottom: 0 }]}>Category <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity onPress={() => setShowAddCategoryModal(true)}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1D4ED8' }}>+ Add New</Text>
                </TouchableOpacity>
              </View>
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
              <Text style={{ textAlign: 'center', fontSize: 12, color: '#64748B', marginTop: -2, marginBottom: 8 }}>Recommended size: 800x800px (1:1 Ratio)</Text>
              
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

      {/* Add Category Modal */}
      <Modal visible={showAddCategoryModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity onPress={() => setShowAddCategoryModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Category Name</Text>
            <TextInput 
              style={styles.input} 
              value={newCategoryName} 
              onChangeText={setNewCategoryName} 
              placeholder="e.g. Electronics" 
            />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddCategory} disabled={addingCategory}>
              {addingCategory ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSaveBtnText}>Save Category</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  modalSaveBtn: { backgroundColor: '#1D4ED8', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  modalSaveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
