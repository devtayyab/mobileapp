import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Alert, Platform
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { MessageSquare, MessageCircle, ArrowLeft, Plus, User, ShieldAlert } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

type ChatRoom = {
  id: string;
  room_type: 'p2p' | 'support';
  created_at: string;
  updated_at: string;
  other_participant?: {
    id: string;
    full_name: string;
    role: string;
  };
  last_message?: {
    message: string;
    created_at: string;
    sender_id: string;
  };
};

export default function ChatListScreen() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchChatRooms();
      } else {
        setLoading(false);
      }
    }, [user])
  );

  const fetchChatRooms = async () => {
    setLoading(true);
    try {
      if (!user) return;

      let data: any[] | null = null;
      let error: any = null;

      if (profile?.role === 'admin') {
        // Admins can see all support chat rooms + any p2p rooms they are in
        const { data: adminRooms, error: adminError } = await supabase
          .from('chat_rooms')
          .select(`
            id, room_type, created_at, updated_at,
            chat_participants (
              user_id,
              profiles (id, full_name, role)
            )
          `)
          .order('updated_at', { ascending: false });
        
        data = adminRooms;
        error = adminError;
      } else {
        // Regular users can only see rooms where they are participants
        const { data: userRooms, error: userError } = await supabase
          .from('chat_rooms')
          .select(`
            id, room_type, created_at, updated_at,
            chat_participants!inner (user_id),
            all_participants:chat_participants (
              user_id,
              profiles (id, full_name, role)
            )
          `)
          .eq('chat_participants.user_id', user.id)
          .order('updated_at', { ascending: false });

        // Map to format correctly
        data = userRooms?.map(r => ({
          id: r.id,
          room_type: r.room_type,
          created_at: r.created_at,
          updated_at: r.updated_at,
          chat_participants: r.all_participants
        })) || [];
        error = userError;
      }

      if (error) throw error;

      if (data) {
        const formattedRooms: ChatRoom[] = await Promise.all(
          data.map(async (room: any) => {
            // Find the other participant in the room
            const participants = room.chat_participants || [];
            const other = participants.find((p: any) => p.user_id !== user.id);
            const otherProfile = other ? (Array.isArray(other.profiles) ? other.profiles[0] : (other.profiles as any)) : null;
            
            // Fetch the last message in this room
            const { data: msgData } = await supabase
              .from('chat_messages')
              .select('message, created_at, sender_id')
              .eq('room_id', room.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              id: room.id,
              room_type: room.room_type,
              created_at: room.created_at,
              updated_at: room.updated_at,
              other_participant: otherProfile ? {
                id: otherProfile.id,
                full_name: otherProfile.full_name,
                role: otherProfile.role
              } : (room.room_type === 'support' && profile?.role !== 'admin' ? {
                id: 'admin',
                full_name: 'App Owner (Admin)',
                role: 'admin'
              } : undefined),
              last_message: msgData ? {
                message: msgData.message,
                created_at: msgData.created_at,
                sender_id: msgData.sender_id
              } : undefined
            };
          })
        );

        setRooms(formattedRooms.filter(r => r.other_participant || r.room_type === 'support'));
      }
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const startSupportChat = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to chat with support.');
      return;
    }

    setLoading(true);
    try {
      // 1. Try to find an existing support room created by this user
      const { data: existing, error: findError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('room_type', 'support')
        .eq('created_by', user.id)
        .maybeSingle();

      if (findError) throw findError;

      if (existing) {
        // Room already exists, open it!
        router.push(`/chat/${existing.id}` as any);
        return;
      }

      // 2. Create a new support room
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          room_type: 'support',
          created_by: user.id
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // 3. Add current user as participant
      const { error: partError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: newRoom.id,
          user_id: user.id
        });

      if (partError) throw partError;

      router.push(`/chat/${newRoom.id}` as any);
    } catch (err) {
      console.error('Error starting support chat:', err);
      Alert.alert('Error', 'Unable to initiate chat room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return '';
    switch (role) {
      case 'admin': return 'Support';
      case 'supplier': return 'Supplier';
      case 'b2b': return 'Wholesaler';
      default: return 'Customer';
    }
  };

  const getRoleColor = (role?: string) => {
    if (!role) return '#CBD5E1';
    switch (role) {
      case 'admin': return '#F59E0B'; // Amber
      case 'supplier': return '#10B981'; // Green
      case 'b2b': return '#8B5CF6'; // Purple
      default: return '#3B82F6'; // Blue
    }
  };

  const renderRoom = ({ item }: { item: ChatRoom }) => {
    const isSupport = item.room_type === 'support';
    const title = isSupport && profile?.role !== 'admin' 
      ? 'App Support Team' 
      : (item.other_participant?.full_name || 'Anonymous User');
    
    const roleLabel = getRoleLabel(item.other_participant?.role || (isSupport ? 'admin' : undefined));
    const roleColor = getRoleColor(item.other_participant?.role || (isSupport ? 'admin' : undefined));

    return (
      <TouchableOpacity 
        style={styles.chatCard} 
        onPress={() => router.push(`/chat/${item.id}` as any)}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarCircle, { backgroundColor: isSupport ? '#F59E0B20' : '#8B5CF620' }]}>
            {isSupport ? (
              <MessageSquare size={20} color="#F59E0B" />
            ) : (
              <User size={20} color="#8B5CF6" />
            )}
          </View>
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{title}</Text>
            {roleLabel ? (
              <View style={[styles.roleBadge, { borderColor: roleColor }]}>
                <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleLabel}</Text>
              </View>
            ) : null}
          </View>
          
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message ? item.last_message.message : 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && rooms.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversations</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main chat list */}
      {rooms.length > 0 ? (
        <FlatList
          data={rooms}
          renderItem={renderRoom}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color="#374151" />
          <Text style={styles.emptyTitle}>No chats yet</Text>
          <Text style={styles.emptySub}>Start a conversation with a supplier or reach out to support.</Text>
        </View>
      )}

      {/* Dynamic Support/Admin FAB button */}
      {profile?.role !== 'admin' && (
        <TouchableOpacity style={styles.fabButton} onPress={startSupportChat}>
          <MessageSquare size={24} color="#000" />
          <Text style={styles.fabText}>Chat with Owner</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 45,
    paddingBottom: 20,
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#F59E0B', letterSpacing: 0.5 },
  listContainer: { padding: 16, gap: 12 },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: { position: 'relative' },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  chatInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', flex: 1, marginRight: 8 },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  lastMessage: { fontSize: 13, color: '#9CA3AF' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  fabButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
