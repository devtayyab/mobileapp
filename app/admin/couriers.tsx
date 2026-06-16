import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Truck, Search, Edit2, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

type Courier = {
  id: string;
  name: string;
  code: string;
  tracking_url_format: string;
  is_active: boolean;
};

export default function AdminCouriers() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('couriers').select('*').order('name');
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setCouriers(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (courier: Courier) => {
    setEditingCourier(courier);
    setFormName(courier.name);
    setFormCode(courier.code);
    setFormUrl(courier.tracking_url_format || '');
    setFormActive(courier.is_active);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingCourier(null);
    setFormName('');
    setFormCode('');
    setFormUrl('');
    setFormActive(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName || !formCode) {
      Alert.alert('Validation', 'Name and Code are required');
      return;
    }
    setSaving(true);
    const payload = {
      name: formName,
      code: formCode.toUpperCase(),
      tracking_url_format: formUrl,
      is_active: formActive,
    };

    if (editingCourier) {
      const { error } = await supabase.from('couriers').update(payload).eq('id', editingCourier.id);
      if (error) Alert.alert('Error', error.message);
      else {
        setModalVisible(false);
        fetchCouriers();
      }
    } else {
      const { error } = await supabase.from('couriers').insert([payload]);
      if (error) Alert.alert('Error', error.message);
      else {
        setModalVisible(false);
        fetchCouriers();
      }
    }
    setSaving(false);
  };

  const filteredCouriers = couriers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Couriers Management</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search couriers..."
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
          data={filteredCouriers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.countryCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  <Truck size={20} color={Colors.primary} />
                  <Text style={styles.countryName}>{item.name} ({item.code})</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.is_active ? Colors.background.tertiary : '#FEE2E2' }]}>
                  <Text style={[styles.statusText, { color: item.is_active ? Colors.success : Colors.error }]}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Tracking URL Format</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{item.tracking_url_format || 'Not Set'}</Text>
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
              <Text style={styles.modalTitle}>{editingCourier ? 'Edit Courier' : 'Add Courier'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Courier Name</Text>
            <TextInput style={styles.input} value={formName} onChangeText={setFormName} placeholder="e.g. DHL" />

            <Text style={styles.label}>Courier Code</Text>
            <TextInput style={styles.input} value={formCode} onChangeText={setFormCode} placeholder="e.g. DHL" autoCapitalize="characters" />

            <Text style={styles.label}>Tracking URL Format</Text>
            <Text style={{fontSize: 12, color: Colors.text.tertiary, marginBottom: 8}}>Use {'{tracking_number}'} as placeholder</Text>
            <TextInput style={styles.input} value={formUrl} onChangeText={setFormUrl} placeholder="e.g. https://dhl.com/track?id={tracking_number}" autoCapitalize="none" />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Is Active?</Text>
              <Switch value={formActive} onValueChange={setFormActive} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
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
  countryCard: {
    backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryName: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  infoCol: { gap: 4, flex: 1, paddingRight: 16 },
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
