import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  User, Settings, FileText, CircleHelp, LogOut,
  Store, Truck, ChevronRight, ShieldCheck,
  Package, LayoutDashboard, ArrowRight
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          router.navigate('/(auth)/welcome');
          setTimeout(async () => { await signOut(); }, 50);
        },
      },
    ]);
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'b2b': return { label: 'Wholesale Customer', bg: '#EFF6FF', color: '#1D4ED8' };
      case 'supplier': return { label: 'Supplier', bg: '#FFFBEB', color: '#D97706' };
      case 'admin': return { label: 'Administrator', bg: '#FEF2F2', color: '#DC2626' };
      default: return { label: 'Customer', bg: '#ECFDF5', color: '#059669' };
    }
  };

  const getInitials = () => {
    const name = profile?.full_name || '';
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  };

  const AVATAR_COLORS = ['#1D4ED8', '#059669', '#D97706', '#DC2626', '#7C3AED'];
  const avatarColor = AVATAR_COLORS[(profile?.full_name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <View style={[styles.avatarCircle, { backgroundColor: '#475569' }]}>
              <User size={36} color="#FFF" />
            </View>
            <Text style={styles.guestName}>Guest User</Text>
            <Text style={styles.guestSub}>Not signed in</Text>
          </View>
        </View>
        <View style={styles.guestContent}>
          <View style={styles.guestCard}>
            <Text style={styles.guestCardTitle}>Join the Marketplace</Text>
            <Text style={styles.guestCardSub}>
              Sign in to access your orders, wishlist, and personalized experience
            </Text>
            <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInBtnText}>Sign In</Text>
              <ArrowRight size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.createBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const roleConfig = getRoleConfig(profile?.role || 'customer');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarInitials}>{getInitials()}</Text>
          </View>
          <Text style={styles.headerName}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.headerEmail}>{profile?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
            <Text style={[styles.roleBadgeText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon={<User size={20} color="#1D4ED8" />} iconBg="#EFF6FF" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
            <MenuItem icon={<Settings size={20} color="#059669" />} iconBg="#ECFDF5" label="Settings" onPress={() => router.push('/profile/settings')} border />
          </View>
        </View>

        {(profile?.role === 'supplier' || profile?.role === 'admin') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supplier Tools</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon={<LayoutDashboard size={20} color="#D97706" />} iconBg="#FFFBEB" label="Supplier Dashboard" onPress={() => router.push('/supplier/dashboard')} />
              <MenuItem icon={<Package size={20} color="#7C3AED" />} iconBg="#F5F3FF" label="Manage Products" onPress={() => router.push('/supplier/products')} border />
              <MenuItem icon={<Truck size={20} color="#059669" />} iconBg="#ECFDF5" label="Manage Orders" onPress={() => router.push('/supplier/orders')} border />
              <MenuItem icon={<ShieldCheck size={20} color="#DC2626" />} iconBg="#FEF2F2" label="KYC Verification" onPress={() => router.push('/supplier/kyc')} border />
            </View>
          </View>
        )}

        {profile?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon={<LayoutDashboard size={20} color="#DC2626" />} iconBg="#FEF2F2" label="Admin Dashboard" onPress={() => router.push('/admin')} />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon={<CircleHelp size={20} color="#64748B" />} iconBg="#F1F5F9" label="Help Center" onPress={() => {}} />
            <MenuItem icon={<FileText size={20} color="#64748B" />} iconBg="#F1F5F9" label="Terms & Conditions" onPress={() => {}} border />
            <MenuItem icon={<FileText size={20} color="#64748B" />} iconBg="#F1F5F9" label="Privacy Policy" onPress={() => {}} border />
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MenuItem({
  icon, iconBg, label, onPress, border
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  onPress: () => void;
  border?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, border && styles.menuItemBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#1E293B' },
  headerGradient: {
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  headerName: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.3 },
  headerEmail: { fontSize: 14, color: '#94A3B8' },
  roleBadge: {
    marginTop: 6, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700' },
  guestName: { fontSize: 22, fontWeight: '700', color: '#F8FAFC' },
  guestSub: { fontSize: 14, color: '#94A3B8' },
  guestContent: { flex: 1, padding: 20 },
  guestCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#F1F5F9', marginTop: 8,
  },
  guestCardTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  guestCardSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  signInBtn: {
    backgroundColor: '#1D4ED8', paddingVertical: 14,
    paddingHorizontal: 32, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    width: '100%', justifyContent: 'center', marginTop: 8,
  },
  signInBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  createBtn: {
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0', width: '100%',
    alignItems: 'center',
  },
  createBtnText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  content: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  menuGroup: {
    backgroundColor: '#FFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuItemBorder: {
    borderTopWidth: 1, borderTopColor: '#F8FAFC',
  },
  menuIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 24,
    padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#FEE2E2',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  versionText: { textAlign: 'center', marginTop: 20, fontSize: 12, color: '#CBD5E1' },
});
