import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ShoppingCart, Store, MapPin, Star, Package, Minus, Plus, Tag } from 'lucide-react-native';

interface Product {
  id: string;
  name: string;
  description: string;
  b2c_price: number;
  b2b_price: number | null;
  currency: string;
  stock_quantity: number;
  category_id: string;
  supplier_id: string;
  categories: { name: string };
  suppliers: {
    business_name: string;
    user_id: string;
    profiles: { address: any };
  };
  product_images: Array<{ image_url: string; is_primary: boolean }>;
}

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          suppliers(business_name, user_id, profiles(address)),
          product_images(image_url, is_primary, display_order)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      setProduct(data);
      if (data) setQuantity(1);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = () => {
    if (!product) return 0;
    if (profile?.role === 'b2b' && product.b2b_price) return product.b2b_price;
    return product.b2c_price;
  };

  const getImages = () => {
    if (!product?.product_images?.length) return [];
    const sorted = [...product.product_images].sort((a, b) =>
      a.is_primary ? -1 : b.is_primary ? 1 : 0
    );
    return sorted;
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setAddingToCart(true);
    try {
      const { data: existingItem } = await supabase
        .from('cart_items').select('*')
        .eq('user_id', user.id).eq('product_id', id).maybeSingle();

      if (existingItem) {
        await supabase.from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);
      } else {
        await supabase.from('cart_items').insert({
          user_id: user.id, product_id: id, quantity, price: getPrice(),
        });
      }
      router.push('/(tabs)/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Package size={48} color="#CBD5E1" />
        <Text style={styles.notFoundText}>Product not found</Text>
      </View>
    );
  }

  const images = getImages();
  const price = getPrice();
  const isB2B = profile?.role === 'b2b' && product.b2b_price;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 10;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.headerBtn}>
          <ShoppingCart size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[selectedImageIdx]?.image_url }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Package size={64} color="#CBD5E1" />
            </View>
          )}
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll} contentContainerStyle={styles.thumbContent}>
              {images.map((img, idx) => (
                <TouchableOpacity key={idx} onPress={() => setSelectedImageIdx(idx)} style={[styles.thumb, idx === selectedImageIdx && styles.thumbActive]}>
                  <Image source={{ uri: img.image_url }} style={styles.thumbImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{product.categories?.name}</Text>
            </View>
            {isLowStock && (
              <View style={styles.lowStockPill}>
                <Text style={styles.lowStockPillText}>Only {product.stock_quantity} left</Text>
              </View>
            )}
            {product.stock_quantity === 0 && (
              <View style={styles.outOfStockPill}>
                <Text style={styles.outOfStockPillText}>Out of Stock</Text>
              </View>
            )}
          </View>

          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={[styles.mainPrice, isB2B && styles.mainPriceB2B]}>
              ${price.toFixed(2)}
            </Text>
            {isB2B && (
              <View style={styles.wholesaleTag}>
                <Tag size={12} color="#059669" />
                <Text style={styles.wholesaleTagText}>Wholesale Price</Text>
              </View>
            )}
            {isB2B && product.b2b_price && (
              <Text style={styles.originalPrice}>
                ${product.b2c_price.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.supplierCard}>
            <View style={styles.supplierHeader}>
              <View style={styles.supplierIconWrap}>
                <Store size={18} color="#1D4ED8" />
              </View>
              <View style={styles.supplierInfo}>
                <Text style={styles.supplierName}>{product.suppliers?.business_name}</Text>
                {product.suppliers?.profiles?.address?.city && (
                  <View style={styles.locationRow}>
                    <MapPin size={12} color="#94A3B8" />
                    <Text style={styles.locationText}>
                      {product.suppliers.profiles.address.city}
                      {product.suppliers.profiles.address.country ? `, ${product.suppliers.profiles.address.country}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Package size={16} color="#1D4ED8" />
              <Text style={styles.statValue}>{product.stock_quantity}</Text>
              <Text style={styles.statLabel}>In Stock</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ShoppingCart size={16} color="#059669" />
              <Text style={styles.statValue}>120+</Text>
              <Text style={styles.statLabel}>Sold</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {product.description || 'No description available for this product.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={18} color={quantity <= 1 ? '#CBD5E1' : '#111827'} />
              </TouchableOpacity>
              <View style={styles.qtyDisplay}>
                <Text style={styles.qtyValue}>{quantity}</Text>
              </View>
              <TouchableOpacity
                style={[styles.qtyBtn, quantity >= product.stock_quantity && styles.qtyBtnDisabled]}
                onPress={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                disabled={quantity >= product.stock_quantity}
              >
                <Plus size={18} color={quantity >= product.stock_quantity ? '#CBD5E1' : '#111827'} />
              </TouchableOpacity>
              <Text style={styles.qtyMax}>of {product.stock_quantity} available</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalAmount}>${(price * quantity).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, (addingToCart || product.stock_quantity === 0) && styles.addToCartBtnDisabled]}
          onPress={handleAddToCart}
          disabled={addingToCart || product.stock_quantity === 0}
        >
          {addingToCart ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <ShoppingCart size={20} color="#FFF" />
              <Text style={styles.addToCartBtnText}>
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  notFoundText: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 58, paddingBottom: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' },
  content: { flex: 1 },
  imageSection: { backgroundColor: '#FFF' },
  mainImage: { width: '100%', height: 320, backgroundColor: '#F1F5F9' },
  imagePlaceholder: {
    width: '100%', height: 320, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  thumbScroll: { backgroundColor: '#FFF', maxHeight: 70 },
  thumbContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  thumb: {
    width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: { borderColor: '#1D4ED8' },
  thumbImage: { width: '100%', height: '100%' },
  detailsContainer: { padding: 20 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  categoryPill: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#DBEAFE',
  },
  categoryPillText: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  lowStockPill: {
    backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A',
  },
  lowStockPillText: { fontSize: 12, fontWeight: '600', color: '#D97706' },
  outOfStockPill: {
    backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#FECACA',
  },
  outOfStockPillText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  productName: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.3, marginBottom: 12, lineHeight: 28 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  mainPrice: { fontSize: 30, fontWeight: '800', color: '#1D4ED8' },
  mainPriceB2B: { color: '#059669' },
  wholesaleTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  wholesaleTagText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  originalPrice: { fontSize: 16, color: '#94A3B8', textDecorationLine: 'line-through' },
  supplierCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  supplierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supplierIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  supplierInfo: { flex: 1 },
  supplierName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 12, color: '#94A3B8' },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 14,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  statDivider: { width: 1, backgroundColor: '#F1F5F9' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 24, color: '#4B5563' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  qtyBtnDisabled: { borderColor: '#F1F5F9', backgroundColor: '#F8FAFC' },
  qtyDisplay: {
    width: 56, height: 44, borderRadius: 12,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  qtyValue: { fontSize: 18, fontWeight: '800', color: '#1D4ED8' },
  qtyMax: { fontSize: 12, color: '#94A3B8', flex: 1 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 16,
    paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#F1F5F9',
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  footerTotal: { gap: 2 },
  footerTotalLabel: { fontSize: 12, color: '#94A3B8' },
  footerTotalAmount: { fontSize: 22, fontWeight: '800', color: '#111827' },
  addToCartBtn: {
    flex: 1, backgroundColor: '#1D4ED8',
    paddingVertical: 16, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  addToCartBtnDisabled: { backgroundColor: '#94A3B8' },
  addToCartBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
