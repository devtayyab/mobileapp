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
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const navItems = [
    {
      label: 'Supplier Management',
      subtitle: 'KYC reviews & approvals',
      icon: Store, color: '#2563EB', bg: '#EFF6FF',
      route: '/admin/suppliers',
      badge: stats.pendingKyc > 0 ? stats.pendingKyc : undefined,
      badgeColor: '#EF4444',
    },
    {
      label: 'Product Catalog',
      subtitle: 'Feature, activate & manage listings',
      icon: Package, color: '#059669', bg: '#ECFDF5',
      route: '/admin/products',
    },
    {
      label: 'Order Monitoring',
      subtitle: 'Track & update order statuses',
      icon: ShoppingBag, color: '#D97706', bg: '#FFFBEB',
      route: '/admin/orders',
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : undefined,
      badgeColor: '#F59E0B',
    },
    {
      label: 'Revenue Reports',
      subtitle: 'Platform earnings & commission',
      icon: BarChart2, color: '#7C3AED', bg: '#F5F3FF',
      route: '/admin/reports',
    },
    {
      label: 'User Management',
      subtitle: 'All users, roles & analytics',
      icon: Users, color: '#DC2626', bg: '#FEF2F2',
      route: '/admin/users',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadge}>
            <Shield size={12} color="#FFF" />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
          <Text style={styles.headerName}>{profile?.full_name || 'Administrator'}</Text>
          <Text style={styles.headerEmail}>{profile?.email}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
            <RefreshCw size={18} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={styles.iconBtn}>
            <LogOut size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />}
      >
        {stats.pendingKyc > 0 && (
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
            { label: 'Total Users', value: stats.totalUsers, color: '#1E40AF', bg: '#EFF6FF', icon: Users },
            { label: 'Suppliers', value: stats.totalSuppliers, sub: `${stats.approvedSuppliers} approved`, color: '#059669', bg: '#ECFDF5', icon: Store },
            { label: 'Total Orders', value: stats.totalOrders, color: '#D97706', bg: '#FFFBEB', icon: ShoppingBag },
            { label: 'Pending Orders', value: stats.pendingOrders, color: '#DC2626', bg: '#FEF2F2', icon: Clock },
            { label: 'Products', value: stats.totalProducts, sub: `${stats.activeProducts} active`, color: '#7C3AED', bg: '#F5F3FF', icon: Package },
            { label: 'KYC Pending', value: stats.pendingKyc, color: '#B45309', bg: '#FEF3C7', icon: Activity },
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
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },
  header: {
    backgroundColor: '#0F172A',
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: { gap: 4 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1E40AF', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
  },
  adminBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  headerName: { fontSize: 20, fontWeight: '800', color: '#F1F5F9', marginTop: 4 },
  headerEmail: { fontSize: 13, color: '#64748B' },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1, paddingHorizontal: 16 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14,
    marginTop: 16, marginBottom: 4,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  alertIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center',
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  alertSub: { fontSize: 12, color: '#B45309', marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  revenueRow: { flexDirection: 'row', gap: 12 },
  revenueCard: {
    flex: 1, backgroundColor: '#EFF6FF', borderRadius: 16, padding: 18,
    alignItems: 'center', gap: 6,
  },
  revenueIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  revenueValue: { fontSize: 22, fontWeight: '800', color: '#1E3A8A' },
  revenueLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10,
  },
  statCard: {
    width: '30.5%', borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
  statSub: { fontSize: 10, fontWeight: '600', opacity: 0.8 },
  navList: { gap: 10 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  navIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  navText: { flex: 1 },
  navLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  navSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeWrap: {
    borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    minWidth: 24, alignItems: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
});
