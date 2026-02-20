import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Image, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Menu, X, DollarSign, Package, ShoppingCart, TrendingUp, Settings, LogOut, User, Store, ChevronRight, Bell, HelpCircle, FileText, ShieldCheck, AlertCircle, Clock } from 'lucide-react-native';

type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | null;

const { width } = Dimensions.get('window');

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
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    recentOrders: [],
  });
  const [kycStatus, setKycStatus] = useState<KycStatus>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(-width * 0.8)).current;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.timing(menuAnim, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsMenuOpen(false));
    } else {
      setIsMenuOpen(true);
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const loadDashboardData = async () => {
    try {
      if (!user?.id) return;

      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id, kyc_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!supplier) {
        setLoading(false);
        return;
      }

      setKycStatus(supplier.kyc_status as KycStatus);

      const [productsResult, orderItemsResult, recentOrdersResult] = await Promise.all([
        supabase
          .from('products')
          .select('id')
          .eq('supplier_id', supplier.id),
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
        total: totalRevenue / totalOrders || 0, // Simplified approximation
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

  const handleSignOut = async () => {
    try {
      toggleMenu();
      router.replace('/(auth)/welcome');
      // Adding a small delay to ensure navigation starts before sign out clears state
      // which might cause the "navigation before mount" error if context updates too fast
      setTimeout(async () => {
        await signOut();
      }, 100);
    } catch (error) {
      console.error('Error signing out:', error);
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
            <Menu size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color="#111827" />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* KYC Status Banner */}
        {kycStatus !== 'approved' && (
          <TouchableOpacity
            style={[
              styles.kycBanner,
              kycStatus === 'rejected' && styles.kycBannerRejected,
              kycStatus === 'under_review' && styles.kycBannerReview,
            ]}
            onPress={() => router.push('/supplier/kyc')}
          >
            {kycStatus === 'approved' ? (
              <ShieldCheck size={20} color="#065F46" />
            ) : kycStatus === 'under_review' ? (
              <Clock size={20} color="#1E40AF" />
            ) : kycStatus === 'rejected' ? (
              <AlertCircle size={20} color="#991B1B" />
            ) : (
              <AlertCircle size={20} color="#92400E" />
            )}
            <View style={styles.kycBannerText}>
              <Text style={[
                styles.kycBannerTitle,
                kycStatus === 'rejected' && { color: '#991B1B' },
                kycStatus === 'under_review' && { color: '#1E40AF' },
              ]}>
                {kycStatus === 'under_review' ? 'KYC Under Review' : kycStatus === 'rejected' ? 'KYC Rejected — Resubmit' : 'Complete KYC Verification'}
              </Text>
              <Text style={[
                styles.kycBannerSub,
                kycStatus === 'rejected' && { color: '#991B1B' + 'AA' },
                kycStatus === 'under_review' && { color: '#1E40AFAA' },
              ]}>
                {kycStatus === 'under_review' ? 'Your documents are being reviewed' : kycStatus === 'rejected' ? 'Tap to view rejection reason and resubmit' : 'Upload documents to activate your account'}
              </Text>
            </View>
            <ChevronRight size={18} color={kycStatus === 'rejected' ? '#991B1B' : kycStatus === 'under_review' ? '#1E40AF' : '#92400E'} />
          </TouchableOpacity>
        )}

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeTitle}>Hello, {profile?.full_name?.split(' ')[0] || 'Supplier'}!</Text>
            <Text style={styles.welcomeSubtitle}>Here's what's happening today</Text>
          </View>
          <View style={styles.avatarContainer}>
            <User size={24} color="#FFF" />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#E0F2FE' }]}>
              <View style={styles.statIconWrapper}>
                <DollarSign size={20} color="#0284C7" />
              </View>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>${data.totalRevenue.toFixed(0)}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
                <ShoppingCart size={20} color="#16A34A" />
              </View>
              <Text style={styles.statLabel}>Orders</Text>
              <Text style={styles.statValue}>{data.totalOrders}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(147, 51, 234, 0.1)' }]}>
                <TrendingUp size={20} color="#9333EA" />
              </View>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{data.pendingOrders}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFEDD5' }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(234, 88, 12, 0.1)' }]}>
                <Package size={20} color="#EA580C" />
              </View>
              <Text style={styles.statLabel}>Products</Text>
              <Text style={styles.statValue}>{data.totalProducts}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Manage Business</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/supplier/products')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Package size={24} color="#4F46E5" />
            </View>
            <Text style={styles.actionTitle}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/supplier/orders')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
              <ShoppingCart size={24} color="#059669" />
            </View>
            <Text style={styles.actionTitle}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => { /* Navigate to analytics */ }}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
              <TrendingUp size={24} color="#DC2626" />
            </View>
            <Text style={styles.actionTitle}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => { /* Navigate to settings */ }}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3F4F6' }]}>
              <Settings size={24} color="#4B5563" />
            </View>
            <Text style={styles.actionTitle}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/supplier/orders')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ordersList}>
          {data.recentOrders.length > 0 ? (
            data.recentOrders.map((order) => (
              <TouchableOpacity key={order.id} style={styles.orderItem}>
                <View style={styles.orderIcon}>
                  <ShoppingCart size={20} color="#6B7280" />
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>Order #{order.order_number}</Text>
                  <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.orderMeta}>
                  <Text style={[styles.statusBadge, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent activity</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      {/* Side Menu Drawer */}
      <Animated.View style={[styles.sideMenu, { transform: [{ translateX: menuAnim }] }]}>
        <View style={styles.menuHeader}>
          <View style={styles.menuProfile}>
            <View style={styles.menuAvatar}>
              <Text style={styles.menuAvatarText}>{profile?.full_name?.charAt(0) || 'S'}</Text>
            </View>
            <View>
              <Text style={styles.menuName}>{profile?.full_name || 'Supplier'}</Text>
              <Text style={styles.menuRole}>Supplier Account</Text>
            </View>
          </View>
          <TouchableOpacity onPress={toggleMenu}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.menuItems}>
          <Text style={styles.menuSectionTitle}>Main</Text>
          <TouchableOpacity style={styles.menuRow} onPress={() => { toggleMenu(); }}>
            <View style={styles.menuRowLeft}>
              <Store size={20} color="#4B5563" />
              <Text style={styles.menuRowText}>Dashboard</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => { toggleMenu(); router.push('/supplier/products'); }}>
            <View style={styles.menuRowLeft}>
              <Package size={20} color="#4B5563" />
              <Text style={styles.menuRowText}>Products</Text>
            </View>
            <ChevronRight size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => { toggleMenu(); router.push('/supplier/orders'); }}>
            <View style={styles.menuRowLeft}>
              <ShoppingCart size={20} color="#4B5563" />
              <Text style={styles.menuRowText}>Orders</Text>
            </View>
            <ChevronRight size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => { toggleMenu(); router.push('/supplier/kyc'); }}>
            <View style={styles.menuRowLeft}>
              <ShieldCheck size={20} color={kycStatus === 'approved' ? '#10B981' : kycStatus === 'rejected' ? '#EF4444' : '#4B5563'} />
              <Text style={styles.menuRowText}>KYC Verification</Text>
            </View>
            <View style={styles.menuRowRight}>
              {kycStatus !== 'approved' && kycStatus !== 'under_review' && (
                <View style={styles.kycBadge} />
              )}
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <Text style={styles.menuSectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <User size={20} color="#4B5563" />
              <Text style={styles.menuRowText}>Profile</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <Settings size={20} color="#4B5563" />
              <Text style={styles.menuRowText}>Business Settings</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <HelpCircle size={20} color="#4B5563" />
              <Text style={styles.menuRowText}>Help & Support</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <FileText size={20} color="#4B5563" />
              <Text style={styles.menuRowText}>Terms & Policy</Text>
            </View>
          </TouchableOpacity>

        </ScrollView>

        <View style={styles.menuFooter}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return '#10B981';
    case 'shipped': return '#007AFF';
    case 'processing': return '#F59E0B';
    case 'cancelled': return '#EF4444';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  // Content
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stats
  statsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  // Action Grid
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  // Recent Orders
  ordersList: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  orderDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
  },
  // Side Menu
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.8,
    backgroundColor: '#FFF',
    zIndex: 101,
    paddingTop: 50,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuAvatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  menuName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  menuRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuRowText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  kycBannerRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  kycBannerReview: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  kycBannerText: {
    flex: 1,
  },
  kycBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  kycBannerSub: {
    fontSize: 12,
    color: '#92400EAA',
    marginTop: 2,
  },
  kycBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
