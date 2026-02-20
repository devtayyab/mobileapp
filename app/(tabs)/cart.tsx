import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react-native';

type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    b2c_price: number;
    b2b_price: number | null;
    currency: string;
    stock_quantity: number;
    product_images: Array<{ image_url: string; is_primary: boolean }>;
  };
};

export default function CartScreen() {
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCart();
    else setLoading(false);
  }, [user]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const { data: items, error } = await supabase
        .from('cart_items')
        .select(`
          id, product_id, quantity,
          products(id, name, b2c_price, b2b_price, currency, stock_quantity,
            product_images(image_url, is_primary, display_order))
        `)
        .eq('user_id', user?.id);
      if (error) throw error;
      if (items) setCartItems(items as any);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (item: CartItem) => {
    if (profile?.role === 'b2b' && item.products.b2b_price) return item.products.b2b_price;
    return item.products.b2c_price;
  };

  const getProductImage = (item: CartItem) => {
    const primary = item.products.product_images?.find(img => img.is_primary);
    return primary?.image_url || item.products.product_images?.[0]?.image_url;
  };

  const updateQuantity = async (itemId: string, newQty: number, maxStock: number) => {
    if (newQty < 1) return;
    if (newQty > maxStock) {
      Alert.alert('Stock Limit', `Only ${maxStock} units available`);
      return;
    }
    const { error } = await supabase.from('cart_items').update({ quantity: newQty }).eq('id', itemId);
    if (!error) setCartItems(cartItems.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
    if (!error) setCartItems(prev => prev.filter(i => i.id !== itemId));
  };

  const calculateTotal = () =>
    cartItems.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);

  const calculateSavings = () => {
    if (profile?.role !== 'b2b') return 0;
    return cartItems.reduce((sum, item) => {
      const savings = item.products.b2b_price
        ? (item.products.b2c_price - item.products.b2b_price) * item.quantity
        : 0;
      return sum + savings;
    }, 0);
  };

  const savings = calculateSavings();

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const imageUrl = getProductImage(item);
    const price = getPrice(item);

    return (
      <View style={styles.cartItem}>
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ShoppingBag size={22} color="#CBD5E1" />
            </View>
          )}
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>{item.products.name}</Text>
          <Text style={styles.itemPrice}>${price.toFixed(2)}</Text>
          <Text style={styles.itemSubtotal}>Subtotal: ${(price * item.quantity).toFixed(2)}</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.id, item.quantity - 1, item.products.stock_quantity)}
            >
              <Minus size={14} color="#374151" />
            </TouchableOpacity>
            <View style={styles.qtyNumWrap}>
              <Text style={styles.qtyNum}>{item.quantity}</Text>
            </View>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.id, item.quantity + 1, item.products.stock_quantity)}
            >
              <Plus size={14} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <ShoppingBag size={48} color="#1D4ED8" />
          </View>
          <Text style={styles.emptyTitle}>Sign in to view cart</Text>
          <Text style={styles.emptySub}>Login to add items and complete your purchase</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInBtnText}>Sign In</Text>
            <ArrowRight size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        {cartItems.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{cartItems.length}</Text>
          </View>
        )}
      </View>

      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.footer}>
            {savings > 0 && (
              <View style={styles.savingsRow}>
                <Tag size={14} color="#059669" />
                <Text style={styles.savingsText}>Wholesale savings: ${savings.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({cartItems.length} items)</Text>
              <Text style={styles.summaryValue}>${calculateTotal().toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
              <ArrowRight size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <ShoppingBag size={48} color="#1D4ED8" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Start adding items from the shop</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(tabs)/shop')}>
            <Text style={styles.signInBtnText}>Browse Shop</Text>
            <ArrowRight size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  countBadge: {
    backgroundColor: '#1D4ED8', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  countBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  listContainer: { padding: 20, gap: 14, paddingBottom: 8 },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  imageWrap: { borderRadius: 12, overflow: 'hidden' },
  itemImage: { width: 88, height: 88, borderRadius: 12 },
  imagePlaceholder: {
    width: 88, height: 88, backgroundColor: '#F8FAFC',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  itemPrice: { fontSize: 17, fontWeight: '800', color: '#1D4ED8' },
  itemSubtotal: { fontSize: 12, color: '#94A3B8' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  qtyNumWrap: {
    minWidth: 32, height: 30, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  qtyNum: { fontSize: 15, fontWeight: '700', color: '#111827' },
  deleteBtn: {
    justifyContent: 'flex-start', paddingTop: 2,
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  savingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ECFDF5', padding: 10, borderRadius: 10,
  },
  savingsText: { fontSize: 13, fontWeight: '600', color: '#059669' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  totalLabel: { fontSize: 17, fontWeight: '700', color: '#111827' },
  totalAmount: { fontSize: 24, fontWeight: '800', color: '#111827' },
  checkoutBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  checkoutBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, gap: 12,
  },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
  signInBtn: {
    backgroundColor: '#1D4ED8', paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
  },
  signInBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
