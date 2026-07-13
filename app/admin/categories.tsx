import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, FolderTree, Search, Edit2, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  display_order: number;
};

export default function AdminCategories() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('display_order');
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormDescription(category.description || '');
    setFormOrder((category.display_order || 0).toString());
    setFormActive(category.is_active !== false); // default to true if null
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormOrder('0');
    setFormActive(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName || !formSlug) {
      Alert.alert('Validation', 'Name and Slug are required');
      return;
    }
    setSaving(true);
    const payload = {
      name: formName,
      slug: formSlug.toLowerCase().replace(/\s+/g, '-'),
      description: formDescription,
      display_order: parseInt(formOrder, 10) || 0,
      is_active: formActive,
    };

    if (editingCategory) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id);
      if (error) Alert.alert('Error', error.message);
      else {
        setModalVisible(false);
        fetchCategories();
      }
    } else {
      const { error } = await supabase.from('categories').insert([payload]);
      if (error) Alert.alert('Error', error.message);
      else {
        setModalVisible(false);
        fetchCategories();
      }
    }
    setSaving(false);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor={Colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.categoryCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  <FolderTree size={20} color={Colors.primary} />
                  <Text style={styles.categoryName}>{item.name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.is_active ? Colors.background.tertiary : '#FEE2E2' }]}>
                  <Text style={[styles.statusText, { color: item.is_active ? Colors.success : Colors.error }]}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Slug</Text>
                  <Text style={styles.infoValue}>{item.slug}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Order</Text>
                  <Text style={styles.infoValue}>{item.display_order}</Text>
                </View>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                  <Edit2 size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Edit/Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Category Name</Text>
            <TextInput 
              style={styles.input} 
              value={formName} 
              onChangeText={(val) => {
                setFormName(val);
                if (!editingCategory) setFormSlug(val.toLowerCase().replace(/\s+/g, '-'));
              }} 
              placeholder="e.g. Electronics" 
            />

            <Text style={styles.label}>Slug (URL-friendly name)</Text>
            <TextInput style={styles.input} value={formSlug} onChangeText={setFormSlug} placeholder="e.g. electronics" autoCapitalize="none" />

            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} value={formDescription} onChangeText={setFormDescription} placeholder="Optional description" />

            <Text style={styles.label}>Display Order</Text>
            <TextInput style={styles.input} value={formOrder} onChangeText={setFormOrder} keyboardType="numeric" placeholder="e.g. 1" />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Is Active?</Text>
              <Switch value={formActive} onValueChange={setFormActive} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Category</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1, borderBottomColor: Colors.border.medium,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.secondary,
    margin: 16, paddingHorizontal: 16, borderRadius: 12, height: 48,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text.primary },
  listContainer: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  categoryCard: {
    backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryName: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  infoCol: { gap: 4 },
  infoLabel: { fontSize: 12, color: Colors.text.tertiary },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background.tertiary, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.medium,
    borderRadius: 12, height: 48, paddingHorizontal: 16, fontSize: 16, color: Colors.text.primary,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  saveBtn: {
    backgroundColor: Colors.primary, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 20,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
