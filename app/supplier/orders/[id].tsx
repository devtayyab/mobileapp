import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Truck, Calendar, MapPin, DollarSign, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Palette } from '@/constants/Colors';

type Courier = { id: string; name: string; code: string };

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
        .select('*, orders(*)')
        .eq('order_id', orderId)
        .eq('supplier_id', supplier.id);

      if (itemsError) throw itemsError;
      if (!orderItems || orderItems.length === 0) throw new Error('No items found');

      setItems(orderItems);
      setOrder(orderItems[0].orders);

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
      const { data: supplier } = await supabase.from('suppliers').select('id').eq('user_id', user!.id).single();
      
      const payload = {
        order_id: orderId,
        supplier_id: supplier!.id,
        courier_id: selectedCourierId,
        tracking_number: trackingNumber,
        status: 'shipped',
        shipped_at: new Date().toISOString()
      };

      if (shipment?.id) {
        await supabase.from('shipments').update(payload).eq('id', shipment.id);
      } else {
        await supabase.from('shipments').insert([payload]);
      }

      // Also update order status if it's currently processing/pending
      if (order.status === 'processing' || order.status === 'pending') {
        await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const totalAmount = items.reduce((sum, item) => sum + Number(item.supplier_amount), 0);

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
        {/* Order Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.orderNumber}>#{order.order_number}</Text>
              <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Shipment Tracking */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}><Truck size={18} color={Colors.primary} /> Shipment Tracking</Text>
          
          {shipment ? (
            <View style={styles.shipmentDetails}>
              <View style={styles.shipmentRow}>
                <Text style={styles.shipmentLabel}>Courier</Text>
                <Text style={styles.shipmentValue}>{shipment.couriers?.name || shipment.carrier || 'N/A'}</Text>
              </View>
              <View style={styles.shipmentRow}>
                <Text style={styles.shipmentLabel}>Tracking Number</Text>
                <Text style={styles.shipmentValue}>{shipment.tracking_number}</Text>
              </View>
              <View style={styles.shipmentRow}>
                <Text style={styles.shipmentLabel}>Status</Text>
                <Text style={styles.shipmentValue}>{shipment.status.toUpperCase()}</Text>
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
              <Text style={styles.noShipmentText}>No tracking information yet.</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.createBtnText}>Add Tracking Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Shipping Address */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}><MapPin size={18} color={Colors.primary} /> Shipping Address</Text>
          <Text style={styles.addressName}>{order.shipping_address?.fullName}</Text>
          <Text style={styles.addressText}>{order.shipping_address?.addressLine1}</Text>
          {order.shipping_address?.addressLine2 && <Text style={styles.addressText}>{order.shipping_address?.addressLine2}</Text>}
          <Text style={styles.addressText}>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zipCode}</Text>
          <Text style={styles.addressText}>{order.shipping_address?.phone}</Text>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}><Package size={18} color={Colors.primary} /> Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.quantity}x {item.product_name}</Text>
                <Text style={styles.itemSku}>SKU: {item.product_sku}</Text>
              </View>
              <Text style={styles.itemPrice}>${item.supplier_amount.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Your Payout Amount</Text>
            <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Shipment Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shipment Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <CheckCircle2 size={24} color={Colors.text.tertiary} />
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

            <Text style={styles.label}>Tracking Number</Text>
            <TextInput 
              style={styles.input}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="e.g. 1Z9999999999999999"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateShipment} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Tracking</Text>}
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
  contentContainer: { padding: 16, gap: 16 },
  card: { backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border.medium },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNumber: { fontSize: 18, fontWeight: '800', color: Colors.text.primary, marginBottom: 4 },
  orderDate: { fontSize: 13, color: Colors.text.tertiary },
  statusBadge: { backgroundColor: Colors.background.tertiary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  shipmentDetails: { gap: 12 },
  shipmentRow: { flexDirection: 'row', justifyContent: 'space-between' },
  shipmentLabel: { fontSize: 14, color: Colors.text.tertiary },
  shipmentValue: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  updateBtn: { marginTop: 16, backgroundColor: Colors.background.tertiary, padding: 12, borderRadius: 8, alignItems: 'center' },
  updateBtnText: { color: Colors.primary, fontWeight: '600' },
  noShipment: { alignItems: 'center', paddingVertical: 12 },
  noShipmentText: { color: Colors.text.tertiary, marginBottom: 12 },
  createBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  createBtnText: { color: '#FFF', fontWeight: '600' },
  addressName: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, marginBottom: 4 },
  addressText: { fontSize: 14, color: Colors.text.secondary, marginBottom: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.medium },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  itemSku: { fontSize: 12, color: Colors.text.tertiary, marginTop: 4 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  totalValue: { fontSize: 20, fontWeight: '800', color: Colors.success },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.medium, borderRadius: 12, height: 48, paddingHorizontal: 16, fontSize: 16 },
  courierList: { flexDirection: 'row', marginBottom: 8, maxHeight: 44 },
  courierChip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.background.secondary, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: Colors.border.medium },
  courierChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  courierChipText: { color: Colors.text.primary, fontWeight: '600' },
  courierChipTextActive: { color: '#FFF' },
  saveBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 20 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
