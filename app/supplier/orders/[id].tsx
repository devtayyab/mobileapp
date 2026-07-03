import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Truck, MapPin, Globe, Receipt, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Palette } from '@/constants/Colors';

type Courier = { id: string; name: string; code: string };

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  in_transit: '#06B6D4',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

export default function SupplierOrderDetail() {
  const { id: orderId } = useLocalSearchParams();
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [shippingCountry, setShippingCountry] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id && orderId) {
      loadData();
    }
  }, [user?.id, orderId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!supplier) throw new Error('Supplier not found');

      // Load Order & Items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*, orders(*, countries(name))')
        .eq('order_id', orderId)
        .eq('supplier_id', supplier.id);

      if (itemsError) throw itemsError;
      if (!orderItems || orderItems.length === 0) throw new Error('No items found');

      setItems(orderItems);
      const orderData = orderItems[0].orders;
      setOrder(orderData);

      // Extract shipping country name
      if (orderData?.countries?.name) {
        setShippingCountry(orderData.countries.name);
      } else if (orderData?.shipping_address?.country) {
        setShippingCountry(orderData.shipping_address.country);
      }

      // Load Shipment if exists
      const { data: shipmentData } = await supabase
        .from('shipments')
        .select('*, couriers(name, code, tracking_url_format)')
        .eq('order_id', orderId)
        .eq('supplier_id', supplier.id)
        .maybeSingle();

      setShipment(shipmentData);

      // Load Couriers
      const { data: couriersData } = await supabase.from('couriers').select('*').eq('is_active', true);
      if (couriersData) setCouriers(couriersData);

    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!selectedCourierId || !trackingNumber) {
      Alert.alert('Validation', 'Please select a courier and enter a tracking number.');
      return;
    }

    setSaving(true);
    try {
      const { data: supplier, error: supplierError } = await supabase.from('suppliers').select('id').eq('user_id', user!.id).single();
      if (supplierError) throw supplierError;
      
      const payload = {
        order_id: orderId,
        supplier_id: supplier!.id,
        courier_id: selectedCourierId,
        tracking_number: trackingNumber,
        status: 'in_transit', // 'shipped' is not in shipment_status enum
        shipped_at: new Date().toISOString()
      };

      if (shipment?.id) {
        const { error } = await supabase.from('shipments').update(payload).eq('id', shipment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('shipments').insert([payload]);
        if (error) throw error;
      }

      // Also update order status if it's currently processing/pending
      if (order.status === 'processing' || order.status === 'pending') {
        const { error } = await supabase.rpc('update_order_status_from_shipment', {
          p_order_id: orderId,
          p_status: 'shipped'
        });
        if (error) {
          console.warn('Order status update failed:', error.message);
        }
      }

      setModalVisible(false);
      await loadData(); // Await loadData to ensure UI is updated before showing success (optional but good practice)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred while saving.');
      console.error("Save Tracking Error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const payoutAmount = items.reduce((sum, item) => sum + Number(item.supplier_amount), 0);
  const statusColor = STATUS_COLORS[order.status] || Colors.text.tertiary;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>

        {/* Order Header Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderNumber}>#{order.order_number}</Text>
              <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{order.status.toUpperCase()}</Text>
            </View>
          </View>

          {/* Destination Country */}
          {shippingCountry && (
            <View style={styles.countryChip}>
              <Globe size={14} color={Colors.primary} />
              <Text style={styles.countryChipText}>Destination: {shippingCountry}</Text>
            </View>
          )}
        </View>

        {/* Shipment Tracking */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Truck size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Shipment & Tracking</Text>
          </View>
          
          {shipment ? (
            <View style={styles.shipmentDetails}>
              <View style={styles.shipmentCourierRow}>
                <View style={styles.courierBadge}>
                  <Text style={styles.courierBadgeText}>{shipment.couriers?.name || shipment.carrier || 'Courier'}</Text>
                </View>
                <View style={[styles.shipmentStatusChip, { backgroundColor: (STATUS_COLORS[shipment.status] || Colors.primary) + '20' }]}>
                  <Text style={[styles.shipmentStatusText, { color: STATUS_COLORS[shipment.status] || Colors.primary }]}>
                    {shipment.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.trackingBox}>
                <Text style={styles.trackingLabel}>Tracking Number</Text>
                <Text style={styles.trackingNumber}>{shipment.tracking_number}</Text>
              </View>

              <TouchableOpacity style={styles.updateBtn} onPress={() => {
                setSelectedCourierId(shipment.courier_id || '');
                setTrackingNumber(shipment.tracking_number || '');
                setModalVisible(true);
              }}>
                <Text style={styles.updateBtnText}>Update Tracking</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noShipment}>
              <Truck size={32} color={Colors.border.dark} />
              <Text style={styles.noShipmentText}>No tracking info yet</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.createBtnText}>+ Add Tracking Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Shipping Address */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <MapPin size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText}>
            {[order.shipping_address?.street, order.shipping_address?.city,
              order.shipping_address?.state, order.shipping_address?.zipCode,
              order.shipping_address?.country].filter(Boolean).join(', ')}
          </Text>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Package size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Items Ordered</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.quantity}x {item.product_name}</Text>
              </View>
              <Text style={styles.itemPrice}>${(item.unit_price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Financial Summary */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Receipt size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Order Financial Summary</Text>
          </View>

          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Subtotal</Text>
            <Text style={styles.finValue}>{order.currency || 'USD'} {Number(order.subtotal || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Shipping Fee</Text>
            <Text style={styles.finValue}>{order.currency || 'USD'} {Number(order.shipping_fee || 0).toFixed(2)}</Text>
          </View>
          {Number(order.vat_amount) > 0 && (
            <View style={styles.finRow}>
              <Text style={styles.finLabel}>VAT / Tax</Text>
              <Text style={styles.finValue}>{order.currency || 'USD'} {Number(order.vat_amount).toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.finDivider} />
          <View style={styles.finRow}>
            <Text style={styles.finLabelBold}>Order Total</Text>
            <Text style={styles.finValueBold}>{order.currency || 'USD'} {Number(order.total || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.finDivider} />
          <View style={styles.finRow}>
            <Text style={styles.finLabelPayout}>Your Payout</Text>
            <Text style={styles.finValuePayout}>{order.currency || 'USD'} {payoutAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Shipment Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add / Update Tracking</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Courier Company</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courierList}>
              {couriers.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.courierChip, selectedCourierId === c.id && styles.courierChipActive]}
                  onPress={() => setSelectedCourierId(c.id)}
                >
                  <Text style={[styles.courierChipText, selectedCourierId === c.id && styles.courierChipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {!selectedCourierId && (
              <Text style={styles.helpText}>Select a courier from the list above</Text>
            )}

            <Text style={styles.label}>Tracking Number</Text>
            <TextInput 
              style={styles.input}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="e.g. 1234567890"
              placeholderTextColor={Colors.text.tertiary}
              autoCapitalize="characters"
            />

            <TouchableOpacity style={[styles.saveBtn, (!selectedCourierId || !trackingNumber) && { opacity: 0.5 }]} onPress={handleCreateShipment} disabled={saving || !selectedCourierId || !trackingNumber}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Tracking Info</Text>}
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
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 12 },
  card: { backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border.medium },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orderNumber: { fontSize: 18, fontWeight: '800', color: Colors.text.primary, marginBottom: 4 },
  orderDate: { fontSize: 13, color: Colors.text.tertiary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '800' },
  countryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.background.tertiary, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  countryChipText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  shipmentDetails: { gap: 12 },
  shipmentCourierRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  courierBadge: { backgroundColor: Colors.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  courierBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  shipmentStatusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  shipmentStatusText: { fontSize: 11, fontWeight: '800' },
  trackingBox: { backgroundColor: Colors.background.tertiary, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border.medium },
  trackingLabel: { fontSize: 11, fontWeight: '600', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  trackingNumber: { fontSize: 16, fontWeight: '800', color: Colors.text.primary, letterSpacing: 1 },
  updateBtn: { marginTop: 12, backgroundColor: Colors.background.tertiary, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.medium },
  updateBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  noShipment: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  noShipmentText: { color: Colors.text.tertiary, fontSize: 14 },
  createBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  addressText: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.text.primary },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  finLabel: { fontSize: 14, color: Colors.text.tertiary },
  finValue: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  finLabelBold: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  finValueBold: { fontSize: 16, fontWeight: '800', color: Colors.text.primary },
  finLabelPayout: { fontSize: 15, fontWeight: '700', color: Colors.success },
  finValuePayout: { fontSize: 18, fontWeight: '800', color: Colors.success },
  finDivider: { height: 1, backgroundColor: Colors.border.medium, marginVertical: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, marginBottom: 8, marginTop: 16 },
  helpText: { fontSize: 12, color: Colors.text.tertiary, marginTop: 4 },
  input: { backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.medium, borderRadius: 12, height: 48, paddingHorizontal: 16, fontSize: 16, color: Colors.text.primary },
  courierList: { flexDirection: 'row', marginBottom: 4, maxHeight: 44 },
  courierChip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.background.secondary, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: Colors.border.medium },
  courierChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  courierChipText: { color: Colors.text.primary, fontWeight: '600' },
  courierChipTextActive: { color: '#FFF' },
  saveBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 28, marginBottom: 8 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
