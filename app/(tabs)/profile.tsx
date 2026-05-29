import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, I18nManager, Modal, Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  User, Settings, FileText, CircleHelp, LogOut,
  Store, Truck, ChevronRight, ShieldCheck,
  Package, LayoutDashboard, ArrowRight
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const { t, language } = useLanguage();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setShowSignOutModal(false);
    console.log('Initiating sign out...');
    try {
      await signOut();
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'b2b': return { label: t.wholesaleCustomer, bg: '#EFF6FF', color: '#1D4ED8' };
      case 'supplier': return { label: t.supplier, bg: '#FFFBEB', color: '#D97706' };
      case 'admin': return { label: t.administrator, bg: '#FEF2F2', color: '#DC2626' };
      default: return { label: t.customerRole, bg: '#ECFDF5', color: '#059669' };
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
      <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <View style={[styles.avatarCircle, { backgroundColor: '#475569' }]}>
              <User size={36} color="#FFF" />
            </View>
            <Text style={styles.guestName}>{t.guestUser}</Text>
            <Text style={styles.guestSub}>{t.notSignedIn}</Text>
          </View>
        </View>
        <View style={styles.guestContent}>
          <View style={styles.guestCard}>
            <Text style={styles.guestCardTitle}>{t.welcome}</Text>
            <Text style={styles.guestCardSub}>{t.signInToAccess}</Text>
            <TouchableOpacity style={[styles.signInBtn, language.rtl && { flexDirection: 'row-reverse' }]} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInBtnText}>{t.signIn}</Text>
              <ArrowRight size={18} color="#FFF" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.createBtnText}>{t.createAccount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const roleConfig = getRoleConfig(profile?.role || 'customer');

  return (
    <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
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
          <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }]}>{t.account}</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon={<User size={20} color="#1D4ED8" />} iconBg="#EFF6FF" label={t.editProfile} onPress={() => router.push('/profile/edit')} rtl={language.rtl} />
            <MenuItem icon={<Settings size={20} color="#059669" />} iconBg="#ECFDF5" label={t.settings} onPress={() => router.push('/profile/settings')} border rtl={language.rtl} />
          </View>
        </View>

        {(profile?.role === 'supplier' || profile?.role === 'admin') && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }]}>{t.supplierTools}</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon={<LayoutDashboard size={20} color="#D97706" />} iconBg="#FFFBEB" label="Supplier Dashboard" onPress={() => router.push('/supplier/dashboard')} rtl={language.rtl} />
              <MenuItem icon={<Package size={20} color="#7C3AED" />} iconBg="#F5F3FF" label="Manage Products" onPress={() => router.push('/supplier/products')} border rtl={language.rtl} />
              <MenuItem icon={<Truck size={20} color="#059669" />} iconBg="#ECFDF5" label="Manage Orders" onPress={() => router.push('/supplier/orders')} border rtl={language.rtl} />
              <MenuItem icon={<ShieldCheck size={20} color="#DC2626" />} iconBg="#FEF2F2" label="KYC Verification" onPress={() => router.push('/supplier/kyc')} border rtl={language.rtl} />
            </View>
          </View>
        )}

        {profile?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }]}>{t.adminTools}</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon={<LayoutDashboard size={20} color="#DC2626" />} iconBg="#FEF2F2" label="Admin Dashboard" onPress={() => router.push('/admin')} rtl={language.rtl} />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }]}>{t.support}</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon={<CircleHelp size={20} color="#64748B" />} iconBg="#F1F5F9" label={t.helpCenter} onPress={() => {}} rtl={language.rtl} />
            <MenuItem icon={<FileText size={20} color="#64748B" />} iconBg="#F1F5F9" label={t.termsConditions} onPress={() => router.push('/terms')} border rtl={language.rtl} />
            <MenuItem icon={<FileText size={20} color="#64748B" />} iconBg="#F1F5F9" label={t.privacyPolicy} onPress={() => router.push('/privacy')} border rtl={language.rtl} />
          </View>
        </View>

        <TouchableOpacity style={[styles.signOutBtn, language.rtl && { flexDirection: 'row-reverse' }]} onPress={() => setShowSignOutModal(true)}>
          <LogOut size={18} color="#EF4444" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
          <Text style={styles.signOutText}>{t.signOut}</Text>
        </TouchableOpacity>

        {/* Custom Sign Out Modal */}
        <Modal
          visible={showSignOutModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSignOutModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowSignOutModal(false)}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconWrap}>
                <LogOut size={32} color="#EF4444" />
              </View>
              <Text style={styles.modalTitle}>{t.signOut}</Text>
              <Text style={styles.modalSub}>{t.signOutConfirm}</Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn} 
                  onPress={() => setShowSignOutModal(false)}
                >
                  <Text style={styles.modalCancelText}>{t.cancel}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalSignOutBtn} 
                  onPress={handleSignOut}
                >
                  <Text style={styles.modalSignOutText}>{t.signOut}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>

        <Text style={styles.versionText}>{t.version} 1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MenuItem({
  icon, iconBg, label, onPress, border, rtl
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  onPress: () => void;
  border?: boolean;
  rtl?: boolean;
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
      <ChevronRight size={18} color="#CBD5E1" style={rtl && { transform: [{ rotate: '180deg' }] }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { backgroundColor: Colors.background.secondary },
  headerGradient: {
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.medium,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3, borderColor: Colors.border.medium,
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  headerName: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.3 },
  headerEmail: { fontSize: 14, color: Colors.text.tertiary },
  roleBadge: {
    marginTop: 6, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700' },
  guestName: { fontSize: 22, fontWeight: '700', color: Colors.text.primary },
  guestSub: { fontSize: 14, color: Colors.text.tertiary },
  guestContent: { flex: 1, padding: 20 },
  guestCard: {
    backgroundColor: Colors.background.secondary, borderRadius: 24, padding: 24,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border.medium, marginTop: 8,
  },
  guestCardTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  guestCardSub: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  signInBtn: {
    backgroundColor: Colors.secondary, paddingVertical: 14,
    paddingHorizontal: 32, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    width: '100%', justifyContent: 'center', marginTop: 8,
  },
  signInBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  createBtn: {
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border.medium, width: '100%',
    alignItems: 'center',
  },
  createBtnText: { color: Colors.text.primary, fontSize: 16, fontWeight: '600' },
  content: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  menuGroup: {
    backgroundColor: Colors.background.secondary, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border.medium, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuItemBorder: {
    borderTopWidth: 1, borderTopColor: Colors.border.medium,
  },
  menuIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.background.secondary, marginHorizontal: 20, marginTop: 24,
    padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  versionText: { textAlign: 'center', marginTop: 20, fontSize: 12, color: Colors.text.tertiary },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background.secondary, borderRadius: 28, padding: 32,
    width: '100%', maxWidth: 340, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  modalIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary, marginBottom: 8 },
  modalSub: { 
    fontSize: 15, color: Colors.text.tertiary, textAlign: 'center', 
    lineHeight: 22, marginBottom: 24 
  },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border.medium, alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: Colors.text.tertiary },
  modalSignOutBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#EF4444', alignItems: 'center',
  },
  modalSignOutText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

