import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView, Modal, Alert
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, Package, Clock, CheckCircle, XCircle, Truck, ChevronRight } from 'lucide-react-native';

type Order = {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total: number;
  currency: string;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  order_items: Array<{ product_name: string; quantity: number; unit_price: number; supplier_id: string }>;
};

const STATUS_COLORS: Record<string, string> = {
  delivered: '#10B981', shipped: '#3B82F6', processing: '#F59E0B',
  confirmed: '#8B5CF6', pending: '#6B7280', cancelled: '#EF4444', refunded: '#EF4444',
};

const STATUSES = ['all', 'pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select(`
        id, order_number, status, subtotal, total, currency, created_at,
        profiles!orders_user_id_fkey (full_name, email),
        order_items (product_name, quantity, unit_price, supplier_id)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setOrders((data as any) || []);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      fetchOrders();
      setSelectedOrder(null);
    } else {
      Alert.alert('Error', error.message);
    }
    setUpdating(false);
  };

  const filtered = orders.filter((o) => {
    const num = o.order_number?.toLowerCase() || '';
    const name = (o.profiles as any)?.full_name?.toLowerCase() || '';
    const email = (o.profiles as any)?.email?.toLowerCase() || '';
    const q = search.toLowerCase();
    return num.includes(q) || name.includes(q) || email.includes(q);
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={16} color={STATUS_COLORS.delivered} />;
      case 'shipped': return <Truck size={16} color={STATUS_COLORS.shipped} />;
      case 'processing': case 'confirmed': return <Package size={16} color={STATUS_COLORS.processing} />;
      case 'cancelled': case 'refunded': return <XCircle size={16} color={STATUS_COLORS.cancelled} />;
      default: return <Clock size={16} color={STATUS_COLORS.pending} />;
    }
  };

  const nextStatus: Record<string, string> = {
    pending: 'processing', processing: 'confirmed', confirmed: 'shipped', shipped: 'delivered',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Monitoring</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order # or customer..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterTab, statusFilter === s && styles.filterTabActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterTabText, statusFilter === s && styles.filterTabTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1E40AF" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders found</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedOrder(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderNum}>#{item.order_number}</Text>
                <View style={[styles.statusChip, { backgroundColor: (STATUS_COLORS[item.status] || '#6B7280') + '20' }]}>
                  {getStatusIcon(item.status)}
                  <Text style={[styles.statusChipText, { color: STATUS_COLORS[item.status] || '#6B7280' }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.customerName}>{(item.profiles as any)?.full_name || 'Unknown'}</Text>
              <Text style={styles.customerEmail}>{(item.profiles as any)?.email}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <Text style={styles.amount}>${item.total?.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!selectedOrder} animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <ArrowLeft size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Order #{selectedOrder.order_number}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Customer</Text>
                <Text style={styles.detailValue}>{(selectedOrder.profiles as any)?.full_name}</Text>
                <Text style={styles.detailSub}>{(selectedOrder.profiles as any)?.email}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Current Status</Text>
                <View style={[styles.statusChip, { backgroundColor: (STATUS_COLORS[selectedOrder.status] || '#6B7280') + '20', alignSelf: 'flex-start' }]}>
                  {getStatusIcon(selectedOrder.status)}
                  <Text style={[styles.statusChipText, { color: STATUS_COLORS[selectedOrder.status] || '#6B7280' }]}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Order Items ({selectedOrder.order_items?.length})</Text>
                {selectedOrder.order_items?.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemMeta}>{item.quantity}x ${item.unit_price?.toFixed(2)}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>${selectedOrder.total?.toFixed(2)}</Text>
                </View>
              </View>

              {nextStatus[selectedOrder.status] && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Update Status</Text>
                  <TouchableOpacity
                    style={styles.advanceBtn}
                    onPress={() => updateOrderStatus(selectedOrder.id, nextStatus[selectedOrder.status])}
                    disabled={updating}
                  >
                    {updating ? <ActivityIndicator color="#FFF" size="small" /> : <Truck size={18} color="#FFF" />}
                    <Text style={styles.advanceBtnText}>
                      Advance to "{nextStatus[selectedOrder.status].charAt(0).toUpperCase() + nextStatus[selectedOrder.status].slice(1)}"
                    </Text>
                  </TouchableOpacity>

                  {selectedOrder.status !== 'cancelled' && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      disabled={updating}
                    >
                      <XCircle size={18} color="#EF4444" />
                      <Text style={styles.cancelBtnText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', marginHorizontal: 20, marginVertical: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  filterRow: { maxHeight: 48 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterTabActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#FFF' },
  list: { padding: 20, gap: 12 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNum: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusChipText: { fontSize: 12, fontWeight: '700' },
  customerName: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 2 },
  customerEmail: { fontSize: 13, color: '#9CA3AF', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  date: { fontSize: 13, color: '#9CA3AF' },
  amount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalContent: { flex: 1, padding: 20 },
  detailSection: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  detailValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  detailSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  itemName: { fontSize: 14, color: '#374151', flex: 1 },
  itemMeta: { fontSize: 14, fontWeight: '600', color: '#111827' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  totalAmount: { fontSize: 16, fontWeight: '800', color: '#1E40AF' },
  advanceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1E40AF', borderRadius: 12, padding: 14, marginBottom: 10,
  },
  advanceBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#EF4444',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
