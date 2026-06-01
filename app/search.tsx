import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { X, Search as SearchIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

type Product = {
  id: string;
  name: string;
  slug: string;
  b2c_price: number;
  b2b_price: number | null;
  currency: string;
  stock_quantity: number;
  is_featured: boolean;
  product_images: Array<{ image_url: string; is_primary: boolean }>;
};

export default function SearchScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delaySearch = setTimeout(() => { searchProducts(); }, 500);
      return () => clearTimeout(delaySearch);
    } else {
      setProducts([]);
      setSearched(false);
    }
  }, [searchQuery]);

  const searchProducts = async () => {
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from('products')
      .select('*, product_images(image_url, is_primary, display_order)')
      .eq('is_active', true)
      .ilike('name', `%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(20);
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

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUrl = getProductImage(item);
    return (
      <TouchableOpacity
        style={[styles.productCard, language.rtl && { flexDirection: 'row-reverse' }]}
        onPress={() => router.push(`/product/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.productImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.placeholderText}>{t.noImage}</Text>
            </View>
          )}
        </View>
        <View style={[styles.productInfo, language.rtl && { alignItems: 'flex-end' }]}>
          <Text style={[styles.productName, language.rtl && { textAlign: 'right' }]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={[styles.priceRow, language.rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.productPrice}>
              {item.currency} {getPrice(item).toFixed(2)}
            </Text>
            {profile?.role === 'b2b' && item.b2b_price && (
              <View style={styles.b2bBadge}>
                <Text style={styles.b2bBadgeText}>{t.wholesaleRole}</Text>
              </View>
            )}
          </View>
          {item.stock_quantity < 10 && item.stock_quantity > 0 && (
            <Text style={[styles.lowStockText, language.rtl && { textAlign: 'right' }]}>
              {t.onlyLeft.replace('{count}', item.stock_quantity.toString())}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
      <View style={[styles.header, language.rtl && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.searchContainer, language.rtl && { flexDirection: 'row-reverse' }]}>
          <SearchIcon size={20} color={Colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, language.rtl && { textAlign: 'right' }]}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>{t.cancel}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : searched ? (
        products.length > 0 ? (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <SearchIcon size={48} color={Colors.border.dark} />
            <Text style={styles.emptyText}>{t.noProductsFound}</Text>
            <Text style={styles.emptySubtext}>{t.tryDifferentKeywords}</Text>
          </View>
        )
      ) : (
        <View style={styles.emptyContainer}>
          <SearchIcon size={48} color={Colors.border.dark} />
          <Text style={styles.emptyText}>{t.searchForProducts}</Text>
          <Text style={styles.emptySubtext}>{t.enterAtLeast2Chars}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    backgroundColor: Colors.background.secondary,
    paddingTop: 60, paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border.medium,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background.primary, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.text.primary },
  cancelButton: { paddingVertical: 8 },
  cancelText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.primary },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, gap: 10, backgroundColor: Colors.background.primary,
  },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text.primary, marginTop: 8 },
  emptySubtext: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center' },
  listContainer: { padding: 16 },
  productCard: {
    backgroundColor: Colors.background.secondary, borderRadius: 14, marginBottom: 12,
    overflow: 'hidden', flexDirection: 'row',
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  productImageContainer: { width: 100, height: 100 },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: {
    width: '100%', height: '100%', backgroundColor: Colors.background.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  placeholderText: { fontSize: 10, color: Colors.text.tertiary },
  productInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  productName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productPrice: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  b2bBadge: {
    backgroundColor: Colors.primaryDark, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  b2bBadgeText: { fontSize: 10, fontWeight: '600', color: '#ffffff' },
  lowStockText: { fontSize: 11, color: Colors.error, marginTop: 4 },
});
