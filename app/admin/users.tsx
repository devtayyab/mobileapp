import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, Users, ShoppingBag, Building2, User } from 'lucide-react-native';

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  company_name: string | null;
  created_at: string;
  order_count?: number;
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  customer: { bg: '#ECFDF5', text: '#065F46' },
  b2b: { bg: '#EFF6FF', text: '#1E40AF' },
  supplier: { bg: '#F5F3FF', text: '#5B21B6' },
  admin: { bg: '#FEF2F2', text: '#991B1B' },
};

const ROLE_ICONS: Record<string, any> = {
  customer: User,
  b2b: Building2,
  supplier: ShoppingBag,
  admin: Users,
};

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ customers: 0, b2b: 0, suppliers: 0, admins: 0 });

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, role, company_name, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter !== 'all') {
      query = query.eq('role', filter);
    }

    const { data } = await query;
    const profiles = data || [];
    setUsers(profiles as any);

    const all = await supabase
      .from('profiles')
      .select('role');

    const allProfiles = all.data || [];
    setStats({
      customers: allProfiles.filter((p) => p.role === 'customer').length,
      b2b: allProfiles.filter((p) => p.role === 'b2b').length,
      suppliers: allProfiles.filter((p) => p.role === 'supplier').length,
      admins: allProfiles.filter((p) => p.role === 'admin').length,
    });

    setLoading(false);
  };

  const filtered = users.filter((u) => {
    const name = u.full_name?.toLowerCase() || '';
    const email = u.email?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const filterTabs = [
    { key: 'all', label: 'All Users' },
    { key: 'customer', label: 'Customers' },
    { key: 'b2b', label: 'B2B' },
    { key: 'supplier', label: 'Suppliers' },
    { key: 'admin', label: 'Admin' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.customers}</Text>
          <Text style={styles.statLbl}>Customers</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
          <Text style={[styles.statNum, { color: '#1E40AF' }]}>{stats.b2b}</Text>
          <Text style={styles.statLbl}>B2B</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
          <Text style={[styles.statNum, { color: '#5B21B6' }]}>{stats.suppliers}</Text>
          <Text style={styles.statLbl}>Suppliers</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
          <Text style={[styles.statNum, { color: '#991B1B' }]}>{stats.admins}</Text>
          <Text style={styles.statLbl}>Admins</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
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
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1E40AF" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
          renderItem={({ item }) => {
            const roleStyle = ROLE_COLORS[item.role] || ROLE_COLORS.customer;
            const RoleIcon = ROLE_ICONS[item.role] || User;
            return (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={[styles.avatar, { backgroundColor: roleStyle.bg }]}>
                    <RoleIcon size={18} color={roleStyle.text} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.full_name || 'Unknown'}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    {item.company_name && (
                      <Text style={styles.company}>{item.company_name}</Text>
                    )}
                    <Text style={styles.joined}>Joined {new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                  <Text style={[styles.roleText, { color: roleStyle.text }]}>{item.role}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, gap: 10,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  statCard: {
    flex: 1, backgroundColor: '#ECFDF5', borderRadius: 12,
    padding: 10, alignItems: 'center',
  },
  statNum: { fontSize: 18, fontWeight: '800', color: '#065F46' },
  statLbl: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', marginHorizontal: 20, marginVertical: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  filterRow: { maxHeight: 48 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterTabActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#FFF' },
  list: { padding: 20, gap: 10 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  email: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  company: { fontSize: 12, color: '#3B82F6', marginTop: 1 },
  joined: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
});
