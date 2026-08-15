import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, ScrollView, TextInput
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Star, ShoppingCart, Search, SlidersHorizontal, Zap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

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
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
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
            <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <ShoppingCart size={28} color="#CBD5E1" />
            </View>
          )}
          {item.is_featured && (
            <View style={styles.featuredBadge}>
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.featuredText}>{t.topPick}</Text>
            </View>
          )}
          {item.stock_quantity === 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>{t.soldOut}</Text>
            </View>
          )}
          {item.stock_quantity > 0 && item.stock_quantity < 10 && (
            <View style={styles.lowStockBadge}>
              <Zap size={9} color="#EF4444" />
              <Text style={styles.lowStockBadgeText}>{t.onlyLeft.replace('{count}', item.stock_quantity.toString())}</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, language.rtl && { textAlign: 'right' }]} numberOfLines={2}>
            {t[item.slug as keyof typeof t] || t[item.name as keyof typeof t] || item.name}
          </Text>
          <View style={[styles.priceRow, language.rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.productPrice, !!isB2B ? styles.b2bPrice : null]}>
              {formatPrice(price)}
            </Text>
            {!!isB2B && (
              <View style={styles.wholesaleBadge}>
                <Text style={styles.wholesaleBadgeText}>{t.wholesaleRole}</Text>
              </View>
            )}
          </View>
          {!!isB2B && item.moq > 1 && (
            <Text style={[styles.moqText, language.rtl && { textAlign: 'right' }]}>{t.minOrder.replace('{count}', item.moq.toString())}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{t.shop}</Text>
            <Text style={styles.headerSub}>{filtered.length} {t.products.toLowerCase()}</Text>
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
            style={[styles.searchInput, language.rtl && { textAlign: 'right' }]}
            placeholder={t.searchPlaceholder}
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
            {t.all}
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>
              {t[cat.slug as keyof typeof t] || cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>{t.loadingProducts}</Text>
        </View>
      ) : filtered.length > 0 ? (
        <FlatList
          data={filtered}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={[styles.columnWrapper, language.rtl && { flexDirection: 'row-reverse' }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <ShoppingCart size={56} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>{t.noProductsFound}</Text>
          <Text style={styles.emptySub}>Try a different category or search</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    backgroundColor: Colors.background.secondary,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.medium,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: Colors.text.tertiary, marginTop: 2, fontWeight: '500' },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  filterBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.background.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text.primary, textAlignVertical: 'center' },
  filterScroll: { backgroundColor: Colors.background.secondary, maxHeight: 60, minHeight: 60 },
  filterContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 10, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.background.primary, borderWidth: 1, borderColor: Colors.border.medium,
  },
  filterChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.text.tertiary },
  filterChipTextActive: { color: '#FFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: Colors.background.primary },
  loadingText: { fontSize: 14, color: Colors.text.tertiary },
  listContainer: { padding: 16, paddingBottom: 32 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  productCard: {
    flex: 1, backgroundColor: Colors.background.secondary, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border.medium,
  },
  productImageWrap: { position: 'relative' },
  productImage: { width: '100%', height: 170 },
  productImagePlaceholder: {
    width: '100%', height: 170, backgroundColor: Colors.background.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.background.secondary, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.secondary,
  },
  featuredText: { fontSize: 10, fontWeight: '700', color: Colors.secondary },
  outOfStockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
  },
  outOfStockText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  lowStockBadge: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  lowStockBadgeText: { fontSize: 9, fontWeight: '700', color: '#EF4444' },
  productInfo: { padding: 12, gap: 6 },
  productName: { fontSize: 13, fontWeight: '600', color: Colors.text.primary, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  productPrice: { fontSize: 16, fontWeight: '800', color: Colors.secondary },
  b2bPrice: { color: Colors.secondary },
  wholesaleBadge: {
    backgroundColor: 'rgba(0, 168, 107, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  wholesaleBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.secondary },
  moqText: { fontSize: 10, color: Colors.text.tertiary, marginTop: 2 },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, gap: 10, backgroundColor: Colors.background.primary,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  emptySub: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center' },
});

