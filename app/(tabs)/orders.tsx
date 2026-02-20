import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, ScrollView
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import {
  Package, Clock, CheckCircle, XCircle, Truck, ShoppingBag, ArrowLeft
} from 'lucide-react-native';

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  supplier_amount: number;
};

type Shipment = {
  tracking_number: string | null;
  carrier: string | null;
  status: string;
  estimated_delivery: string | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
  shipping_address: any;
  order_items: OrderItem[];
  shipments: Shipment[];
};

const ORDER_STEPS = ['pending', 'processing', 'confirmed', 'shipped', 'delivered'];

const STATUS_COLORS: Record<string, string> = {
  delivered: '#10B981',
  shipped: '#3B82F6',
  processing: '#F59E0B',
  confirmed: '#8B5CF6',
  pending: '#9CA3AF',
  cancelled: '#EF4444',
  refunded: '#EF4444',
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, total, currency, created_at, shipping_address,
        order_items (product_name, quantity, unit_price, supplier_amount),
        shipments (tracking_number, carrier, status, estimated_delivery)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data as any);
    setLoading(false);
  };

  const getStatusIcon = (status: string, size = 20) => {
    const color = STATUS_COLORS[status] || '#9CA3AF';
    switch (status) {
      case 'delivered': return <CheckCircle size={size} color={color} />;
      case 'shipped': return <Truck size={size} color={color} />;
      case 'processing': case 'confirmed': return <Package size={size} color={color} />;
      case 'cancelled': case 'refunded': return <XCircle size={size} color={color} />;
      default: return <Clock size={size} color={color} />;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const renderTrackingSteps = (status: string) => {
    const isCancelled = status === 'cancelled' || status === 'refunded';
    if (isCancelled) {
      return (
        <View style={styles.cancelledRow}>
          <XCircle size={18} color="#EF4444" />
          <Text style={styles.cancelledText}>Order {status}</Text>
        </View>
      );
    }

    const currentStep = ORDER_STEPS.indexOf(status);
    return (
      <View style={styles.stepsContainer}>
        {ORDER_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentStep;
          const isCurrent = idx === currentStep;
          const isLast = idx === ORDER_STEPS.length - 1;
          return (
            <View key={step} style={styles.stepWrapper}>
              <View style={styles.stepColumn}>
                <View style={[
                  styles.stepDot,
                  isCompleted && styles.stepDotCompleted,
                  isCurrent && styles.stepDotCurrent,
                ]}>
                  {isCompleted && !isCurrent && <CheckCircle size={12} color="#FFF" />}
                </View>
                {!isLast && (
                  <View style={[styles.stepLine, idx < currentStep && styles.stepLineCompleted]} />
                )}
              </View>
              <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent, isCompleted && !isCurrent && styles.stepLabelCompleted]}>
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const color = STATUS_COLORS[item.status] || '#9CA3AF';
    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => setSelectedOrder(item)}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>#{item.order_number}</Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
            {getStatusIcon(item.status, 16)}
            <Text style={[styles.statusText, { color }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.itemList}>
          {item.order_items?.slice(0, 2).map((oi, idx) => (
            <Text key={idx} style={styles.itemText} numberOfLines={1}>
              {oi.quantity}x {oi.product_name}
            </Text>
          ))}
          {(item.order_items?.length || 0) > 2 && (
            <Text style={styles.moreItems}>+{item.order_items.length - 2} more</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{item.currency} {item.total?.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Orders</Text>
        </View>
        <View style={styles.emptyContainer}>
          <ShoppingBag size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Sign in to view your orders</Text>
          <Text style={styles.emptySubtext}>Track your purchases in one place</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
      </View>

      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Package size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>Your orders will appear here after you shop</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(tabs)/shop')}>
            <Text style={styles.loginButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={!!selectedOrder} animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.modalBackBtn}>
                <ArrowLeft size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Order #{selectedOrder.order_number}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.trackingSection}>
                <Text style={styles.trackingTitle}>Order Status</Text>
                {renderTrackingSteps(selectedOrder.status)}
              </View>

              {selectedOrder.shipments?.[0]?.tracking_number && (
                <View style={styles.detailCard}>
                  <Text style={styles.cardSectionTitle}>Shipment Tracking</Text>
                  <View style={styles.trackingRow}>
                    <Truck size={16} color="#3B82F6" />
                    <View>
                      <Text style={styles.trackingNum}>{selectedOrder.shipments[0].tracking_number}</Text>
                      {selectedOrder.shipments[0].carrier && (
                        <Text style={styles.trackingCarrier}>via {selectedOrder.shipments[0].carrier}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.detailCard}>
                <Text style={styles.cardSectionTitle}>Order Items</Text>
                {selectedOrder.order_items?.map((item, idx) => (
                  <View key={idx} style={styles.orderItemRow}>
                    <Text style={styles.orderItemName}>{item.product_name}</Text>
                    <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                    <Text style={styles.orderItemPrice}>${(item.unit_price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={styles.orderTotalRow}>
                  <Text style={styles.orderTotalLabel}>Total</Text>
                  <Text style={styles.orderTotalAmount}>{selectedOrder.currency} {selectedOrder.total?.toFixed(2)}</Text>
                </View>
              </View>

              {selectedOrder.shipping_address && (
                <View style={styles.detailCard}>
                  <Text style={styles.cardSectionTitle}>Delivery Address</Text>
                  <Text style={styles.addressText}>
                    {selectedOrder.shipping_address.street}{'\n'}
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}{'\n'}
                    {selectedOrder.shipping_address.country}
                  </Text>
                </View>
              )}

              <View style={styles.detailCard}>
                <Text style={styles.cardSectionTitle}>Order Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Date</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedOrder.created_at)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Number</Text>
                  <Text style={styles.detailValue}>#{selectedOrder.order_number}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: STATUS_COLORS[selectedOrder.status] }]}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFF', paddingTop: 60, paddingBottom: 20,
    paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  listContainer: { padding: 16, gap: 12 },
  orderCard: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNumber: { fontSize: 16, fontWeight: '700', color: '#111827' },
  orderDate: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
  itemList: { marginBottom: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  itemText: { fontSize: 13, color: '#6B7280', marginBottom: 3 },
  moreItems: { fontSize: 13, color: '#3B82F6', fontWeight: '600', marginTop: 2 },
  orderFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
  loginButton: {
    backgroundColor: '#3B82F6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14,
  },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalBackBtn: { width: 40 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalContent: { flex: 1, padding: 16 },
  trackingSection: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  trackingTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  stepWrapper: { alignItems: 'center', flex: 1 },
  stepColumn: { alignItems: 'center', width: '100%' },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB',
    borderWidth: 2, borderColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  stepDotCompleted: { backgroundColor: '#10B981', borderColor: '#10B981' },
  stepDotCurrent: { backgroundColor: '#3B82F6', borderColor: '#3B82F6', width: 28, height: 28, borderRadius: 14 },
  stepLine: {
    position: 'absolute', top: 11, left: '50%', right: '-50%',
    height: 2, backgroundColor: '#E5E7EB', zIndex: 0,
  },
  stepLineCompleted: { backgroundColor: '#10B981' },
  stepLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 8, textAlign: 'center', fontWeight: '500' },
  stepLabelCompleted: { color: '#10B981' },
  stepLabelCurrent: { color: '#3B82F6', fontWeight: '700' },
  cancelledRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  cancelledText: { fontSize: 14, fontWeight: '600', color: '#EF4444', textTransform: 'capitalize' },
  detailCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardSectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trackingNum: { fontSize: 14, fontWeight: '600', color: '#111827' },
  trackingCarrier: { fontSize: 12, color: '#9CA3AF' },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  orderItemName: { flex: 1, fontSize: 14, color: '#374151' },
  orderItemQty: { fontSize: 14, color: '#9CA3AF', marginHorizontal: 8 },
  orderItemPrice: { fontSize: 14, fontWeight: '600', color: '#111827' },
  orderTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 2 },
  orderTotalLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  orderTotalAmount: { fontSize: 16, fontWeight: '800', color: '#111827' },
  addressText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
});
