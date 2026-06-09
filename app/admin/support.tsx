import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageSquare, LifeBuoy, Clock, CheckCircle, RefreshCw, XCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

type SupportTicket = {
  id: string;
  user_id: string;
  email: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
  };
};

const STATUS_COLORS = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  in_progress: { bg: '#DBEAFE', text: '#2563EB' },
  resolved: { bg: '#D1FAE5', text: '#059669' },
  closed: { bg: '#F3F4F6', text: '#4B5563' }
};

export default function AdminSupportScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          id, user_id, email, description, status, created_at,
          profiles:user_id (full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fix potential array from join
      const formattedData = (data || []).map(t => ({
        ...t,
        profiles: Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
      })) as SupportTicket[];
      
      setTickets(formattedData);
    } catch (err: any) {
      console.error('Error fetching support tickets:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const updateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;
      
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus as any } : t));
      setSelectedTicket(null);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const startChat = async (targetUserId: string) => {
    if (!user || !targetUserId) return;
    
    try {
      setSelectedTicket(null);
      // Let's create a support room for this user if it doesn't exist, or just jump to existing support room.
      // In this app, users create support rooms (room_type = 'support', created_by = user.id).
      
      const { data: existingRoom, error: findError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('room_type', 'support')
        .eq('created_by', targetUserId)
        .maybeSingle();
        
      if (existingRoom) {
        router.push(`/chat/${existingRoom.id}` as any);
        return;
      }
      
      // If it doesn't exist, we create a P2P chat room
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({ room_type: 'p2p', created_by: user.id })
        .select('id')
        .single();
        
      if (createError) throw createError;
      
      // Add both participants
      await supabase.from('chat_participants').insert([
        { room_id: newRoom.id, user_id: user.id },
        { room_id: newRoom.id, user_id: targetUserId }
      ]);
      
      router.push(`/chat/${newRoom.id}` as any);
    } catch (err: any) {
      Alert.alert('Error initiating chat', err.message);
    }
  };

  const renderTicket = ({ item }: { item: SupportTicket }) => {
    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => setSelectedTicket(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.userName}>{item.profiles?.full_name || 'Anonymous'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.userEmail}>{item.email}</Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Clock size={12} color={Colors.text.tertiary} />
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.chatBtn}
            onPress={(e) => {
              e.stopPropagation();
              startChat(item.user_id);
            }}
          >
            <MessageSquare size={14} color={Colors.primary} />
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/admin')} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Tickets</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
          <RefreshCw size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <LifeBuoy size={48} color={Colors.border.medium} />
              <Text style={styles.emptyTitle}>No Support Tickets</Text>
              <Text style={styles.emptySub}>When users submit requests from the Help Center, they will appear here.</Text>
            </View>
          }
          renderItem={renderTicket}
        />
      )}

      {/* Ticket Details Modal */}
      <Modal visible={!!selectedTicket} animationType="slide" transparent onRequestClose={() => setSelectedTicket(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            
            {selectedTicket && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Ticket Details</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedTicket.status]?.bg }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[selectedTicket.status]?.text }]}>
                      {selectedTicket.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User</Text>
                  <Text style={styles.detailValue}>{selectedTicket.profiles?.full_name} ({selectedTicket.profiles?.role})</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{selectedTicket.email}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted</Text>
                  <Text style={styles.detailValue}>{new Date(selectedTicket.created_at).toLocaleString()}</Text>
                </View>

                <View style={styles.descBox}>
                  <Text style={styles.detailLabel}>Request Description</Text>
                  <Text style={styles.descValue}>{selectedTicket.description}</Text>
                </View>

                <Text style={styles.actionTitle}>Update Status</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity 
                    style={[styles.statusBtn, selectedTicket.status === 'pending' && styles.statusBtnActive]}
                    onPress={() => updateStatus(selectedTicket.id, 'pending')}
                  >
                    <AlertCircle size={16} color={selectedTicket.status === 'pending' ? '#D97706' : Colors.text.tertiary} />
                    <Text style={[styles.statusBtnText, selectedTicket.status === 'pending' && { color: '#D97706' }]}>Pending</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.statusBtn, selectedTicket.status === 'in_progress' && styles.statusBtnActive]}
                    onPress={() => updateStatus(selectedTicket.id, 'in_progress')}
                  >
                    <Clock size={16} color={selectedTicket.status === 'in_progress' ? '#2563EB' : Colors.text.tertiary} />
                    <Text style={[styles.statusBtnText, selectedTicket.status === 'in_progress' && { color: '#2563EB' }]}>In Progress</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.statusBtn, selectedTicket.status === 'resolved' && styles.statusBtnActive]}
                    onPress={() => updateStatus(selectedTicket.id, 'resolved')}
                  >
                    <CheckCircle size={16} color={selectedTicket.status === 'resolved' ? '#059669' : Colors.text.tertiary} />
                    <Text style={[styles.statusBtnText, selectedTicket.status === 'resolved' && { color: '#059669' }]}>Resolved</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.statusBtn, selectedTicket.status === 'closed' && styles.statusBtnActive]}
                    onPress={() => updateStatus(selectedTicket.id, 'closed')}
                  >
                    <XCircle size={16} color={selectedTicket.status === 'closed' ? '#4B5563' : Colors.text.tertiary} />
                    <Text style={[styles.statusBtnText, selectedTicket.status === 'closed' && { color: '#4B5563' }]}>Closed</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.chatActionBtn} 
                  onPress={() => startChat(selectedTicket.user_id)}
                >
                  <MessageSquare size={18} color="#FFF" />
                  <Text style={styles.chatActionBtnText}>Message User</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedTicket(null)}>
                  <Text style={styles.cancelBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1, borderBottomColor: Colors.border.medium,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary },
  list: { padding: 16, gap: 12 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '800' },
  userEmail: { fontSize: 13, color: Colors.text.tertiary, marginBottom: 12 },
  description: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border.light },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: Colors.text.tertiary },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  chatBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.background.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.medium, alignSelf: 'center', marginBottom: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  detailLabel: { fontSize: 14, color: Colors.text.tertiary, fontWeight: '500' },
  detailValue: { fontSize: 14, color: Colors.text.primary, fontWeight: '600' },
  descBox: { marginTop: 16, padding: 16, backgroundColor: Colors.background.secondary, borderRadius: 12 },
  descValue: { fontSize: 14, color: Colors.text.primary, lineHeight: 22, marginTop: 8 },
  
  actionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, marginTop: 24, marginBottom: 12 },
  statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.medium, backgroundColor: Colors.background.secondary, width: '48%' },
  statusBtnActive: { borderColor: Colors.border.dark, backgroundColor: Colors.background.primary },
  statusBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text.tertiary },
  
  chatActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, marginBottom: 12 },
  chatActionBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cancelBtn: { paddingVertical: 16, alignItems: 'center', backgroundColor: Colors.background.secondary, borderRadius: 14 },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: Colors.text.primary }
});
