import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Grid3x3, Tag, ChevronRight } from 'lucide-react-native';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

const CATEGORY_IMAGES: Record<string, string> = {
  clothing: 'https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&w=400',
  fashion: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=400',
  accessories: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
  lifestyle: 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=400',
  electronics: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=400',
  footwear: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
  bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
  beauty: 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=400',
};

const CATEGORY_COLORS = [
  { bg: '#EFF6FF', accent: '#1D4ED8' },
  { bg: '#ECFDF5', accent: '#059669' },
  { bg: '#FFFBEB', accent: '#D97706' },
  { bg: '#FEF2F2', accent: '#DC2626' },
  { bg: '#F5F3FF', accent: '#7C3AED' },
  { bg: '#FFF7ED', accent: '#EA580C' },
  { bg: '#F0FDF4', accent: '#16A34A' },
  { bg: '#F8FAFC', accent: '#475569' },
];

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('display_order');
    if (data) setCategories(data);
    setLoading(false);
  };

  const getCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    const key = (cat.slug || cat.name || '').toLowerCase();
    for (const k of Object.keys(CATEGORY_IMAGES)) {
      if (key.includes(k)) return CATEGORY_IMAGES[k];
    }
    return null;
  };

  const renderCategory = ({ item, index }: { item: Category; index: number }) => {
    const imageUrl = getCategoryImage(item);
    const colors = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
    const isLarge = index % 5 === 0;

    return (
      <TouchableOpacity
        style={[styles.categoryCard, isLarge && styles.categoryCardLarge]}
        onPress={() => router.push('/(tabs)/shop')}
        activeOpacity={0.88}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.categoryImage} resizeMode="cover" />
        ) : (
          <View style={[styles.categoryImagePlaceholder, { backgroundColor: colors.bg }]}>
            <Text style={[styles.categoryLetterText, { color: colors.accent }]}>
              {item.name[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.categoryOverlay}>
          <Text style={styles.categoryOverlayName} numberOfLines={1}>{item.name}</Text>
          {item.description && (
            <Text style={styles.categoryOverlayDesc} numberOfLines={isLarge ? 2 : 1}>
              {item.description}
            </Text>
          )}
        </View>
        <View style={styles.categoryArrow}>
          <ChevronRight size={14} color="#FFF" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Categories</Text>
          <Text style={styles.headerSub}>{categories.length} collections</Text>
        </View>
        <View style={styles.headerIcon}>
          <Grid3x3 size={20} color="#1D4ED8" />
        </View>
      </View>

      {categories.length > 0 ? (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.bannerCard}>
              <Tag size={18} color="#1D4ED8" />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Explore All Collections</Text>
                <Text style={styles.bannerSub}>Tap any category to shop</Text>
              </View>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No categories available</Text>
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  headerIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  listContainer: { padding: 16, paddingBottom: 32, gap: 12 },
  bannerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#DBEAFE', marginBottom: 4,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
  bannerSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  categoryCard: {
    borderRadius: 18, overflow: 'hidden',
    height: 110, position: 'relative',
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  categoryCardLarge: { height: 180 },
  categoryImage: { width: '100%', height: '100%' },
  categoryImagePlaceholder: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  categoryLetterText: { fontSize: 48, fontWeight: '800' },
  categoryOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  categoryOverlayName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  categoryOverlayDesc: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, lineHeight: 17 },
  categoryArrow: {
    position: 'absolute', top: 12, right: 12,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#94A3B8' },
});
