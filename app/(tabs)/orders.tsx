import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, ScrollView
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import {
  Package, Clock, CheckCircle, XCircle, Truck, ShoppingBag, ArrowLeft
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

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
  subtotal: number;
  shipping_fee: number;
  vat_amount: number;
  order_items: OrderItem[];
  shipments: Shipment[];
  countries?: { name: string } | null;
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
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { user } = useAuth();
  const { t, language } = useLanguage();
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
        id, order_number, status, subtotal, shipping_fee, vat_amount, total, currency, created_at, shipping_address,
        order_items (product_name, quantity, unit_price, supplier_amount),
        shipments (tracking_number, carrier, status, estimated_delivery, courier_id, couriers(name, code, tracking_url_format)),
        countries (name)
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
    new Date(dateString).toLocaleDateString(language.code === 'el' ? 'el-GR' : language.code === 'fr' ? 'fr-FR' : language.code === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
        <View style={[styles.orderHeader, language.rtl && { flexDirection: 'row-reverse' }]}>
          <View style={language.rtl && { alignItems: 'flex-end' }}>
            <Text style={styles.orderNumber}>#{item.order_number}</Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color + '20' }, language.rtl && { flexDirection: 'row-reverse' }]}>
            {getStatusIcon(item.status, 16)}
            <Text style={[styles.statusText, { color }]}>
              {t[item.status as keyof typeof t] || item.status}
            </Text>
          </View>
        </View>

        <View style={styles.itemList}>
          {item.order_items?.slice(0, 2).map((oi, idx) => (
            <Text key={idx} style={[styles.itemText, language.rtl && { textAlign: 'right' }]} numberOfLines={1}>
              {oi.quantity}x {oi.product_name}
            </Text>
          ))}
          {(item.order_items?.length || 0) > 2 && (
            <Text style={[styles.moreItems, language.rtl && { textAlign: 'right' }]}>{t.moreItems.replace('{count}', (item.order_items.length - 2).toString())}</Text>
          )}
        </View>

        <View style={[styles.orderFooter, language.rtl && { flexDirection: 'row-reverse' }]}>
          <Text style={styles.totalLabel}>{t.total}</Text>
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
      <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
        <View style={styles.header}>
          <Text style={[styles.title, language.rtl && { textAlign: 'right' }]}>{t.myOrders}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <ShoppingBag size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>{t.signInToViewOrders}</Text>
          <Text style={styles.emptySubtext}>{t.trackYourPurchases}</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginButtonText}>{t.signIn}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, language.rtl && { textAlign: 'right' }]}>{t.myOrders}</Text>
        <Text style={[styles.subtitle, language.rtl && { textAlign: 'right' }]}>
          {t.ordersCount.replace('{count}', orders.length.toString()).replace('{s}', orders.length !== 1 ? 's' : '')}
        </Text>
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
          <Text style={styles.emptyText}>{t.noOrdersYet}</Text>
          <Text style={styles.emptySubtext}>{t.ordersWillAppear}</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(tabs)/shop')}>
            <Text style={styles.loginButtonText}>{t.browseProducts}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={!!selectedOrder} animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <View style={[styles.modalContainer, language.rtl && { direction: 'rtl' }]}>
            <View style={[styles.modalHeader, language.rtl && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.modalBackBtn}>
                <ArrowLeft size={24} color="#111827" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t.orderNumber}: #{selectedOrder.order_number}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={[styles.trackingSection, language.rtl && { alignItems: 'flex-end' }]}>
                <Text style={[styles.trackingTitle, language.rtl && { textAlign: 'right' }]}>{t.orderStatus}</Text>
                {renderTrackingSteps(selectedOrder.status)}
              </View>

              {selectedOrder.shipments?.[0]?.tracking_number && (
                <View style={[styles.detailCard, language.rtl && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.cardSectionTitle, language.rtl && { textAlign: 'right' }]}>{t.shipmentTracking}</Text>

                  {/* Courier Badge */}
                  {(selectedOrder.shipments[0] as any).couriers?.name || selectedOrder.shipments[0].carrier ? (
                    <View style={styles.courierBadgeRow}>
                      <View style={styles.courierBadge}>
                        <Truck size={13} color="#3B82F6" />
                        <Text style={styles.courierBadgeText}>
                          {(selectedOrder.shipments[0] as any).couriers?.name || selectedOrder.shipments[0].carrier}
                        </Text>
                      </View>
                      <View style={[styles.shipStatusChip, { backgroundColor: STATUS_COLORS[selectedOrder.shipments[0].status] + '20' || '#F3F4F6' }]}>
                        <Text style={[styles.shipStatusText, { color: STATUS_COLORS[selectedOrder.shipments[0].status] || '#6B7280' }]}>
                          {selectedOrder.shipments[0].status?.replace('_',' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Tracking Number Box */}
                  <View style={styles.trackingBox}>
                    <Text style={styles.trackingBoxLabel}>TRACKING NUMBER</Text>
                    <Text style={styles.trackingBoxNumber}>{selectedOrder.shipments[0].tracking_number}</Text>
                  </View>
                </View>
              )}

              <View style={[styles.detailCard, language.rtl && { alignItems: 'flex-end' }]}>
                <Text style={[styles.cardSectionTitle, language.rtl && { textAlign: 'right' }]}>{t.orderItems}</Text>
                {selectedOrder.order_items?.map((item, idx) => (
                  <View key={idx} style={[styles.orderItemRow, language.rtl && { flexDirection: 'row-reverse' }]}>
                    <Text style={[styles.orderItemName, language.rtl && { textAlign: 'right' }]}>{item.product_name}</Text>
                    <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                    <Text style={styles.orderItemPrice}>${(item.unit_price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
                
                <View style={styles.divider} />
                
                {selectedOrder.subtotal !== undefined && (
                  <View style={[styles.detailRow, language.rtl && { flexDirection: 'row-reverse' }, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>{t.subtotal || 'Subtotal'}</Text>
                    <Text style={styles.detailValue}>{selectedOrder.currency} {selectedOrder.subtotal?.toFixed(2)}</Text>
                  </View>
                )}
                
                {selectedOrder.shipping_fee !== undefined && (
                  <View style={[styles.detailRow, language.rtl && { flexDirection: 'row-reverse' }, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>{t.shipping || 'Shipping Fee'}</Text>
                    <Text style={styles.detailValue}>{selectedOrder.currency} {selectedOrder.shipping_fee?.toFixed(2)}</Text>
                  </View>
                )}
                
                {selectedOrder.vat_amount ? (
                  <View style={[styles.detailRow, language.rtl && { flexDirection: 'row-reverse' }, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>{(t as any).vat || 'VAT/Tax'}</Text>
                    <Text style={styles.detailValue}>{selectedOrder.currency} {selectedOrder.vat_amount?.toFixed(2)}</Text>
                  </View>
                ) : null}

                <View style={[styles.orderTotalRow, language.rtl && { flexDirection: 'row-reverse' }]}>
                  <Text style={styles.orderTotalLabel}>{t.total}</Text>
                  <Text style={styles.orderTotalAmount}>{selectedOrder.currency} {selectedOrder.total?.toFixed(2)}</Text>
                </View>
              </View>

              {selectedOrder.shipping_address && (
                <View style={[styles.detailCard, language.rtl && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.cardSectionTitle, language.rtl && { textAlign: 'right' }]}>{t.deliveryAddress}</Text>

                  {/* Destination Country */}
                  {selectedOrder.countries?.name && (
                    <View style={styles.countryChip}>
                      <Text style={styles.countryChipText}>🌍 {selectedOrder.countries.name}</Text>
                    </View>
                  )}

                  <Text style={[styles.addressText, language.rtl && { textAlign: 'right' }]}>
                    {selectedOrder.shipping_address.street}{'\n'}
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}{'\n'}
                    {selectedOrder.shipping_address.country}
                  </Text>
                </View>
              )}

              <View style={[styles.detailCard, language.rtl && { alignItems: 'flex-end' }]}>
                <Text style={[styles.cardSectionTitle, language.rtl && { textAlign: 'right' }]}>{t.orderDetails}</Text>
                <View style={[styles.detailRow, language.rtl && { flexDirection: 'row-reverse' }]}>
                  <Text style={styles.detailLabel}>{t.orderDate}</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedOrder.created_at)}</Text>
                </View>
                <View style={[styles.detailRow, language.rtl && { flexDirection: 'row-reverse' }]}>
                  <Text style={styles.detailLabel}>{t.orderNumber}</Text>
                  <Text style={styles.detailValue}>#{selectedOrder.order_number}</Text>
                </View>
                <View style={[styles.detailRow, language.rtl && { flexDirection: 'row-reverse' }]}>
                  <Text style={styles.detailLabel}>{t.status}</Text>
                  <Text style={[styles.detailValue, { color: STATUS_COLORS[selectedOrder.status] }]}>
                    {t[selectedOrder.status as keyof typeof t] || selectedOrder.status}
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

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.primary },
  header: {
    backgroundColor: Colors.background.secondary, paddingTop: 60, paddingBottom: 20,
    paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.border.medium,
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text.primary },
  subtitle: { fontSize: 14, color: Colors.text.tertiary, marginTop: 4 },
  listContainer: { padding: 16, gap: 12 },
  orderCard: {
    backgroundColor: Colors.background.secondary, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNumber: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  orderDate: { fontSize: 13, color: Colors.text.tertiary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
  itemList: { marginBottom: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border.light },
  itemText: { fontSize: 13, color: Colors.text.tertiary, marginBottom: 3 },
  moreItems: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  orderFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
  totalLabel: { fontSize: 14, color: Colors.text.tertiary },
  totalAmount: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center', marginBottom: 24 },
  loginButton: {
    backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14,
  },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: Colors.background.primary },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: Colors.background.secondary, borderBottomWidth: 1, borderBottomColor: Colors.border.medium,
  },
  modalBackBtn: { width: 40 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary },
  modalContent: { flex: 1, padding: 16 },
  trackingSection: {
    backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  trackingTitle: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  stepWrapper: { alignItems: 'center', flex: 1 },
  stepColumn: { alignItems: 'center', width: '100%' },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.border.medium,
    borderWidth: 2, borderColor: Colors.border.dark,
    justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  stepDotCompleted: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepDotCurrent: { backgroundColor: Colors.primary, borderColor: Colors.primary, width: 28, height: 28, borderRadius: 14 },
  stepLine: {
    position: 'absolute', top: 11, left: '50%', right: '-50%',
    height: 2, backgroundColor: Colors.border.medium, zIndex: 0,
  },
  stepLineCompleted: { backgroundColor: Colors.success },
  stepLabel: { fontSize: 10, color: Colors.text.tertiary, marginTop: 8, textAlign: 'center', fontWeight: '500' },
  stepLabelCompleted: { color: Colors.success },
  stepLabelCurrent: { color: Colors.primary, fontWeight: '700' },
  cancelledRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  cancelledText: { fontSize: 14, fontWeight: '600', color: Colors.error, textTransform: 'capitalize' },
  detailCard: {
    backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  cardSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.text.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  courierBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  courierBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  courierBadgeText: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
  shipStatusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  shipStatusText: { fontSize: 11, fontWeight: '800' },
  trackingBox: { backgroundColor: Colors.background.primary, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border.medium },
  trackingBoxLabel: { fontSize: 10, fontWeight: '700', color: Colors.text.tertiary, letterSpacing: 1, marginBottom: 4 },
  trackingBoxNumber: { fontSize: 15, fontWeight: '800', color: Colors.text.primary, letterSpacing: 0.8 },
  countryChip: { backgroundColor: Colors.background.primary, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.border.medium, marginBottom: 10 },
  countryChipText: { fontSize: 13, fontWeight: '600', color: Colors.text.primary },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trackingNum: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  trackingCarrier: { fontSize: 12, color: Colors.text.tertiary },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  orderItemName: { flex: 1, fontSize: 14, color: Colors.text.primary },
  orderItemQty: { fontSize: 14, color: Colors.text.tertiary, marginHorizontal: 8 },
  orderItemPrice: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  orderTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 2 },
  orderTotalLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  orderTotalAmount: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  addressText: { fontSize: 14, color: Colors.text.primary, lineHeight: 22 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  detailLabel: { fontSize: 14, color: Colors.text.tertiary },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  divider: { height: 1, backgroundColor: Colors.border.medium, marginVertical: 8 },
});
