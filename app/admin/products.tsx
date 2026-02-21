import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView, Alert, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, Package, Star, Eye, EyeOff, RefreshCw, TrendingDown } from 'lucide-react-native';

type Product = {
  id: string;
  name: string;
  b2c_price: number;
  b2b_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  categories: { name: string } | null;
  suppliers: { business_name: string } | null;
};

export default function AdminProductsScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchProducts = useCallback(async () => {
    let query = supabase
      .from('products')
      .select(`
        id, name, b2c_price, b2b_price, stock_quantity, is_active, is_featured, created_at,
        categories (name),
        suppliers (business_name)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter === 'active') query = query.eq('is_active', true);
    else if (filter === 'inactive') query = query.eq('is_active', false);
    else if (filter === 'featured') query = query.eq('is_featured', true);
    else if (filter === 'low_stock') query = query.lt('stock_quantity', 10);

    const { data } = await query;
    setProducts((data as any) || []);
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  const toggleActive = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (!error) {
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
    } else {
      Alert.alert('Error', error.message);
    }
  };

  const toggleFeatured = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_featured: !product.is_featured })
      .eq('id', product.id);

    if (!error) {
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_featured: !p.is_featured } : p));
    } else {
      Alert.alert('Error', error.message);
    }
  };

  const filtered = products.filter((p) => {
    const name = p.name?.toLowerCase() || '';
    const supplier = (p.suppliers as any)?.business_name?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || supplier.includes(q);
  });

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'featured', label: 'Featured' },
    { key: 'low_stock', label: 'Low Stock' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Catalog</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <RefreshCw size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products or suppliers..."
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
              <Package size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardIconWrap}>
                  <Package size={20} color="#6B7280" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardSupplier}>{(item.suppliers as any)?.business_name || 'Unknown Supplier'}</Text>
                  <Text style={styles.cardCategory}>{(item.categories as any)?.name || 'Uncategorized'}</Text>
                </View>
                <View style={styles.priceCol}>
                  <Text style={styles.b2cPrice}>${item.b2c_price?.toFixed(2)}</Text>
                  {item.b2b_price && (
                    <Text style={styles.b2bPrice}>B2B ${item.b2b_price?.toFixed(2)}</Text>
                  )}
                </View>
              </View>

              <View style={styles.cardActions}>
                <Text style={[styles.stockText, item.stock_quantity < 10 && styles.lowStockText]}>
                  Stock: {item.stock_quantity} {item.stock_quantity < 10 ? '(Low)' : ''}
                </Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, item.is_featured && styles.toggleBtnActive]}
                    onPress={() => toggleFeatured(item)}
                  >
                    <Star size={14} color={item.is_featured ? '#FFF' : '#6B7280'} />
                    <Text style={[styles.toggleBtnText, item.is_featured && styles.toggleBtnTextActive]}>
                      {item.is_featured ? 'Featured' : 'Feature'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, item.is_active ? styles.toggleBtnGreen : styles.toggleBtnRed]}
                    onPress={() => toggleActive(item)}
                  >
                    {item.is_active ? <Eye size={14} color="#FFF" /> : <EyeOff size={14} color="#FFF" />}
                    <Text style={styles.toggleBtnTextWhite}>{item.is_active ? 'Active' : 'Hidden'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
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
  list: { padding: 20, gap: 12 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSupplier: { fontSize: 13, color: '#3B82F6', marginTop: 2 },
  cardCategory: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  priceCol: { alignItems: 'flex-end' },
  b2cPrice: { fontSize: 15, fontWeight: '800', color: '#111827' },
  b2bPrice: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 2 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  stockText: { fontSize: 13, color: '#6B7280' },
  lowStockText: { color: '#EF4444', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  toggleBtnActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  toggleBtnGreen: { backgroundColor: '#10B981', borderColor: '#10B981' },
  toggleBtnRed: { backgroundColor: '#6B7280', borderColor: '#6B7280' },
  toggleBtnText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  toggleBtnTextActive: { color: '#FFF' },
  toggleBtnTextWhite: { fontSize: 12, fontWeight: '600', color: '#FFF' },
});
