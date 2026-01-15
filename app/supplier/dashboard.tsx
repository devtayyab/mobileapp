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
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome to your Supplier Portal</Text>
          <Text style={styles.welcomeSubtext}>Manage your products and orders efficiently</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.revenueCard]}>
            <View style={styles.statIconContainer}>
              <DollarSign size={28} color="#10B981" />
            </View>
            <Text style={styles.statValue}>${data.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>

          <View style={[styles.statCard, styles.ordersCard]}>
            <View style={styles.statIconContainer}>
              <ShoppingCart size={28} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>{data.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>

          <View style={[styles.statCard, styles.productsCard]}>
            <View style={styles.statIconContainer}>
              <Package size={28} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{data.totalProducts}</Text>
            <Text style={styles.statLabel}>Active Products</Text>
          </View>

          <View style={[styles.statCard, styles.pendingCard]}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={28} color="#9C27B0" />
            </View>
            <Text style={styles.statValue}>{data.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending Orders</Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.actionsSectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => router.push('/supplier/products')}
          >
            <View style={styles.actionIconWrapper}>
              <Package size={24} color="#FFF" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.primaryActionTitle}>Manage Products</Text>
              <Text style={styles.primaryActionSubtitle}>Add, edit, or remove products</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => router.push('/supplier/orders')}
          >
            <View style={styles.actionIconWrapper}>
              <ShoppingCart size={24} color="#FFF" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.primaryActionTitle}>Manage Orders</Text>
              <Text style={styles.primaryActionSubtitle}>View and process customer orders</Text>
            </View>
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
  welcomeSection: {
    backgroundColor: '#007AFF',
    padding: 24,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
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
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  revenueCard: {
    borderTopWidth: 3,
    borderTopColor: '#10B981',
  },
  ordersCard: {
    borderTopWidth: 3,
    borderTopColor: '#007AFF',
  },
  productsCard: {
    borderTopWidth: 3,
    borderTopColor: '#FF9800',
  },
  pendingCard: {
    borderTopWidth: 3,
    borderTopColor: '#9C27B0',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsSection: {
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: 8,
  },
  actionsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  primaryActionSubtitle: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
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
