import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Users, Package, ShoppingBag, BarChart2, TrendingUp,
  DollarSign, Clock, LogOut, ChevronRight, AlertCircle,
  Store, Shield, RefreshCw, Activity
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

type AdminStats = {
  totalUsers: number;
  totalSuppliers: number;
  pendingKyc: number;
  approvedSuppliers: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  platformCommission: number;
};

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, totalSuppliers: 0, pendingKyc: 0, approvedSuppliers: 0,
    totalProducts: 0, activeProducts: 0, totalOrders: 0, pendingOrders: 0,
    totalRevenue: 0, platformCommission: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const [
        usersRes, suppliersRes, kycPendingRes, kycApprovedRes,
        productsRes, activeProductsRes, ordersRes, pendingOrdersRes, revenueRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('kyc_status', 'approved'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('total, platform_commission'),
      ]);

      const totalRevenue = revenueRes.data?.reduce((s, o) => s + Number(o.total), 0) || 0;
      const platformCommission = revenueRes.data?.reduce((s, o) => s + Number(o.platform_commission), 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalSuppliers: suppliersRes.count || 0,
        pendingKyc: kycPendingRes.count || 0,
        approvedSuppliers: kycApprovedRes.count || 0,
        totalProducts: productsRes.count || 0,
        activeProducts: activeProductsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        pendingOrders: pendingOrdersRes.count || 0,
        totalRevenue,
        platformCommission,
      });
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const onRefresh = () => { setRefreshing(true); loadStats(); };

  const handleSignOut = async () => {
    router.replace('/(auth)/welcome');
    setTimeout(() => signOut(), 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const navItems = [
    {
      label: 'Supplier Management',
      subtitle: 'KYC reviews & approvals',
      icon: Store, color: Colors.primary, bg: Colors.background.tertiary,
      route: '/admin/suppliers',
      badge: stats.pendingKyc > 0 ? stats.pendingKyc : undefined,
      badgeColor: Colors.error,
    },
    {
      label: 'Product Catalog',
      subtitle: 'Feature, activate & manage listings',
      icon: Package, color: Colors.success, bg: Colors.background.tertiary,
      route: '/admin/products',
    },
    {
      label: 'Order Monitoring',
      subtitle: 'Track & update order statuses',
      icon: ShoppingBag, color: Colors.warning, bg: Colors.background.tertiary,
      route: '/admin/orders',
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : undefined,
      badgeColor: Colors.warning,
    },
    {
      label: 'Revenue Reports',
      subtitle: 'Platform earnings & commission',
      icon: BarChart2, color: Colors.primaryLight, bg: Colors.background.tertiary,
      route: '/admin/reports',
    },
    {
      label: 'User Management',
      subtitle: 'All users, roles & analytics',
      icon: Users, color: Colors.error, bg: Colors.background.tertiary,
      route: '/admin/users',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadge}>
            <Shield size={10} color="#FFF" />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
          <Text style={styles.headerName}>{profile?.full_name || 'Administrator'}</Text>
          <Text style={styles.headerEmail}>{profile?.email}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
            <RefreshCw size={20} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={styles.headerIconBtn}>
            <LogOut size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {!!(stats.pendingKyc > 0) && (
          <TouchableOpacity style={styles.alertBanner} onPress={() => router.push('/admin/suppliers')}>
            <View style={styles.alertIcon}>
              <AlertCircle size={18} color="#B45309" />
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertTitle}>{stats.pendingKyc} Pending KYC Review{stats.pendingKyc > 1 ? 's' : ''}</Text>
              <Text style={styles.alertSub}>Tap to review supplier applications</Text>
            </View>
            <ChevronRight size={16} color="#B45309" />
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>Platform Overview</Text>

        <View style={styles.revenueRow}>
          <View style={styles.revenueCard}>
            <View style={styles.revenueIconWrap}>
              <DollarSign size={22} color="#1E40AF" />
            </View>
            <Text style={styles.revenueValue}>${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
            <Text style={styles.revenueLabel}>Gross Revenue</Text>
          </View>
          <View style={[styles.revenueCard, { backgroundColor: '#ECFDF5' }]}>
            <View style={[styles.revenueIconWrap, { backgroundColor: '#D1FAE5' }]}>
              <TrendingUp size={22} color="#059669" />
            </View>
            <Text style={[styles.revenueValue, { color: '#065F46' }]}>${stats.platformCommission.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
            <Text style={styles.revenueLabel}>Commission Earned</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {[
            { label: 'Total Users', value: stats.totalUsers, color: Colors.primary, bg: Colors.background.tertiary, icon: Users },
            { label: 'Suppliers', value: stats.totalSuppliers, sub: `${stats.approvedSuppliers} approved`, color: Colors.success, bg: Colors.background.tertiary, icon: Store },
            { label: 'Total Orders', value: stats.totalOrders, color: Colors.warning, bg: Colors.background.tertiary, icon: ShoppingBag },
            { label: 'Pending Orders', value: stats.pendingOrders, color: Colors.error, bg: Colors.background.tertiary, icon: Clock },
            { label: 'Products', value: stats.totalProducts, sub: `${stats.activeProducts} active`, color: Colors.primaryLight, bg: Colors.background.tertiary, icon: Package },
            { label: 'KYC Pending', value: stats.pendingKyc, color: Colors.warning, bg: Colors.background.tertiary, icon: Activity },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <View key={item.label} style={[styles.statCard, { backgroundColor: item.bg }]}>
                <Icon size={16} color={item.color} />
                <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
                {item.sub && <Text style={[styles.statSub, { color: item.color }]}>{item.sub}</Text>}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Management</Text>

        <View style={styles.navList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.route}
                style={styles.navItem}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
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
                    <View style={[styles.badgeWrap, { backgroundColor: item.badgeColor || '#EF4444' }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  <ChevronRight size={18} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: Colors.background.primary },
  loadingText: { fontSize: 14, color: Colors.text.tertiary },
  header: {
    backgroundColor: Colors.background.secondary,
    paddingBottom: 24, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderBottomWidth: 1, borderBottomColor: Colors.border.medium,
  },
  headerLeft: { flex: 1, gap: 2 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start',
  },
  adminBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.text.inverse, letterSpacing: 0.5 },
  headerName: { fontSize: 22, fontWeight: '900', color: Colors.text.primary, marginTop: 4 },
  headerEmail: { fontSize: 13, color: Colors.text.tertiary },
  headerRight: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingBottom: 4 },
  headerIconBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1, paddingHorizontal: 16 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background.tertiary, borderRadius: 14, padding: 14,
    marginTop: 16, marginBottom: 4,
    borderWidth: 1, borderColor: Colors.warning,
  },
  alertIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.background.secondary, justifyContent: 'center', alignItems: 'center',
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: Colors.warning },
  alertSub: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  revenueRow: { flexDirection: 'row', gap: 12 },
  revenueCard: {
    flex: 1, backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 18,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border.medium,
  },
  revenueIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.background.tertiary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  revenueValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  revenueLabel: { fontSize: 12, color: Colors.text.tertiary, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  statCard: {
    width: '30.5%', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4,
    backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.medium,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.text.tertiary, fontWeight: '500', textAlign: 'center' },
  statSub: { fontSize: 10, fontWeight: '600', opacity: 0.8 },
  navList: { gap: 10 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.background.secondary, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  navIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  navText: { flex: 1 },
  navLabel: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  navSubtitle: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeWrap: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, minWidth: 24, alignItems: 'center' },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
});
