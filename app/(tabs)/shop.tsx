import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, ScrollView, TextInput
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Star, ShoppingCart, Search, SlidersHorizontal, Zap } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

type Product = {
  id: string;
  name: string;
  slug: string;
  b2c_price: number;
  b2b_price: number | null;
  currency: string;
  stock_quantity: number;
  is_featured: boolean;
  category_id: string;
  moq: number;
  product_images: Array<{ image_url: string; is_primary: boolean }>;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function ShopScreen() {
  const { profile } = useAuth();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('display_order');
    if (data) setCategories(data);
  };

  const fetchProducts = async (categoryId: string) => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, product_images(image_url, is_primary, display_order)')
      .eq('is_active', true);
    if (categoryId !== 'all') query = query.eq('category_id', categoryId);
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setProducts(data as any);
    setLoading(false);
  };

  const getPrice = (product: Product) => {
    if (profile?.role === 'b2b' && product.b2b_price) return product.b2b_price;
    return product.b2c_price;
  };

  const getProductImage = (product: Product) => {
    const primary = product.product_images?.find(img => img.is_primary);
    return primary?.image_url || product.product_images?.[0]?.image_url;
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUrl = getProductImage(item);
    const price = getPrice(item);
    const isB2B = profile?.role === 'b2b' && item.b2b_price;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}`)}
        activeOpacity={0.92}
      >
        <View style={styles.productImageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <ShoppingCart size={28} color="#CBD5E1" />
            </View>
          )}
          {item.is_featured && (
            <View style={styles.featuredBadge}>
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.featuredText}>Top Pick</Text>
            </View>
          )}
          {item.stock_quantity === 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Sold Out</Text>
            </View>
          )}
          {item.stock_quantity > 0 && item.stock_quantity < 10 && (
            <View style={styles.lowStockBadge}>
              <Zap size={9} color="#EF4444" />
              <Text style={styles.lowStockBadgeText}>Only {item.stock_quantity}</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, isB2B && styles.b2bPrice]}>
              ${price.toFixed(2)}
            </Text>
            {isB2B && (
              <View style={styles.wholesaleBadge}>
                <Text style={styles.wholesaleBadgeText}>Wholesale</Text>
              </View>
            )}
          </View>
          {isB2B && item.moq > 1 && (
            <Text style={styles.moqText}>Min. order: {item.moq} units</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Shop</Text>
            <Text style={styles.headerSub}>{filtered.length} products</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.filterBtn}>
              <SlidersHorizontal size={18} color="#1D4ED8" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : filtered.length > 0 ? (
        <FlatList
          data={filtered}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <ShoppingCart size={56} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySub}>Try a different category or search</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  filterBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFC', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  filterScroll: { backgroundColor: '#FFF', maxHeight: 52 },
  filterContent: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#94A3B8' },
  listContainer: { padding: 16, paddingBottom: 32 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  productCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9',
  },
  productImageWrap: { position: 'relative' },
  productImage: { width: '100%', height: 170 },
  productImagePlaceholder: {
    width: '100%', height: 170, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A',
  },
  featuredText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  outOfStockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center',
  },
  outOfStockText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  lowStockBadge: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEF2F2', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, borderColor: '#FECACA',
  },
  lowStockBadgeText: { fontSize: 9, fontWeight: '700', color: '#EF4444' },
  productInfo: { padding: 12, gap: 6 },
  productName: { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  productPrice: { fontSize: 16, fontWeight: '800', color: '#1D4ED8' },
  b2bPrice: { color: '#059669' },
  wholesaleBadge: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  wholesaleBadgeText: { fontSize: 9, fontWeight: '700', color: '#059669' },
  moqText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
});
