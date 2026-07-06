import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Package, BarChart2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Palette } from '@/constants/Colors';

export default function SupplierAnalytics() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    pendingOrders: 0
  });

  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Supplier ID
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!supplier) {
        setLoading(false);
        return;
      }

      // 2. Fetch Order Items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          supplier_amount,
          product_id,
          products (name),
          orders!inner (
            id,
            status
          )
        `)
        .eq('supplier_id', supplier.id)
        .neq('orders.status', 'cancelled');
        
      if (itemsError) throw itemsError;

      let revenue = 0;
      let pendingOrdersCount = 0;
      let productSales: Record<string, { name: string, revenue: number, sales: number }> = {};
      const uniqueOrders = new Set();

      orderItems?.forEach(item => {
        const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
        if (order) {
           if (order.status === 'pending' && !uniqueOrders.has(order.id)) {
              pendingOrdersCount++;
           }
           uniqueOrders.add(order.id);
        }

        const itemRevenue = Number(item.supplier_amount) || 0;
        revenue += itemRevenue;

        const pid = item.product_id;
        const products: any = item.products;
        const pName = Array.isArray(products) ? products[0]?.name : products?.name || 'Unknown Product';
        if (!productSales[pid]) {
          productSales[pid] = { name: pName, revenue: 0, sales: 0 };
        }
        productSales[pid].sales += item.quantity;
        productSales[pid].revenue += itemRevenue;
      });
      
      // 3. Fetch Active Products
      const { count: productCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplier.id);
        
      if (productsError) throw productsError;
      
      setStats({
        totalRevenue: revenue,
        totalOrders: uniqueOrders.size,
        activeProducts: productCount || 0,
        pendingOrders: pendingOrdersCount
      });
      
      // Sort top products
      const sortedProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      setTopProducts(sortedProducts);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: Colors.background.secondary }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: Colors.background.tertiary }]}>
                <DollarSign size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>${stats.totalRevenue.toFixed(0)}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.background.secondary }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: Colors.background.tertiary }]}>
                <ShoppingCart size={20} color={Colors.success} />
              </View>
              <Text style={styles.statLabel}>Orders</Text>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: Colors.background.secondary }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: Colors.background.tertiary }]}>
                <TrendingUp size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.background.secondary }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: Colors.background.tertiary }]}>
                <Package size={20} color={Colors.warning} />
              </View>
              <Text style={styles.statLabel}>Products</Text>
              <Text style={styles.statValue}>{stats.activeProducts}</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Products</Text>
          <View style={styles.card}>
            {topProducts.length === 0 ? (
              <Text style={styles.emptyText}>No sales data yet.</Text>
            ) : (
              topProducts.map((item, index) => (
                <View key={index} style={[styles.productRow, index !== topProducts.length - 1 && styles.borderBottom]}>
                  <View style={styles.productRank}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.productSales}>{item.sales} units sold</Text>
                  </View>
                  <Text style={styles.productRevenue}>{formatPrice(item.revenue)}</Text>
                </View>
              ))
            )}
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: { gap: 12, marginBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, padding: 16, borderRadius: 16, justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  statIconWrapper: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  statLabel: { fontSize: 13, color: Colors.text.tertiary, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.text.tertiary,
    padding: 20,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  productRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  productSales: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  productRevenue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondary,
  },
});
