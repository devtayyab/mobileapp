import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Search, Bell, Star, ArrowRight, Flame, Tag,
  TrendingUp, ShoppingBag, Zap, ChevronRight
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

type Product = {
  id: string;
  name: string;
  b2c_price: number;
  b2b_price: number | null;
  currency: string;
  stock_quantity: number;
  is_featured: boolean;
  product_images: Array<{ image_url: string; is_primary: boolean }>;
  categories?: { name: string } | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

const HERO_BANNERS = [
  {
    id: '1',
    title: 'New Season\nArrivals',
    subtitle: 'Up to 40% off selected items',
    cta: 'Shop Now',
    image: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=800',
    overlayColor: '#1A1A2ECC',
    accent: '#E94560',
  },
  {
    id: '2',
    title: 'Premium\nFashion',
    subtitle: 'Discover the latest trends',
    cta: 'Explore',
    image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800',
    overlayColor: '#0F3460CC',
    accent: '#F59E0B',
  },
  {
    id: '3',
    title: 'Wholesale\nPricing',
    subtitle: 'B2B deals for bulk orders',
    cta: 'Get Deals',
    image: 'https://images.pexels.com/photos/3965545/pexels-photo-3965545.jpeg?auto=compress&cs=tinysrgb&w=800',
    overlayColor: '#064E3BCC',
    accent: '#10B981',
  },
];

const CATEGORY_IMAGES: Record<string, string> = {
  clothing: 'https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&w=200',
  fashion: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=200',
  accessories: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=200',
  lifestyle: 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=200',
  electronics: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=200',
  footwear: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=200',
};

const CATEGORY_COLORS = [
  { bg: '#FFF1F2', text: '#E11D48' },
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#ECFDF5', text: '#065F46' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#F5F3FF', text: '#5B21B6' },
  { bg: '#FFFBEB', text: '#92400E' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FEF2F2', text: '#991B1B' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHero, setActiveHero] = useState(0);
  const heroRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchData();
  }, [profile]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHero((prev) => {
        const next = (prev + 1) % HERO_BANNERS.length;
        heroRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [featuredRes, newRes, catRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, product_images (image_url, is_primary), categories (name)')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('products')
        .select('*, product_images (image_url, is_primary), categories (name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('display_order')
        .limit(8),
    ]);
    if (featuredRes.data) setFeaturedProducts(featuredRes.data as any);
    if (newRes.data) setNewProducts(newRes.data as any);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  };

  const getPrice = (p: Product) => (profile?.role === 'b2b' && p.b2b_price ? p.b2b_price : p.b2c_price);

  const getProductImage = (p: Product) => {
    const pri = p.product_images?.find((i) => i.is_primary);
    return pri?.image_url || p.product_images?.[0]?.image_url;
  };

  const getCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    const key = (cat.slug || cat.name).toLowerCase();
    return CATEGORY_IMAGES[key] || null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  const isB2B = profile?.role === 'b2b';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerGreetWrap}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {profile?.full_name?.split(' ')[0] || 'Guest'}
              {isB2B ? <Text style={styles.b2bSuffix}> · Wholesale</Text> : null}
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search')}>
              <Search size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={20} color="#374151" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search')} activeOpacity={0.85}>
          <Search size={15} color="#9CA3AF" />
          <Text style={styles.searchText}>Search products, brands, categories...</Text>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>Filter</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isB2B && (
          <View style={styles.b2bBanner}>
            <Tag size={16} color="#1D4ED8" />
            <View style={{ flex: 1 }}>
              <Text style={styles.b2bBannerTitle}>Wholesale Pricing Active</Text>
              <Text style={styles.b2bBannerSub}>Exclusive B2B prices on all products</Text>
            </View>
            <ArrowRight size={15} color="#1D4ED8" />
          </View>
        )}

        <View style={styles.heroWrap}>
          <ScrollView
            ref={heroRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setActiveHero(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            scrollEventThrottle={16}
          >
            {HERO_BANNERS.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                style={[styles.heroBanner, { width }]}
                onPress={() => router.push('/(tabs)/shop')}
                activeOpacity={0.95}
              >
                <Image source={{ uri: banner.image }} style={styles.heroBannerBg} resizeMode="cover" />
                <View style={[styles.heroBannerOverlay, { backgroundColor: banner.overlayColor }]}>
                  <View style={[styles.heroAccentPill, { backgroundColor: banner.accent }]}>
                    <Zap size={11} color="#FFF" />
                    <Text style={styles.heroAccentText}>Special Offer</Text>
                  </View>
                  <Text style={styles.heroBannerTitle}>{banner.title}</Text>
                  <Text style={styles.heroBannerSub}>{banner.subtitle}</Text>
                  <TouchableOpacity style={styles.heroBannerBtn} onPress={() => router.push('/(tabs)/shop')}>
                    <Text style={styles.heroBannerBtnText}>{banner.cta}</Text>
                    <ArrowRight size={13} color="#111827" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.heroDots}>
            {HERO_BANNERS.map((_, i) => (
              <View key={i} style={[styles.heroDot, activeHero === i && styles.heroDotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { icon: <ShoppingBag size={16} color="#1D4ED8" />, bg: '#EFF6FF', num: '500+', label: 'Products' },
            { icon: <TrendingUp size={16} color="#059669" />, bg: '#ECFDF5', num: '50+', label: 'Brands' },
            { icon: <Flame size={16} color="#EA580C" />, bg: '#FFF7ED', num: 'Daily', label: 'Deals' },
            { icon: <Star size={16} color="#B45309" fill="#B45309" />, bg: '#FFFBEB', num: '4.8★', label: 'Rating' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>{s.icon}</View>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <TouchableOpacity style={styles.seeAll} onPress={() => router.push('/(tabs)/categories')}>
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={13} color="#1D4ED8" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {categories.map((cat, idx) => {
              const c = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const img = getCategoryImage(cat);
              return (
                <TouchableOpacity key={cat.id} style={styles.catCard} onPress={() => router.push('/(tabs)/shop')}>
                  <View style={[styles.catImgWrap, { backgroundColor: c.bg }]}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.catImg} resizeMode="cover" />
                    ) : (
                      <Text style={[styles.catLetter, { color: c.text }]}>{cat.name[0]}</Text>
                    )}
                  </View>
                  <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.flashBanner} onPress={() => router.push('/(tabs)/shop')} activeOpacity={0.92}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&w=400' }}
            style={styles.flashBannerImg}
            resizeMode="cover"
          />
          <View style={styles.flashBannerOverlay}>
            <View style={styles.flashBadge}>
              <Flame size={13} color="#FFF" />
              <Text style={styles.flashBadgeText}>FLASH SALE</Text>
            </View>
            <Text style={styles.flashTitle}>Up to 50% Off</Text>
            <Text style={styles.flashSub}>Limited time fashion deals</Text>
            <View style={styles.flashBtn}>
              <Text style={styles.flashBtnText}>Shop Now</Text>
              <ArrowRight size={13} color="#FFF" />
            </View>
          </View>
        </TouchableOpacity>

        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionTitleRow}>
                <Star size={17} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.sectionTitle}>Featured</Text>
              </View>
              <TouchableOpacity style={styles.seeAll} onPress={() => router.push('/(tabs)/shop')}>
                <Text style={styles.seeAllText}>See all</Text>
                <ChevronRight size={13} color="#1D4ED8" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {featuredProducts.map((p) => {
                const img = getProductImage(p);
                return (
                  <TouchableOpacity key={p.id} style={styles.featCard} onPress={() => router.push(`/product/${p.id}`)}>
                    <View style={styles.featImgWrap}>
                      {img ? (
                        <Image source={{ uri: img }} style={styles.featImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.featImgPlaceholder}>
                          <ShoppingBag size={26} color="#D1D5DB" />
                        </View>
                      )}
                      <View style={styles.featStarBadge}>
                        <Star size={10} color="#F59E0B" fill="#F59E0B" />
                      </View>
                      {p.stock_quantity < 10 && p.stock_quantity > 0 && (
                        <View style={styles.stockBadge}>
                          <Text style={styles.stockBadgeText}>{p.stock_quantity} left</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.featInfo}>
                      {(p.categories as any)?.name && (
                        <Text style={styles.featCat}>{(p.categories as any).name}</Text>
                      )}
                      <Text style={styles.featName} numberOfLines={2}>{p.name}</Text>
                      <View style={styles.featPriceRow}>
                        <Text style={styles.featPrice}>${getPrice(p).toFixed(2)}</Text>
                        {isB2B && p.b2b_price && (
                          <View style={styles.wsBadge}>
                            <Text style={styles.wsBadgeText}>B2B</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.promoPair}>
          <TouchableOpacity style={[styles.promoCard, { backgroundColor: '#ECFDF5' }]} onPress={() => router.push('/(tabs)/shop')}>
            <TrendingUp size={20} color="#059669" />
            <Text style={[styles.promoTitle, { color: '#065F46' }]}>New Arrivals</Text>
            <Text style={styles.promoSub}>Fresh weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.promoCard, { backgroundColor: '#EFF6FF' }]} onPress={() => router.push('/(tabs)/shop')}>
            <Tag size={20} color="#1D4ED8" />
            <Text style={[styles.promoTitle, { color: '#1E3A8A' }]}>Best Deals</Text>
            <Text style={styles.promoSub}>Save more today</Text>
          </TouchableOpacity>
        </View>

        {newProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionTitleRow}>
                <TrendingUp size={17} color="#059669" />
                <Text style={styles.sectionTitle}>New Arrivals</Text>
              </View>
              <TouchableOpacity style={styles.seeAll} onPress={() => router.push('/(tabs)/shop')}>
                <Text style={styles.seeAllText}>See all</Text>
                <ChevronRight size={13} color="#1D4ED8" />
              </TouchableOpacity>
            </View>
            <View style={styles.grid3}>
              {newProducts.map((p) => {
                const img = getProductImage(p);
                return (
                  <TouchableOpacity key={p.id} style={styles.gridCard} onPress={() => router.push(`/product/${p.id}`)}>
                    <View style={styles.gridImgWrap}>
                      {img ? (
                        <Image source={{ uri: img }} style={styles.gridImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.gridImgPlaceholder}>
                          <ShoppingBag size={18} color="#D1D5DB" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.gridName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.gridPrice}>${getPrice(p).toFixed(2)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.bottomBanner} onPress={() => router.push('/(tabs)/shop')} activeOpacity={0.92}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/3965545/pexels-photo-3965545.jpeg?auto=compress&cs=tinysrgb&w=800' }}
            style={styles.bottomBannerImg}
            resizeMode="cover"
          />
          <View style={styles.bottomBannerOverlay}>
            <Text style={styles.bottomBannerTitle}>Shop the Full Collection</Text>
            <Text style={styles.bottomBannerSub}>Thousands of products from verified suppliers</Text>
            <View style={styles.bottomBannerBtn}>
              <Text style={styles.bottomBannerBtnText}>Browse All Products</Text>
              <ArrowRight size={14} color="#111827" />
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFF', paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerGreetWrap: { flex: 1, paddingRight: 10 },
  greeting: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', letterSpacing: 0.3 },
  userName: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 3 },
  b2bSuffix: { fontSize: 18, fontWeight: '600', color: '#1D4ED8' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8, width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#FFF',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchText: { flex: 1, fontSize: 13, color: '#9CA3AF' },
  filterChip: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  b2bBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EFF6FF', marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#BFDBFE',
  },
  b2bBannerTitle: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
  b2bBannerSub: { fontSize: 12, color: '#3B82F6', marginTop: 1 },
  heroWrap: { marginTop: 14 },
  heroBanner: { height: 210, overflow: 'hidden', position: 'relative' },
  heroBannerBg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  heroBannerOverlay: { flex: 1, paddingHorizontal: 24, paddingVertical: 26, justifyContent: 'flex-end' },
  heroAccentPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10,
  },
  heroAccentText: { fontSize: 10, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroBannerTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', lineHeight: 34, marginBottom: 6 },
  heroBannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginBottom: 16 },
  heroBannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#FFF', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
  },
  heroBannerBtnText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  heroDots: {
    flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  heroDotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: '#1D4ED8' },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 16,
    borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
    paddingVertical: 14, overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 1, backgroundColor: '#F1F5F9' },
  statIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statNum: { fontSize: 13, fontWeight: '800', color: '#111827' },
  statLbl: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  catRow: { gap: 12, paddingRight: 4 },
  catCard: { alignItems: 'center', width: 72 },
  catImgWrap: { width: 62, height: 62, borderRadius: 18, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 7 },
  catImg: { width: '100%', height: '100%' },
  catLetter: { fontSize: 22, fontWeight: '800' },
  catName: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
  flashBanner: {
    marginHorizontal: 16, marginTop: 20, borderRadius: 20, overflow: 'hidden', height: 120,
    flexDirection: 'row',
  },
  flashBannerImg: { width: 130, height: '100%' },
  flashBannerOverlay: {
    flex: 1, backgroundColor: '#1A1A2E', padding: 16, justifyContent: 'center', gap: 4,
  },
  flashBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: '#E94560', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 3,
  },
  flashBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  flashTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  flashSub: { fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  flashBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
    backgroundColor: '#E94560', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  flashBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  hScroll: { gap: 14 },
  featCard: {
    width: 158, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  featImgWrap: { position: 'relative' },
  featImg: { width: '100%', height: 158 },
  featImgPlaceholder: {
    width: '100%', height: 158, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
  },
  featStarBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: '#FFF',
    borderRadius: 10, padding: 5,
  },
  stockBadge: {
    position: 'absolute', bottom: 8, left: 8, backgroundColor: '#EF4444',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
  },
  stockBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  featInfo: { padding: 11 },
  featCat: { fontSize: 9, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  featName: { fontSize: 12, fontWeight: '600', color: '#111827', marginBottom: 8, minHeight: 32 },
  featPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featPrice: { fontSize: 15, fontWeight: '800', color: '#1D4ED8' },
  wsBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  wsBadgeText: { fontSize: 9, fontWeight: '700', color: '#1D4ED8' },
  promoPair: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 20 },
  promoCard: {
    flex: 1, borderRadius: 16, padding: 16, gap: 5, minHeight: 100, justifyContent: 'center',
  },
  promoTitle: { fontSize: 14, fontWeight: '700' },
  promoSub: { fontSize: 12, color: '#6B7280' },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: (width - 32 - 20) / 3, backgroundColor: '#FFF',
    borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9',
  },
  gridImgWrap: { width: '100%', aspectRatio: 1 },
  gridImg: { width: '100%', height: '100%' },
  gridImgPlaceholder: {
    width: '100%', height: '100%', backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
  },
  gridName: { fontSize: 11, fontWeight: '600', color: '#374151', padding: 7, paddingBottom: 2 },
  gridPrice: { fontSize: 12, fontWeight: '800', color: '#1D4ED8', paddingHorizontal: 7, paddingBottom: 8 },
  bottomBanner: {
    height: 170, marginHorizontal: 16, marginTop: 22, borderRadius: 20,
    overflow: 'hidden', position: 'relative',
  },
  bottomBannerImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  bottomBannerOverlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'center', padding: 24,
  },
  bottomBannerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 5 },
  bottomBannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginBottom: 16 },
  bottomBannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
    backgroundColor: '#FFF', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
  },
  bottomBannerBtnText: { fontSize: 13, fontWeight: '700', color: '#111827' },
});
