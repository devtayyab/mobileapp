import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Search, Star } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

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

type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'supplier') {
      router.replace('/supplier/dashboard');
    } else {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);

    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from('products')
        .select(`
          *,
          product_images (
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('display_order')
        .limit(6),
    ]);

    console.log("productsResult" , productsResult)
    if (productsResult.data) {
      setFeaturedProducts(productsResult.data);
    }

    if (categoriesResult.data) {
      setCategories(categoriesResult.data);
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
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}`)}
      >
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
          {item.is_featured && (
            <View style={styles.featuredBadge}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceContainer}>
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

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <View style={styles.categoryImagePlaceholder}>
        <Text style={styles.categoryPlaceholderText}>{item.name[0]}</Text>
      </View>
      <Text style={styles.categoryName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>
            {profile?.full_name || 'Guest'}
            {profile?.role === 'b2b' && ' (Wholesale)'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('/search')}
        >
          <Search size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {categories.length > 0 ? (
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            />
          ) : (
            <Text style={styles.emptyText}>No categories available</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          {featuredProducts.length > 0 ? (
            <FlatList
              data={featuredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            />
          ) : (
            <Text style={styles.emptyText}>No featured products available</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 4,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
    // paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    width: 80,
  },
  categoryImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryPlaceholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  categoryName: {
    fontSize: 12,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  productsContainer: {
    gap: 16,
    paddingHorizontal: 20,
  },
  productCard: {
    width: 180,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 6,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    height: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  b2bBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  b2bBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  lowStockText: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 4,
  },
});
