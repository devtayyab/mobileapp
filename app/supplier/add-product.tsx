import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus } from 'lucide-react-native';

type Category = {
  id: string;
  name: string;
};

export default function AddProductScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    b2c_price: '',
    b2b_price: '',
    stock_quantity: '',
    sku: '',
    image_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (supplier) {
      setSupplierId(supplier.id);
    }

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('name');

    if (categoriesData) {
      setCategories(categoriesData);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }

    if (!formData.b2c_price || isNaN(parseFloat(formData.b2c_price))) {
      newErrors.b2c_price = 'Valid price is required';
    }

    if (!formData.stock_quantity || isNaN(parseInt(formData.stock_quantity))) {
      newErrors.stock_quantity = 'Valid stock quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !supplierId) {
      return;
    }

    setLoading(true);

    try {
      const productData = {
        supplier_id: supplierId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        b2c_price: parseFloat(formData.b2c_price),
        b2b_price: formData.b2b_price ? parseFloat(formData.b2b_price) : null,
        stock_quantity: parseInt(formData.stock_quantity),
        sku: formData.sku.trim() || null,
        currency: 'USD',
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
        await supabase
          .from('product_images')
          .insert([{
            product_id: product.id,
            image_url: formData.image_url.trim(),
            is_primary: true,
            display_order: 1,
          }]);
      }

      Alert.alert('Success', 'Product added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter product name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter product description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    formData.category_id === category.id && styles.categoryChipActive
                  ]}
                  onPress={() => setFormData({ ...formData, category_id: category.id })}
                >
                  <Text style={[
                    styles.categoryChipText,
                    formData.category_id === category.id && styles.categoryChipTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category_id && <Text style={styles.errorText}>{errors.category_id}</Text>}
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Retail Price (USD) *</Text>
              <TextInput
                style={[styles.input, errors.b2c_price && styles.inputError]}
                placeholder="0.00"
                value={formData.b2c_price}
                onChangeText={(text) => setFormData({ ...formData, b2c_price: text })}
                keyboardType="decimal-pad"
              />
              {errors.b2c_price && <Text style={styles.errorText}>{errors.b2c_price}</Text>}
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Wholesale Price (USD)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={formData.b2b_price}
                onChangeText={(text) => setFormData({ ...formData, b2b_price: text })}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Stock Quantity *</Text>
              <TextInput
                style={[styles.input, errors.stock_quantity && styles.inputError]}
                placeholder="0"
                value={formData.stock_quantity}
                onChangeText={(text) => setFormData({ ...formData, stock_quantity: text })}
                keyboardType="number-pad"
              />
              {errors.stock_quantity && <Text style={styles.errorText}>{errors.stock_quantity}</Text>}
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>SKU</Text>
              <TextInput
                style={styles.input}
                placeholder="SKU-001"
                value={formData.sku}
                onChangeText={(text) => setFormData({ ...formData, sku: text })}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChangeText={(text) => setFormData({ ...formData, image_url: text })}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Plus size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>Add Product</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
