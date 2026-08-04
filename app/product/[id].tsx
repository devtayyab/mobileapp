import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, TextInput
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, ShoppingCart, Store, MapPin, Star, Package, Minus, Plus, Tag, MessageSquare } from 'lucide-react-native';
import { Colors, Palette } from '@/constants/Colors';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';

interface Product {
  id: string;
  name: string;
  description: string;
  b2c_price: number;
  b2b_price: number | null;
  currency: string;
  stock_quantity: number;
  moq: number;
  category_id: string;
  supplier_id: string;
  categories: { name: string };
  countries?: { name: string };
  suppliers: {
    business_name: string;
    user_id: string;
    profiles: { address: any };
  };
  product_images: Array<{ image_url: string; is_primary: boolean }>;
}

export default function ProductDetail() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    loadProduct();
    loadReviews();
  }, [id]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, profiles(full_name)')
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setReviews(data);
        if (data.length > 0) {
          const sum = data.reduce((acc, rev) => acc + rev.rating, 0);
          setAverageRating(sum / data.length);
        } else {
          setAverageRating(0);
        }
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          countries!origin_country_id(name),
          suppliers(business_name, user_id, profiles(address)),
          product_images(image_url, is_primary, display_order)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      setProduct(data);
      if (data) {
        const isB2BUser = profile?.role === 'b2b' && data.b2b_price;
        setQuantity(isB2BUser ? (data.moq || 1) : 1);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChatWithSupplier = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to chat with the supplier.');
      return;
    }

    let supplierUserId = product?.suppliers?.user_id;

    // Fallback to Platform Admin if the product is seeded without a user account
    if (!supplierUserId) {
      try {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(1)
          .single();

        if (adminProfile) {
          supplierUserId = adminProfile.id;
        }
      } catch (err) {
        console.error('Error fetching admin fallback:', err);
      }
    }

    if (!supplierUserId) {
      Alert.alert('Error', 'Unable to initiate chat. No active recipient found.');
      return;
    }

    if (user.id === supplierUserId) {
      Alert.alert('Chat Info', 'You cannot start a chat with yourself.');
      return;
    }

    try {
      // 1. Check if a p2p room already exists between these two users
      const { data: rooms, error: findError } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          chat_participants!inner(user_id)
        `)
        .eq('room_type', 'p2p')
        .eq('chat_participants.user_id', user.id);

      if (findError) throw findError;

      // Filter rooms where the other participant is the supplier
      let existingRoomId = null;
      if (rooms) {
        for (const room of rooms) {
          const { data: participants } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('room_id', room.id);

          if (participants && participants.some(p => p.user_id === supplierUserId)) {
            existingRoomId = room.id;
            break;
          }
        }
      }

      if (existingRoomId) {
        router.push(`/chat/${existingRoomId}` as any);
        return;
      }

      // 2. Create a new p2p room
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          room_type: 'p2p',
          created_by: user.id
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // 3. Add both participants
      const { error: partError } = await supabase
        .from('chat_participants')
        .insert([
          { room_id: newRoom.id, user_id: user.id },
          { room_id: newRoom.id, user_id: supplierUserId }
        ]);

      if (partError) throw partError;

      router.push(`/chat/${newRoom.id}` as any);
    } catch (err) {
      console.error('Error starting chat with supplier:', err);
      Alert.alert('Error', 'Unable to initiate chat. Please try again.');
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

  const submitReview = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to write a review.');
      return;
    }
    try {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: id,
        user_id: user.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      if (error) throw error;
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      loadReviews();
      Alert.alert('Success', 'Thank you for your review!');
    } catch (err) {
      console.error('Error submitting review:', err);
      Alert.alert('Error', 'Unable to submit review. Please try again.');
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
  const effectiveMOQ = isB2B ? (product.moq || 1) : 1;

  return (
    <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
      <View style={[styles.header, language.rtl && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/' as any)}
          style={styles.headerBtn}
        >
          <ArrowLeft size={22} color="#FFF" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.headerBtn}>
          <ShoppingCart size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[selectedImageIdx]?.image_url }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Package size={64} color="#CBD5E1" />
              <Text style={{ marginTop: 10, color: '#94A3B8' }}>{t.noImage}</Text>
            </View>
          )}
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll} contentContainerStyle={styles.thumbContent}>
              {images.map((img, idx) => (
                <TouchableOpacity key={idx} onPress={() => setSelectedImageIdx(idx)} style={[styles.thumb, idx === selectedImageIdx && styles.thumbActive]}>
                  <Image source={{ uri: img.image_url }} style={styles.thumbImage} resizeMode="contain" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <View style={[styles.categoryRow, language.rtl && { flexDirection: 'row-reverse' }]}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{product.categories?.name}</Text>
            </View>
            {isLowStock && (
              <View style={styles.lowStockPill}>
                <Text style={styles.lowStockPillText}>{t.onlyLeft.replace('{count}', product.stock_quantity.toString())}</Text>
              </View>
            )}
            {product.categories?.name && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{product.categories.name}</Text>
              </View>
            )}
            {product.countries?.name && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>Origin: {product.countries.name}</Text>
              </View>
            )}
            {product.stock_quantity === 0 && (
              <View style={styles.outOfStockPill}>
                <Text style={styles.outOfStockPillText}>{t.outOfStock}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.productName, language.rtl && { textAlign: 'right' }]}>{product.name}</Text>

          <View style={[styles.priceRow, language.rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.mainPrice, isB2B ? styles.mainPriceB2B : null]}>
              {formatPrice(price)}
            </Text>
            {isB2B && (
              <View style={[styles.wholesaleTag, language.rtl && { flexDirection: 'row-reverse' }]}>
                <Tag size={12} color="#059669" />
                <Text style={styles.wholesaleTagText}>{t.wholesalePrice}</Text>
              </View>
            )}
            {isB2B && product.b2b_price && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.b2c_price)}
              </Text>
            )}
          </View>

          <View style={styles.supplierCard}>
            <View style={[styles.supplierHeader, language.rtl && { flexDirection: 'row-reverse' }]}>
              <View style={styles.supplierIconWrap}>
                <Store size={18} color="#1D4ED8" />
              </View>
              <View style={[styles.supplierInfo, language.rtl && { alignItems: 'flex-end' }]}>
                <Text style={styles.supplierName}>{product.suppliers?.business_name}</Text>
                {product.suppliers?.profiles?.address?.city && (
                  <View style={[styles.locationRow, language.rtl && { flexDirection: 'row-reverse' }]}>
                    <MapPin size={12} color="#94A3B8" />
                    <Text style={styles.locationText}>
                      {product.suppliers.profiles.address.city}
                      {product.suppliers.profiles.address.country ? `, ${product.suppliers.profiles.address.country}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {user?.id !== product.suppliers?.user_id && (
              <TouchableOpacity style={styles.supplierChatBtn} onPress={startChatWithSupplier}>
                <MessageSquare size={16} color="#F59E0B" />
                <Text style={styles.supplierChatBtnText}>Chat with Supplier</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.statsRow, language.rtl && { flexDirection: 'row-reverse' }]}>
            <View style={styles.statItem}>
              <Package size={16} color="#1D4ED8" />
              <Text style={styles.statValue}>{product.stock_quantity}</Text>
              <Text style={styles.statLabel}>{t.inStock}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.statValue}>{averageRating > 0 ? averageRating.toFixed(1) : '-'}</Text>
              <Text style={styles.statLabel}>{t.rating}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ShoppingCart size={16} color="#059669" />
              <Text style={styles.statValue}>120+</Text>
              <Text style={styles.statLabel}>{t.sold}</Text>
            </View>
          </View>

          <View style={[styles.section, language.rtl && { alignItems: 'flex-end' }]}>
            <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }]}>{t.description}</Text>
            <Text style={[styles.description, language.rtl && { textAlign: 'right' }]}>
              {product.description || t.noProductsFound}
            </Text>
          </View>

          <View style={[styles.section, language.rtl && { alignItems: 'flex-end' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }, { marginBottom: 0 }]}>Reviews ({reviews.length})</Text>
              {user && (
                <TouchableOpacity onPress={() => setShowReviewModal(true)} style={styles.addReviewBtn}>
                  <Text style={styles.addReviewBtnText}>Write a Review</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {reviews.length === 0 ? (
              <Text style={styles.description}>No reviews yet.</Text>
            ) : (
              reviews.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.profiles?.full_name || 'Anonymous'}</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={14} color="#F59E0B" fill={star <= review.rating ? "#F59E0B" : "transparent"} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                  {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                </View>
              ))
            )}
          </View>

          <View style={[styles.section, language.rtl && { alignItems: 'flex-end' }]}>
            <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }]}>{t.quantity}</Text>
            {isB2B && effectiveMOQ > 1 && (
              <View style={[styles.moqBanner, language.rtl && { flexDirection: 'row-reverse' }]}>
                <Tag size={13} color="#1D4ED8" />
                <Text style={[styles.moqBannerText, language.rtl && { textAlign: 'right' }]}>
                  {t.minOrderQuantity.replace('{count}', effectiveMOQ.toString())}
                </Text>
              </View>
            )}
            <View style={[styles.qtyRow, language.rtl && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[styles.qtyBtn, quantity <= effectiveMOQ && styles.qtyBtnDisabled]}
                onPress={() => setQuantity(Math.max(effectiveMOQ, quantity - 1))}
                disabled={quantity <= effectiveMOQ}
              >
                <Minus size={18} color={quantity <= effectiveMOQ ? '#CBD5E1' : '#111827'} />
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
              <Text style={styles.qtyMax}>{t.available.replace('{count}', product.stock_quantity.toString())}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, language.rtl && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.footerTotal, language.rtl && { alignItems: 'flex-end' }]}>
          <Text style={styles.footerTotalLabel}>{t.total}</Text>
          <Text style={styles.footerTotalAmount}>{formatPrice(price * quantity)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, (addingToCart || product.stock_quantity === 0) && styles.addToCartBtnDisabled, language.rtl && { flexDirection: 'row-reverse' }]}
          onPress={handleAddToCart}
          disabled={addingToCart || product.stock_quantity === 0}
        >
          {addingToCart ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <ShoppingCart size={20} color="#FFF" />
              <Text style={styles.addToCartBtnText}>
                {product.stock_quantity === 0 ? t.outOfStock : t.addToCart}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={() => setShowReviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)} style={{ padding: 4 }}>
                  <Star size={32} color="#F59E0B" fill={star <= reviewRating ? "#F59E0B" : "transparent"} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="What did you think of this product?"
              placeholderTextColor={Colors.text.tertiary}
              multiline
              value={reviewComment}
              onChangeText={setReviewComment}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowReviewModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={submitReview}>
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: Colors.background.primary },
  notFoundText: { fontSize: 16, color: Colors.text.tertiary, fontWeight: '500' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : 45, paddingBottom: 14,
    backgroundColor: Colors.background.secondary, borderBottomWidth: 1, borderBottomColor: Colors.border.medium,
    gap: 10,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.background.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text.primary, textAlign: 'center' },
  content: { flex: 1 },
  imageSection: { backgroundColor: Colors.background.primary },
  mainImage: { width: '100%', height: 320, backgroundColor: Colors.background.secondary },
  imagePlaceholder: {
    width: '100%', height: 320, backgroundColor: Colors.background.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  thumbScroll: { backgroundColor: Colors.background.primary, maxHeight: 70 },
  thumbContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  thumb: {
    width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: { borderColor: Colors.secondary },
  thumbImage: { width: '100%', height: '100%' },
  detailsContainer: { padding: 20 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  categoryPill: {
    backgroundColor: 'rgba(0, 168, 107, 0.1)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border.medium,
  },
  categoryPillText: { fontSize: 12, fontWeight: '600', color: Colors.secondary },
  lowStockPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  lowStockPillText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  outOfStockPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border.medium,
  },
  outOfStockPillText: { fontSize: 12, fontWeight: '600', color: Colors.text.tertiary },
  productName: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.3, marginBottom: 12, lineHeight: 28 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  mainPrice: { fontSize: 30, fontWeight: '800', color: Colors.secondary },
  mainPriceB2B: { color: Colors.secondary },
  wholesaleTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0, 168, 107, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  wholesaleTagText: { fontSize: 11, fontWeight: '700', color: Colors.secondary },
  originalPrice: { fontSize: 16, color: Colors.text.tertiary, textDecorationLine: 'line-through' },
  supplierCard: {
    backgroundColor: Colors.background.secondary, borderRadius: 14, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  supplierChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  supplierChatBtnText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
  },
  supplierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supplierIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.background.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  supplierInfo: { flex: 1 },
  supplierName: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 12, color: Colors.text.tertiary },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.background.secondary, borderRadius: 14,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border.medium,
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.text.primary },
  statLabel: { fontSize: 11, color: Colors.text.tertiary },
  statDivider: { width: 1, backgroundColor: Colors.border.light },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 24, color: Colors.text.tertiary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.background.secondary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border.medium,
  },
  qtyBtnDisabled: { borderColor: Colors.border.light, backgroundColor: Colors.background.primary, opacity: 0.5 },
  qtyDisplay: {
    width: 56, height: 44, borderRadius: 12,
    backgroundColor: Colors.background.secondary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  qtyValue: { fontSize: 18, fontWeight: '800', color: Colors.secondary },
  qtyMax: { fontSize: 12, color: Colors.text.tertiary, flex: 1 },
  moqBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0, 168, 107, 0.1)', borderRadius: 8, padding: 10, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  moqBannerText: { fontSize: 12, fontWeight: '600', color: Colors.secondary, flex: 1 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background.secondary, paddingHorizontal: 20, paddingVertical: 16,
    paddingBottom: 34, borderTopWidth: 1, borderTopColor: Colors.border.medium,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  footerTotal: { gap: 2 },
  footerTotalLabel: { fontSize: 12, color: Colors.text.tertiary },
  footerTotalAmount: { fontSize: 22, fontWeight: '800', color: Colors.text.primary },
  addToCartBtn: {
    flex: 1, backgroundColor: Colors.secondary,
    paddingVertical: 16, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  addToCartBtnDisabled: { backgroundColor: Colors.border.medium, opacity: 0.5 },
  addToCartBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  addReviewBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addReviewBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  reviewCard: { backgroundColor: Colors.background.secondary, padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: Colors.border.light },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewerName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: 12, color: Colors.text.tertiary, marginBottom: 8 },
  reviewComment: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.background.primary, width: '100%', borderRadius: 12, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginBottom: 16 },
  ratingSelector: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  reviewInput: { width: '100%', backgroundColor: Colors.background.secondary, borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top', color: Colors.text.primary, borderColor: Colors.border.light, borderWidth: 1, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: Colors.background.tertiary },
  modalCancelText: { color: Colors.text.secondary, fontWeight: '600' },
  modalSubmitBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: Colors.primary },
  modalSubmitText: { color: '#FFF', fontWeight: '600' },
});

