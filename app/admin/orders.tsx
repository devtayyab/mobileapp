import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView, Modal, Alert, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Search, Package, Clock, CheckCircle, XCircle,
  Truck, User, DollarSign, Calendar, ChevronRight, RefreshCw
} from 'lucide-react-native';

type Order = {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total: number;
  platform_commission: number;
  currency: string;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  order_items: Array<{ product_name: string; quantity: number; unit_price: number }>;
};

const STATUS_COLORS: Record<string, string> = {
  delivered: '#059669', shipped: '#2563EB', processing: '#D97706',
  confirmed: '#7C3AED', pending: '#6B7280', cancelled: '#DC2626', refunded: '#DC2626',
};

const STATUS_BG: Record<string, string> = {
  delivered: '#ECFDF5', shipped: '#EFF6FF', processing: '#FFFBEB',
  confirmed: '#F5F3FF', pending: '#F9FAFB', cancelled: '#FEF2F2', refunded: '#FEF2F2',
};

const STATUSES = ['all', 'pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const nextStatus: Record<string, string> = {
  pending: 'processing', processing: 'confirmed', confirmed: 'shipped', shipped: 'delivered',
};

export default function AdminOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select(`
        id, order_number, status, subtotal, total, platform_commission, currency, created_at,
        profiles!orders_user_id_fkey (full_name, email),
        order_items (product_name, quantity, unit_price)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);

    const { data } = await query;
    setOrders((data as any) || []);
    setLoading(false);
    setRefreshing(false);
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

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
    const q = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      (o.profiles as any)?.full_name?.toLowerCase().includes(q) ||
      (o.profiles as any)?.email?.toLowerCase().includes(q)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={14} color={STATUS_COLORS.delivered} />;
      case 'shipped': return <Truck size={14} color={STATUS_COLORS.shipped} />;
      case 'processing': case 'confirmed': return <Package size={14} color={STATUS_COLORS.processing} />;
      case 'cancelled': case 'refunded': return <XCircle size={14} color={STATUS_COLORS.cancelled} />;
      default: return <Clock size={14} color={STATUS_COLORS.pending} />;
    }
  };

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Monitoring</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order # or customer..."
          placeholderTextColor="#9CA3AF"
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
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
            {statusCounts[s] > 0 && (
              <View style={[styles.tabCount, statusFilter === s && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, statusFilter === s && styles.tabCountTextActive]}>{statusCounts[s]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#1E40AF" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedOrder(item)} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <View style={styles.orderNumRow}>
                  <Text style={styles.orderNum}>#{item.order_number}</Text>
                  <View style={[styles.statusChip, { backgroundColor: STATUS_BG[item.status] || '#F9FAFB' }]}>
                    {getStatusIcon(item.status)}
                    <Text style={[styles.statusChipText, { color: STATUS_COLORS[item.status] || '#6B7280' }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.customerRow}>
                <User size={13} color="#9CA3AF" />
                <Text style={styles.customerName}>{(item.profiles as any)?.full_name || 'Unknown Customer'}</Text>
              </View>
              <Text style={styles.customerEmail}>{(item.profiles as any)?.email}</Text>

              <View style={styles.cardFooter}>
                <View style={styles.dateRow}>
                  <Calendar size={12} color="#9CA3AF" />
                  <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.itemCount}>{item.order_items?.length || 0} items</Text>
                  <Text style={styles.amount}>${item.total?.toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!selectedOrder} animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.backBtn}>
                <ArrowLeft size={22} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Order #{selectedOrder.order_number}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.orderHero}>
                <View style={[styles.heroStatusChip, { backgroundColor: STATUS_BG[selectedOrder.status] }]}>
                  {getStatusIcon(selectedOrder.status)}
                  <Text style={[styles.heroStatusText, { color: STATUS_COLORS[selectedOrder.status] }]}>
                    {selectedOrder.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.heroOrderNum}>Order #{selectedOrder.order_number}</Text>
                <Text style={styles.heroDate}>{new Date(selectedOrder.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Customer</Text>
                <View style={styles.customerInfo}>
                  <View style={styles.customerAvatar}>
                    <User size={18} color="#6B7280" />
                  </View>
                  <View>
                    <Text style={styles.customerFullName}>{(selectedOrder.profiles as any)?.full_name || 'Unknown'}</Text>
                    <Text style={styles.customerInfoEmail}>{(selectedOrder.profiles as any)?.email}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Items</Text>
                {selectedOrder.order_items?.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemIconWrap}>
                      <Package size={14} color="#6B7280" />
                    </View>
                    <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                    <Text style={styles.itemPrice}>${(item.unit_price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={styles.totalSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalAmount}>${selectedOrder.subtotal?.toFixed(2)}</Text>
                  </View>
                  {selectedOrder.platform_commission > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Platform Commission</Text>
                      <Text style={[styles.totalAmount, { color: '#059669' }]}>${selectedOrder.platform_commission?.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={[styles.totalRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>Total</Text>
                    <Text style={styles.grandTotalValue}>${selectedOrder.total?.toFixed(2)}</Text>
                  </View>
                </View>
              </View>

              {(nextStatus[selectedOrder.status] || selectedOrder.status !== 'cancelled') && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Update Status</Text>

                  {nextStatus[selectedOrder.status] && (
                    <TouchableOpacity
                      style={styles.advanceBtn}
                      onPress={() => updateOrderStatus(selectedOrder.id, nextStatus[selectedOrder.status])}
                      disabled={updating}
                    >
                      {updating ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <ChevronRight size={18} color="#FFF" />
                      )}
                      <Text style={styles.advanceBtnText}>
                        Advance to "{nextStatus[selectedOrder.status].charAt(0).toUpperCase() + nextStatus[selectedOrder.status].slice(1)}"
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => Alert.alert(
                        'Cancel Order',
                        'Are you sure you want to cancel this order?',
                        [
                          { text: 'No', style: 'cancel' },
                          { text: 'Cancel Order', style: 'destructive', onPress: () => updateOrderStatus(selectedOrder.id, 'cancelled') },
                        ]
                      )}
                      disabled={updating}
                    >
                      <XCircle size={17} color="#DC2626" />
                      <Text style={styles.cancelBtnText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={{ height: insets.bottom + 40 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  refreshBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  filterRow: { maxHeight: 52 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8, paddingTop: 4 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterTabActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#FFF' },
  tabCount: { backgroundColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  tabCountTextActive: { color: '#FFF' },
  list: { padding: 16, gap: 12 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardHeader: { marginBottom: 10 },
  orderNumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusChipText: { fontSize: 12, fontWeight: '700' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  customerName: { fontSize: 14, fontWeight: '600', color: '#374151' },
  customerEmail: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  date: { fontSize: 12, color: '#9CA3AF' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemCount: { fontSize: 12, color: '#9CA3AF' },
  amount: { fontSize: 15, fontWeight: '800', color: '#111827' },
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalContent: { flex: 1, padding: 16 },
  orderHero: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 12,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  heroStatusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  heroStatusText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  heroOrderNum: { fontSize: 18, fontWeight: '800', color: '#111827' },
  heroDate: { fontSize: 13, color: '#9CA3AF' },
  section: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  customerFullName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  customerInfoEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  itemIconWrap: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  itemName: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  itemQty: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#111827', minWidth: 60, textAlign: 'right' },
  totalSection: { marginTop: 10, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalAmount: { fontSize: 14, fontWeight: '700', color: '#111827' },
  grandTotalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 2 },
  grandTotalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: '#1E40AF' },
  advanceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1E40AF', borderRadius: 14, padding: 15, marginBottom: 10,
  },
  advanceBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFF', borderRadius: 14, padding: 15,
    borderWidth: 1.5, borderColor: '#DC2626',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
});
