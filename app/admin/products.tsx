import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView, Alert, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, Package, Star, Eye, EyeOff, RefreshCw, TrendingDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

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
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
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
      <View style={styles.fixedTopSection}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/admin')}
            style={styles.backBtn}
          >
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Catalog</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
            <RefreshCw size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={18} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or suppliers..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={Colors.text.tertiary}
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
      </View>

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
                <View style={[styles.stockRow, { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }]}>
                  <Text style={[styles.stockText, item.stock_quantity < 10 && styles.lowStockText]}>
                    Stock Status: <Text style={{ fontWeight: '700' }}>{item.stock_quantity}</Text> {item.stock_quantity < 10 ? '(Low Stock!)' : ''}
                  </Text>
                </View>

                <View style={styles.buttonActionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, item.is_featured && styles.featuredActive]}
                    onPress={() => toggleFeatured(item)}
                  >
                    <Star size={16} color={item.is_featured ? '#FFF' : '#F59E0B'} fill={item.is_featured ? '#FFF' : 'transparent'} />
                    <Text style={[styles.actionBtnText, item.is_featured && styles.textWhite]}>
                      {item.is_featured ? 'Featured' : 'Mark Featured'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, item.is_active ? styles.statusActive : styles.statusInactive]}
                    onPress={() => toggleActive(item)}
                  >
                    {item.is_active ? <Eye size={16} color="#FFF" /> : <EyeOff size={16} color="#FFF" />}
                    <Text style={[styles.actionBtnText, styles.textWhite]}>
                      {item.is_active ? 'Active' : 'Hidden'}
                    </Text>
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

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.primary },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  fixedTopSection: {
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1, borderBottomColor: Colors.border.medium, zIndex: 10,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.background.secondary,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary, flex: 1, textAlign: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background.primary, marginHorizontal: 16, marginTop: 12, marginBottom: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text.primary },
  filterRow: { maxHeight: 48 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.background.primary, borderWidth: 1, borderColor: Colors.border.medium,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontSize: 13, fontWeight: '600', color: Colors.text.tertiary },
  filterTabTextActive: { color: '#FFF' },
  list: { padding: 20, gap: 12 },
  emptyText: { textAlign: 'center', color: Colors.text.tertiary, marginTop: 40 },
  card: {
    backgroundColor: Colors.background.secondary, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.background.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  cardSupplier: { fontSize: 13, color: Colors.primary, marginTop: 2 },
  cardCategory: { fontSize: 12, color: Colors.text.tertiary, marginTop: 1 },
  priceCol: { alignItems: 'flex-end' },
  b2cPrice: { fontSize: 15, fontWeight: '800', color: Colors.text.primary },
  b2bPrice: { fontSize: 12, fontWeight: '600', color: Colors.text.tertiary, marginTop: 2 },
  cardActions: { paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border.light },
  stockRow: { flexDirection: 'row', alignItems: 'center' },
  stockText: { fontSize: 13, color: Colors.text.tertiary },
  lowStockText: { color: Colors.error },
  buttonActionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 8 },
  actionBtn: {
    flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.background.primary,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  featuredActive: { backgroundColor: Colors.warning, borderColor: Colors.warning },
  statusActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  statusInactive: { backgroundColor: Colors.border.dark, borderColor: Colors.border.dark },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: Colors.text.tertiary },
  textWhite: { color: '#FFF' },
});
