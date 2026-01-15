import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react-native';

type DashboardData = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
  }>;
};

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    recentOrders: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!supplier) {
        setLoading(false);
        return;
      }

      const [productsResult, orderItemsResult, recentOrdersResult] = await Promise.all([
        supabase
          .from('products')
          .select('id')
          .eq('supplier_id', supplier.id)
          .eq('is_active', true),
        supabase
          .from('order_items')
          .select('supplier_amount')
          .eq('supplier_id', supplier.id),
        supabase
          .from('order_items')
          .select(`
            order_id,
            orders (
              id,
              order_number,
              status,
              created_at
            )
          `)
          .eq('supplier_id', supplier.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const totalProducts = productsResult.data?.length || 0;
      const totalOrders = new Set(orderItemsResult.data?.map(item => item) || []).size;
      const totalRevenue = orderItemsResult.data?.reduce((sum, item) => sum + Number(item.supplier_amount), 0) || 0;

      const uniqueOrders = new Map();
      recentOrdersResult.data?.forEach((item: any) => {
        if (item.orders && !uniqueOrders.has(item.orders.id)) {
          uniqueOrders.set(item.orders.id, item.orders);
        }
      });

      const recentOrders = Array.from(uniqueOrders.values()).map((order: any) => ({
        ...order,
        total: totalRevenue / totalOrders || 0,
      }));

      const pendingOrders = recentOrders.filter((order: any) => order.status === 'pending').length;

      setData({
        totalRevenue,
        totalOrders,
        totalProducts,
        pendingOrders,
        recentOrders: recentOrders.slice(0, 5),
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supplier Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.revenueCard]}>
            <DollarSign size={24} color="#10B981" />
            <Text style={styles.statValue}>${data.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>

          <View style={[styles.statCard, styles.ordersCard]}>
            <ShoppingCart size={24} color="#007AFF" />
            <Text style={styles.statValue}>{data.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>

          <View style={[styles.statCard, styles.productsCard]}>
            <Package size={24} color="#FF9800" />
            <Text style={styles.statValue}>{data.totalProducts}</Text>
            <Text style={styles.statLabel}>Active Products</Text>
          </View>

          <View style={[styles.statCard, styles.pendingCard]}>
            <TrendingUp size={24} color="#9C27B0" />
            <Text style={styles.statValue}>{data.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending Orders</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/supplier/products')}
          >
            <Package size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Manage Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/supplier/orders')}
          >
            <ShoppingCart size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Manage Orders</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {data.recentOrders.length > 0 ? (
            data.recentOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                    {order.status}
                  </Text>
                </View>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent orders</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return '#10B981';
    case 'shipped':
    case 'processing':
      return '#007AFF';
    case 'cancelled':
      return '#EF4444';
    default:
      return '#F59E0B';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  revenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  ordersCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  productsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 12,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  orderCard: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
