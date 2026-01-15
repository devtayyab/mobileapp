import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, Search as SearchIcon, Star } from 'lucide-react-native';

type Product = {
  id: string;
  name: string;
  slug: string;
  b2c_price: number;
  b2b_price: number | null;
  currency: string;
  stock_quantity: number;
  is_featured: boolean;
  product_images: Array<{
    image_url: string;
    is_primary: boolean;
  }>;
};

export default function SearchScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delaySearch = setTimeout(() => {
        searchProducts();
      }, 500);

      return () => clearTimeout(delaySearch);
    } else {
      setProducts([]);
      setSearched(false);
    }
  }, [searchQuery]);

  const searchProducts = async () => {
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (
          image_url,
          is_primary,
          display_order
        )
      `)
      .eq('is_active', true)
      .ilike('name', `%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setProducts(data as any);
    }
    setLoading(false);
  };

  const getPrice = (product: Product) => {
    if (profile?.role === 'b2b' && product.b2b_price) {
      return product.b2b_price;
    }
    return product.b2c_price;
  };

  const getProductImage = (product: Product) => {
    const primaryImage = product.product_images?.find(img => img.is_primary);
    return primaryImage?.image_url || product.product_images?.[0]?.image_url;
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUrl = getProductImage(item);

    return (
      <TouchableOpacity style={styles.productCard} onPress={() => router.push(`/product/${item.id}`)}>
        <View style={styles.productImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              {item.currency} {getPrice(item).toFixed(2)}
            </Text>
            {profile?.role === 'b2b' && item.b2b_price && (
              <View style={styles.b2bBadge}>
                <Text style={styles.b2bBadgeText}>Wholesale</Text>
              </View>
            )}
          </View>
          {item.stock_quantity < 10 && item.stock_quantity > 0 && (
            <Text style={styles.lowStockText}>Only {item.stock_quantity} left</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
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
            <SearchIcon size={48} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Try searching with different keywords</Text>
          </View>
        )
      ) : (
        <View style={styles.emptyContainer}>
          <SearchIcon size={48} color="#ccc" />
          <Text style={styles.emptyText}>Search for products</Text>
          <Text style={styles.emptySubtext}>Enter at least 2 characters to search</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    width: 100,
    height: 100,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#999',
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  b2bBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  b2bBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  lowStockText: {
    fontSize: 11,
    color: '#FF5722',
    marginTop: 4,
  },
});
