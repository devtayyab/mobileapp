import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, Star, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

export default function SupplierReviews() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadReviews();
  }, [user]);

  const loadReviews = async () => {
    try {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!supplier) return;

      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          id, rating, comment, is_approved, created_at,
          profiles:user_id(full_name),
          products!inner(name, supplier_id)
        `)
        .eq('products.supplier_id', supplier.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: !currentStatus })
        .eq('id', reviewId);
      
      if (error) throw error;
      
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, is_approved: !currentStatus } : r));
    } catch (error) {
      console.error('Error approving review:', error);
      Alert.alert('Error', 'Could not update review status.');
    }
  };

  const handleDelete = async (reviewId: string) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const { error } = await supabase.from('product_reviews').delete().eq('id', reviewId);
          if (error) throw error;
          setReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (error) {
          console.error('Error deleting review:', error);
          Alert.alert('Error', 'Could not delete review.');
        }
      }}
    ]);
  };

  const renderReview = ({ item }: { item: any }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.productName} numberOfLines={1}>{item.products?.name}</Text>
        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.reviewerRow}>
        <Text style={styles.reviewerName}>{item.profiles?.full_name || 'Anonymous'}</Text>
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(star => (
            <Star key={star} size={14} color="#F59E0B" fill={star <= item.rating ? "#F59E0B" : "transparent"} />
          ))}
        </View>
      </View>
      {item.comment ? <Text style={styles.commentText}>{item.comment}</Text> : null}
      
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, item.is_approved ? styles.approvedBtn : styles.approveBtn]}
          onPress={() => handleApprove(item.id, item.is_approved)}
        >
          <CheckCircle size={16} color={item.is_approved ? "#FFF" : "#059669"} />
          <Text style={[styles.actionBtnText, item.is_approved && { color: '#FFF' }]}>
            {item.is_approved ? 'Approved' : 'Approve'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <XCircle size={16} color="#DC2626" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageSquare size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No reviews found</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: Colors.background.secondary, borderBottomWidth: 1, borderBottomColor: Colors.border.medium },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  listContent: { padding: 16, gap: 12 },
  reviewCard: { backgroundColor: Colors.background.secondary, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.light },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  productName: { fontSize: 14, fontWeight: '600', color: Colors.primary, flex: 1, marginRight: 12 },
  dateText: { fontSize: 12, color: Colors.text.tertiary },
  reviewerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewerName: { fontSize: 14, fontWeight: '500', color: Colors.text.primary },
  starsRow: { flexDirection: 'row', gap: 2 },
  commentText: { fontSize: 14, color: Colors.text.secondary, marginBottom: 12, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, borderTopWidth: 1, borderTopColor: Colors.border.light, paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#059669' },
  approveBtn: { backgroundColor: 'transparent' },
  approvedBtn: { backgroundColor: '#059669' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#059669' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#DC2626' },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: Colors.text.tertiary, marginTop: 12 }
});
