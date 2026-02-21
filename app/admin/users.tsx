import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView, Modal, Alert, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Search, Users, ShoppingBag, Building2, User,
  Mail, Calendar, ChevronDown, RefreshCw, Shield
} from 'lucide-react-native';

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  company_name: string | null;
  phone: string | null;
  created_at: string;
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  customer: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  b2b: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  supplier: { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
  admin: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
};

const ROLE_ICONS: Record<string, any> = {
  customer: User,
  b2b: Building2,
  supplier: ShoppingBag,
  admin: Shield,
};

const ALL_ROLES = ['customer', 'b2b', 'supplier', 'admin'];

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ customers: 0, b2b: 0, suppliers: 0, admins: 0, total: 0 });
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, role, company_name, phone, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (filter !== 'all') query = query.eq('role', filter);

    const { data } = await query;
    const profiles = (data || []) as UserProfile[];
    setUsers(profiles);

    const allRes = await supabase.from('profiles').select('role');
    const all = allRes.data || [];
    setStats({
      total: all.length,
      customers: all.filter((p) => p.role === 'customer').length,
      b2b: all.filter((p) => p.role === 'b2b').length,
      suppliers: all.filter((p) => p.role === 'supplier').length,
      admins: all.filter((p) => p.role === 'admin').length,
    });

    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (newRole === 'admin') {
      Alert.alert(
        'Grant Admin Access',
        'Are you sure you want to grant admin privileges to this user?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Admin', style: 'destructive', onPress: () => doRoleChange(userId, newRole) },
        ]
      );
    } else {
      doRoleChange(userId, newRole);
    }
  };

  const doRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (!error) {
      setSelectedUser(null);
      setShowRoleModal(false);
      fetchUsers();
    } else {
      Alert.alert('Error', error.message);
    }
    setUpdatingRole(false);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.company_name?.toLowerCase().includes(q)
    );
  });

  const filterTabs = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'customer', label: 'Customers', count: stats.customers },
    { key: 'b2b', label: 'B2B', count: stats.b2b },
    { key: 'supplier', label: 'Suppliers', count: stats.suppliers },
    { key: 'admin', label: 'Admins', count: stats.admins },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total, color: '#111827', bg: '#F9FAFB' },
          { label: 'Customers', value: stats.customers, color: '#065F46', bg: '#ECFDF5' },
          { label: 'B2B', value: stats.b2b, color: '#1E40AF', bg: '#EFF6FF' },
          { label: 'Suppliers', value: stats.suppliers, color: '#5B21B6', bg: '#F5F3FF' },
          { label: 'Admins', value: stats.admins, color: '#991B1B', bg: '#FEF2F2' },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabCount, filter === tab.key && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, filter === tab.key && styles.tabCountTextActive]}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#1E40AF" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const roleStyle = ROLE_COLORS[item.role] || ROLE_COLORS.customer;
            const RoleIcon = ROLE_ICONS[item.role] || User;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => setSelectedUser(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.avatar, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
                    <RoleIcon size={18} color={roleStyle.text} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.full_name || 'Unknown User'}</Text>
                    <View style={styles.emailRow}>
                      <Mail size={11} color="#9CA3AF" />
                      <Text style={styles.email}>{item.email}</Text>
                    </View>
                    {item.company_name && (
                      <Text style={styles.company}>{item.company_name}</Text>
                    )}
                    <View style={styles.joinedRow}>
                      <Calendar size={11} color="#9CA3AF" />
                      <Text style={styles.joined}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
                    <Text style={[styles.roleText, { color: roleStyle.text }]}>{item.role}</Text>
                  </View>
                  <ChevronDown size={14} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={!!selectedUser} animationType="slide" transparent onRequestClose={() => setSelectedUser(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            {selectedUser && (
              <>
                <Text style={styles.sheetTitle}>Change Role</Text>
                <View style={styles.userCard}>
                  <View style={[styles.sheetAvatar, { backgroundColor: ROLE_COLORS[selectedUser.role]?.bg || '#F3F4F6' }]}>
                    <Text style={[styles.sheetAvatarText, { color: ROLE_COLORS[selectedUser.role]?.text || '#6B7280' }]}>
                      {selectedUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.sheetUserName}>{selectedUser.full_name || 'Unknown'}</Text>
                    <Text style={styles.sheetUserEmail}>{selectedUser.email}</Text>
                  </View>
                </View>
                <Text style={styles.sheetSubtitle}>Select new role:</Text>
                <View style={styles.roleOptions}>
                  {ALL_ROLES.map((role) => {
                    const rs = ROLE_COLORS[role];
                    const RIcon = ROLE_ICONS[role];
                    const isCurrentRole = selectedUser.role === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleOption,
                          { borderColor: isCurrentRole ? rs.text : '#E5E7EB' },
                          isCurrentRole && { backgroundColor: rs.bg },
                        ]}
                        onPress={() => !isCurrentRole && handleRoleChange(selectedUser.id, role)}
                        disabled={updatingRole || isCurrentRole}
                      >
                        <View style={[styles.roleOptionIcon, { backgroundColor: rs.bg }]}>
                          <RIcon size={18} color={rs.text} />
                        </View>
                        <View style={styles.roleOptionInfo}>
                          <Text style={[styles.roleOptionLabel, { color: isCurrentRole ? rs.text : '#111827' }]}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Text>
                          <Text style={styles.roleOptionDesc}>
                            {role === 'customer' ? 'Regular buyer' :
                             role === 'b2b' ? 'Business buyer with B2B prices' :
                             role === 'supplier' ? 'Product supplier' : 'Platform administrator'}
                          </Text>
                        </View>
                        {isCurrentRole && (
                          <View style={[styles.currentBadge, { backgroundColor: rs.text }]}>
                            <Text style={styles.currentBadgeText}>Current</Text>
                          </View>
                        )}
                        {updatingRole && !isCurrentRole && (
                          <ActivityIndicator size="small" color={rs.text} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedUser(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  refreshBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  statCard: {
    flex: 1, borderRadius: 10, padding: 8, alignItems: 'center',
  },
  statNum: { fontSize: 16, fontWeight: '800' },
  statLbl: { fontSize: 10, color: '#6B7280', marginTop: 2, textAlign: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  filterRow: { maxHeight: 52 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8, paddingTop: 4 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterTabActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#FFF' },
  tabCount: { backgroundColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  tabCountTextActive: { color: '#FFF' },
  list: { padding: 16, gap: 10 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 14, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  email: { fontSize: 12, color: '#6B7280' },
  company: { fontSize: 12, color: '#2563EB', marginTop: 2, fontWeight: '500' },
  joinedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  joined: { fontSize: 11, color: '#9CA3AF' },
  cardRight: { alignItems: 'center', gap: 4 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB',
    alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 16,
  },
  sheetAvatar: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetAvatarText: { fontSize: 20, fontWeight: '800' },
  sheetUserName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sheetUserEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  sheetSubtitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleOptions: { gap: 8, marginBottom: 16 },
  roleOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  roleOptionIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  roleOptionInfo: { flex: 1 },
  roleOptionLabel: { fontSize: 15, fontWeight: '700' },
  roleOptionDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  currentBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  currentBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  cancelBtn: {
    backgroundColor: '#F3F4F6', borderRadius: 14, padding: 15, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
