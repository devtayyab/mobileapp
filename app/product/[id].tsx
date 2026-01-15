import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ShoppingCart, Store, MapPin, Star } from 'lucide-react-native';

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
  categories: {
    name: string;
  };
  suppliers: {
    business_name: string;
    user_id: string;
    profiles: {
      address: any;
    };
  };
  product_images: Array<{
    image_url: string;
    is_primary: boolean;
  }>;
}

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

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
          suppliers(
            business_name,
            user_id,
            profiles(address)
          ),
          product_images(
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setProduct(data);

      if (data) {
        setQuantity(1);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = () => {
    if (!product) return 0;
    if (profile?.role === 'b2b' && product.b2b_price) {
      return product.b2b_price;
    }
    return product.b2c_price;
  };

  const getProductImage = () => {
    if (!product) return null;
    const primaryImage = product.product_images?.find(img => img.is_primary);
    return primaryImage?.image_url || product.product_images?.[0]?.image_url;
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    setAddingToCart(true);
    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: id,
            quantity: quantity,
            price : getPrice(),
          });

        if (error) throw error;
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.cartButton}>
          <ShoppingCart size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {getProductImage() && (
          <Image
            source={{ uri: getProductImage()! }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <View style={styles.details}>
          <Text style={styles.category}>{product.categories?.name}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>
            {product.currency} {getPrice().toFixed(2)}
            {profile?.role === 'b2b' && product.b2b_price && (
              <Text style={styles.priceBadge}> Wholesale Price</Text>
            )}
          </Text>

          <View style={styles.supplierCard}>
            <View style={styles.supplierHeader}>
              <Store size={20} color="#666" />
              <Text style={styles.supplierName}>{product.suppliers?.business_name}</Text>
            </View>
            {product.suppliers?.profiles?.address?.street && (
              <View style={styles.supplierLocation}>
                <MapPin size={16} color="#999" />
                <Text style={styles.supplierAddress}>
                  {product.suppliers.profiles.address.street}, {product.suppliers.profiles.address.city}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>In Stock</Text>
              <Text style={styles.infoValue}>{product.stock_quantity} units</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description || 'No description available'}</Text>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.quantityButton}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                style={styles.quantityButton}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>
            {product.currency} {(getPrice() * quantity).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAddToCart}
          style={[styles.addButton, addingToCart && styles.addButtonDisabled]}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <ShoppingCart size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  cartButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5E7EB',
  },
  details: {
    padding: 20,
  },
  category: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 20,
  },
  priceBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  supplierCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  supplierLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplierAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: 24,
  },
  quantityContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 32,
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
