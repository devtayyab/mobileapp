import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Globe, Search, Edit2, CheckCircle2, DollarSign, X, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Palette } from '@/constants/Colors';

type Country = {
  id: string;
  name: string;
  code: string;
};

type ShippingRate = {
  id: string;
  country_id: string;
  shipping_charge: number;
  delivery_time_days: number | null;
  is_active: boolean;
};

type CombinedRate = Country & {
  rate_id?: string;
  shipping_charge?: number;
  delivery_time_days?: number | null;
  is_configured: boolean;
  is_active: boolean;
};

export default function SupplierShippingRates() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [rates, setRates] = useState<CombinedRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRate, setEditingRate] = useState<CombinedRate | null>(null);
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  // Form State
  const [formCharge, setFormCharge] = useState('');
  const [formDays, setFormDays] = useState('');
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get supplier profile
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user!.id)
        .single();
        
      if (!supplierData) {
        Alert.alert('Error', 'Supplier profile not found');
        return;
      }
      
      const suppId = supplierData.id;
      setSupplierId(suppId);

      // Get all active countries
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
      if (countriesError) throw countriesError;

      // Get supplier rates
      const { data: ratesData, error: ratesError } = await supabase
        .from('supplier_shipping_rates')
        .select('*')
        .eq('supplier_id', suppId);
        
      if (ratesError) throw ratesError;

      // Combine them
      const combined: CombinedRate[] = (countriesData || []).map((country) => {
        const existingRate = ratesData?.find(r => r.country_id === country.id);
        if (existingRate) {
          return {
            ...country,
            rate_id: existingRate.id,
            shipping_charge: existingRate.shipping_charge,
            delivery_time_days: existingRate.delivery_time_days,
            is_configured: true,
            is_active: existingRate.is_active,
          };
        }
        return {
          ...country,
          is_configured: false,
          is_active: false,
        };
      });

      setRates(combined);
    } catch (error: any) {
      Alert.alert('Error loading data', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rate: CombinedRate) => {
    setEditingRate(rate);
    setFormCharge(rate.shipping_charge !== undefined ? rate.shipping_charge.toString() : '');
    setFormDays(rate.delivery_time_days ? rate.delivery_time_days.toString() : '');
    setFormActive(rate.is_configured ? rate.is_active : true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingRate || !supplierId) return;
    
    if (formCharge === '') {
      Alert.alert('Validation', 'Shipping charge is required. Enter 0 for free shipping.');
      return;
    }
    
    setSaving(true);
    
    const payload = {
      supplier_id: supplierId,
      country_id: editingRate.id,
      shipping_charge: parseFloat(formCharge) || 0,
      delivery_time_days: formDays ? parseInt(formDays, 10) : null,
      is_active: formActive,
    };

    try {
      if (editingRate.rate_id) {
        // Update existing
        const { error } = await supabase
          .from('supplier_shipping_rates')
          .update(payload)
          .eq('id', editingRate.rate_id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('supplier_shipping_rates')
          .insert([payload]);
        if (error) throw error;
      }
      
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error saving rate', error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredRates = rates.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Rates</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.infoBanner}>
        <AlertCircle size={20} color={Colors.primary} />
        <Text style={styles.infoText}>Configure your shipping charges for each destination country to allow international buyers to place orders.</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search countries..."
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
          data={filteredRates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.rateCard, !item.is_configured && { opacity: 0.7 }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  <Globe size={20} color={item.is_configured ? Colors.primary : Colors.text.tertiary} />
                  <Text style={styles.countryName}>{item.name}</Text>
                </View>
                {item.is_configured && item.is_active ? (
                  <View style={styles.activeBadge}>
                    <CheckCircle2 size={12} color="#10B981" />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                ) : item.is_configured ? (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>Inactive</Text>
                  </View>
                ) : (
                  <View style={styles.unconfiguredBadge}>
                    <Text style={styles.unconfiguredText}>Not Set</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardBody}>
                {item.is_configured ? (
                  <>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Shipping Fee</Text>
                      <Text style={styles.infoValue}>${item.shipping_charge?.toFixed(2)}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Est. Delivery</Text>
                      <Text style={styles.infoValue}>{item.delivery_time_days ? `${item.delivery_time_days} days` : '--'}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.noRateText}>No shipping rate configured for this country.</Text>
                )}
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                  <Edit2 size={18} color={item.is_configured ? Colors.primary : Colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Rate: {editingRate?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Shipping Charge (USD)</Text>
            <View style={styles.inputWithIcon}>
              <DollarSign size={20} color={Colors.text.tertiary} />
              <TextInput 
                style={styles.flexInput} 
                value={formCharge} 
                onChangeText={setFormCharge} 
                keyboardType="decimal-pad" 
                placeholder="0.00" 
              />
            </View>
            <Text style={styles.helpText}>Enter 0 for free shipping</Text>

            <Text style={styles.label}>Est. Delivery Time (Days)</Text>
            <TextInput 
              style={styles.input} 
              value={formDays} 
              onChangeText={setFormDays} 
              keyboardType="number-pad" 
              placeholder="e.g. 7" 
            />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.label}>Enable Shipping</Text>
                <Text style={styles.switchHelp}>Allow buyers from this country</Text>
              </View>
              <Switch value={formActive} onValueChange={setFormActive} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Rate</Text>}
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
  headerRight: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    backgroundColor: Colors.background.tertiary, borderBottomWidth: 1, borderBottomColor: Colors.border.medium,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.text.secondary, lineHeight: 18 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.secondary,
    margin: 16, paddingHorizontal: 16, borderRadius: 12, height: 48,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text.primary },
  listContainer: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  rateCard: {
    backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryName: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  inactiveBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  inactiveText: { fontSize: 11, fontWeight: '700', color: '#991B1B' },
  unconfiguredBadge: { backgroundColor: Colors.background.tertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  unconfiguredText: { fontSize: 11, fontWeight: '700', color: Colors.text.tertiary },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  infoCol: { gap: 4, flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.text.tertiary },
  infoValue: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  noRateText: { flex: 1, fontSize: 13, color: Colors.text.tertiary, fontStyle: 'italic', paddingRight: 16 },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background.tertiary, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, marginBottom: 8, marginTop: 16 },
  helpText: { fontSize: 12, color: Colors.text.tertiary, marginTop: 4 },
  input: {
    backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.medium,
    borderRadius: 12, height: 48, paddingHorizontal: 16, fontSize: 16, color: Colors.text.primary,
  },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.border.medium, borderRadius: 12, height: 48, paddingHorizontal: 16, gap: 8,
  },
  flexInput: { flex: 1, fontSize: 16, color: Colors.text.primary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  switchHelp: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.primary, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 20,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
