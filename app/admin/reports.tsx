import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, DollarSign, TrendingUp, ShoppingBag, Users, Percent, RefreshCw } from 'lucide-react-native';

type ReportData = {
  totalRevenue: number;
  totalCommission: number;
  totalSupplierPayouts: number;
  totalOrders: number;
  avgOrderValue: number;
  topSuppliers: Array<{ business_name: string; revenue: number; orders: number }>;
  ordersByStatus: Record<string, number>;
  recentRevenue: Array<{ date: string; amount: number }>;
};

export default function AdminReportsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const loadReports = useCallback(async () => {
    try {
      const [orderItemsRes, ordersRes, suppliersRes] = await Promise.all([
        supabase.from('order_items').select('supplier_id, unit_price, quantity, commission, supplier_amount, order_id'),
        supabase.from('orders').select('id, status, total, created_at').order('created_at', { ascending: false }),
        supabase.from('suppliers').select('id, business_name'),
      ]);

      const items = orderItemsRes.data || [];
      const orders = ordersRes.data || [];
      const suppliers = suppliersRes.data || [];

      const totalRevenue = items.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);
      const totalCommission = items.reduce((s, i) => s + Number(i.commission), 0);
      const totalSupplierPayouts = items.reduce((s, i) => s + Number(i.supplier_amount), 0);
      const avgOrderValue = orders.length ? orders.reduce((s, o) => s + Number(o.total), 0) / orders.length : 0;

      const ordersByStatus: Record<string, number> = {};
      orders.forEach((o) => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });

      const supplierRevMap: Record<string, { revenue: number; orders: Set<string> }> = {};
      items.forEach((i) => {
        if (!supplierRevMap[i.supplier_id]) {
          supplierRevMap[i.supplier_id] = { revenue: 0, orders: new Set() };
        }
        supplierRevMap[i.supplier_id].revenue += Number(i.supplier_amount);
        supplierRevMap[i.supplier_id].orders.add(i.order_id);
      });

      const topSuppliers = suppliers
        .map((s) => ({
          business_name: s.business_name,
          revenue: supplierRevMap[s.id]?.revenue || 0,
          orders: supplierRevMap[s.id]?.orders.size || 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
      });

      const revenueByDay: Record<string, number> = {};
      orders.forEach((o) => {
        const day = o.created_at?.slice(0, 10);
        if (day) revenueByDay[day] = (revenueByDay[day] || 0) + Number(o.total);
      });

      const recentRevenue = last7Days.map((date) => ({
        date,
        amount: revenueByDay[date] || 0,
      }));

      setReport({
        totalRevenue, totalCommission, totalSupplierPayouts,
        totalOrders: orders.length, avgOrderValue,
        topSuppliers, ordersByStatus, recentRevenue,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const onRefresh = () => { setRefreshing(true); loadReports(); };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  const maxRevenue = Math.max(...(report?.recentRevenue.map((r) => r.amount) || [1]), 1);

  const STATUS_COLORS: Record<string, string> = {
    delivered: '#10B981', shipped: '#3B82F6', processing: '#F59E0B',
    confirmed: '#8B5CF6', pending: '#6B7280', cancelled: '#EF4444',
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue Reports</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <RefreshCw size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />}>
        <View style={styles.statsGrid}>
          <View style={styles.bigStatCard}>
            <DollarSign size={24} color="#1E40AF" />
            <Text style={styles.bigStatValue}>${report?.totalRevenue.toFixed(0)}</Text>
            <Text style={styles.bigStatLabel}>Gross Revenue</Text>
          </View>
          <View style={[styles.bigStatCard, { backgroundColor: '#ECFDF5' }]}>
            <Percent size={24} color="#065F46" />
            <Text style={[styles.bigStatValue, { color: '#065F46' }]}>${report?.totalCommission.toFixed(0)}</Text>
            <Text style={styles.bigStatLabel}>Platform Commission</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.smallStat}>
            <ShoppingBag size={18} color="#8B5CF6" />
            <Text style={styles.smallStatValue}>{report?.totalOrders}</Text>
            <Text style={styles.smallStatLabel}>Total Orders</Text>
          </View>
          <View style={styles.smallStat}>
            <TrendingUp size={18} color="#F59E0B" />
            <Text style={styles.smallStatValue}>${report?.avgOrderValue.toFixed(0)}</Text>
            <Text style={styles.smallStatLabel}>Avg. Order</Text>
          </View>
          <View style={styles.smallStat}>
            <Users size={18} color="#EF4444" />
            <Text style={styles.smallStatValue}>${report?.totalSupplierPayouts.toFixed(0)}</Text>
            <Text style={styles.smallStatLabel}>Supplier Payouts</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue — Last 7 Days</Text>
          <View style={styles.chartContainer}>
            {report?.recentRevenue.map((day, idx) => (
              <View key={idx} style={styles.barGroup}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max((day.amount / maxRevenue) * 80, day.amount > 0 ? 4 : 2) },
                      day.amount === 0 && styles.barEmpty,
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day.date.slice(5)}</Text>
                {day.amount > 0 && <Text style={styles.barValue}>${day.amount.toFixed(0)}</Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders by Status</Text>
          <View style={styles.statusList}>
            {Object.entries(report?.ordersByStatus || {}).map(([status, count]) => (
              <View key={status} style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] || '#6B7280' }]} />
                <Text style={styles.statusLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                <Text style={styles.statusCount}>{count}</Text>
                <View style={styles.statusBar}>
                  <View
                    style={[styles.statusBarFill, {
                      width: `${((count / (report?.totalOrders || 1)) * 100)}%` as any,
                      backgroundColor: STATUS_COLORS[status] || '#6B7280',
                    }]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Suppliers</Text>
          {report?.topSuppliers.map((supplier, idx) => (
            <View key={idx} style={styles.supplierRow}>
              <View style={styles.supplierRank}>
                <Text style={styles.supplierRankText}>{idx + 1}</Text>
              </View>
              <View style={styles.supplierInfo}>
                <Text style={styles.supplierName}>{supplier.business_name}</Text>
                <Text style={styles.supplierOrders}>{supplier.orders} orders</Text>
              </View>
              <Text style={styles.supplierRevenue}>${supplier.revenue.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { flex: 1, padding: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  bigStatCard: {
    flex: 1, backgroundColor: '#EFF6FF', borderRadius: 16, padding: 18,
    alignItems: 'center', gap: 8,
  },
  bigStatValue: { fontSize: 22, fontWeight: '800', color: '#1E3A8A' },
  bigStatLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  smallStat: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB',
  },
  smallStatValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  smallStatLabel: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  section: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  barGroup: { alignItems: 'center', flex: 1 },
  barContainer: { height: 80, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: 20, backgroundColor: '#3B82F6', borderRadius: 4 },
  barEmpty: { backgroundColor: '#E5E7EB' },
  barLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  barValue: { fontSize: 9, color: '#3B82F6', fontWeight: '600', marginTop: 2 },
  statusList: { gap: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 14, color: '#374151', width: 80 },
  statusCount: { fontSize: 14, fontWeight: '700', color: '#111827', width: 30 },
  statusBar: { flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  statusBarFill: { height: '100%', borderRadius: 4 },
  supplierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  supplierRank: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
  },
  supplierRankText: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  supplierInfo: { flex: 1 },
  supplierName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  supplierOrders: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  supplierRevenue: { fontSize: 15, fontWeight: '800', color: '#10B981' },
});
