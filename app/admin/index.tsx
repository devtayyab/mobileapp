import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, Users, Package, ShoppingBag, BarChart2,
  TrendingUp, DollarSign, CheckCircle, Clock, LogOut, Settings,
  ChevronRight, AlertCircle
} from 'lucide-react-native';

type AdminStats = {
  totalUsers: number;
  totalSuppliers: number;
  pendingKyc: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  platformCommission: number;
};

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, totalSuppliers: 0, pendingKyc: 0,
    totalProducts: 0, totalOrders: 0, pendingOrders: 0,
    totalRevenue: 0, platformCommission: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        usersRes, suppliersRes, kycRes, productsRes,
        ordersRes, pendingOrdersRes, revenueRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('order_items').select('unit_price, quantity, commission'),
      ]);

      const totalRevenue = revenueRes.data?.reduce(
        (sum, item) => sum + (Number(item.unit_price) * Number(item.quantity)), 0
      ) || 0;
      const platformCommission = revenueRes.data?.reduce(
        (sum, item) => sum + Number(item.commission), 0
      ) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalSuppliers: suppliersRes.count || 0,
        pendingKyc: kycRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        pendingOrders: pendingOrdersRes.count || 0,
        totalRevenue,
        platformCommission,
      });
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    router.replace('/(auth)/welcome');
    setTimeout(() => signOut(), 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  const navItems = [
    { label: 'Supplier Management', subtitle: 'Approve & review suppliers', icon: Users, color: '#3B82F6', bg: '#EFF6FF', route: '/admin/suppliers', badge: stats.pendingKyc > 0 ? stats.pendingKyc : undefined },
    { label: 'Product Catalog', subtitle: 'Manage all products', icon: Package, color: '#10B981', bg: '#ECFDF5', route: '/admin/products' },
    { label: 'Order Monitoring', subtitle: 'Track all orders', icon: ShoppingBag, color: '#F59E0B', bg: '#FFFBEB', route: '/admin/orders', badge: stats.pendingOrders > 0 ? stats.pendingOrders : undefined },
    { label: 'Revenue Reports', subtitle: 'Commission & earnings', icon: BarChart2, color: '#8B5CF6', bg: '#F5F3FF', route: '/admin/reports' },
    { label: 'User Analytics', subtitle: 'Customer & B2B insights', icon: TrendingUp, color: '#EF4444', bg: '#FEF2F2', route: '/admin/users' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Admin Panel</Text>
          <Text style={styles.headerName}>{profile?.full_name || 'Administrator'}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <LogOut size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {stats.pendingKyc > 0 && (
          <TouchableOpacity style={styles.alertBanner} onPress={() => router.push('/admin/suppliers')}>
            <AlertCircle size={18} color="#B45309" />
            <Text style={styles.alertText}>{stats.pendingKyc} supplier(s) pending KYC review</Text>
            <ChevronRight size={16} color="#B45309" />
          </TouchableOpacity>
        )}

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <DollarSign size={20} color="#1E40AF" />
            <Text style={styles.statValue}>${stats.totalRevenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
            <TrendingUp size={20} color="#065F46" />
            <Text style={styles.statValue}>${stats.platformCommission.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Commission</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
            <ShoppingBag size={20} color="#92400E" />
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
            <Clock size={20} color="#991B1B" />
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
            <Users size={20} color="#5B21B6" />
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <CheckCircle size={20} color="#166534" />
            <Text style={styles.statValue}>{stats.totalSuppliers}</Text>
            <Text style={styles.statLabel}>Suppliers</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Management</Text>

        <View style={styles.navList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.route}
                style={styles.navItem}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.navIconWrap, { backgroundColor: item.bg }]}>
                  <Icon size={22} color={item.color} />
                </View>
                <View style={styles.navText}>
                  <Text style={styles.navLabel}>{item.label}</Text>
                  <Text style={styles.navSubtitle}>{item.subtitle}</Text>
                </View>
                <View style={styles.navRight}>
                  {item.badge ? (
                    <View style={styles.badgeWrap}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  <ChevronRight size={18} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          })}
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
    backgroundColor: '#1E293B',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerGreeting: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 4 },
  headerName: { fontSize: 22, fontWeight: '700', color: '#F1F5F9' },
  signOutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1, padding: 20 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A',
  },
  alertText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#92400E' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28,
  },
  statCard: {
    width: '30.5%', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 6,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 14 },
  navList: { gap: 10 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF', padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  navIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  navText: { flex: 1 },
  navLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  navSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeWrap: {
    backgroundColor: '#EF4444', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
});
