import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, User, MessageSquare } from 'lucide-react-native';

type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export default function ChatRoomScreen() {
  const { id: roomId } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{ full_name: string; role: string } | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let pollInterval: any;
    if (user && roomId) {
      loadRoomDetails();
      loadMessages();
      subscribeToMessages();
      startOnlineHeartbeat();

      pollInterval = setInterval(() => {
        fetchNewMessagesOnly();
      }, 2000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [user, roomId]);

  // Heartbeat to mark this user as online/offline dynamically
  const startOnlineHeartbeat = () => {
    if (!user?.id) return;

    // 1. Instantly mark as online
    supabase.from('profiles').update({ is_online: true, last_seen_at: new Date().toISOString() }).eq('id', user.id).then();

    // 2. Set interval to update every 30 seconds
    const interval = setInterval(() => {
      supabase.from('profiles').update({ is_online: true, last_seen_at: new Date().toISOString() }).eq('id', user.id).then();
    }, 30000);

    // 3. Mark offline on unmount
    return () => {
      clearInterval(interval);
      supabase.from('profiles').update({ is_online: false, last_seen_at: new Date().toISOString() }).eq('id', user.id).then();
    };
  };

  const loadRoomDetails = async () => {
    try {
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .select(`
          room_type,
          chat_participants (
            user_id,
            profiles (full_name, role)
          )
        `)
        .eq('id', roomId)
        .single();

      if (error) throw error;

      if (room) {
        const other = room.chat_participants.find((p: any) => p.user_id !== user?.id);
        if (other) {
          const profileData = Array.isArray(other.profiles) ? other.profiles[0] : (other.profiles as any);
          if (profileData) {
            setOtherUser({
              full_name: profileData.full_name,
              role: profileData.role
            });
          }
        } else if (room.room_type === 'support') {
          setOtherUser({
            full_name: 'App Owner (Admin)',
            role: 'admin'
          });
        }
      }
    } catch (err) {
      console.error('Error loading room details:', err);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
      // Wait for layout to calculate before scrolling
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    }
  };

  const fetchNewMessagesOnly = async () => {
    if (!roomId || !user) return;
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId);
      
      const currentMsgs = messagesRef.current;
      if (currentMsgs.length > 0) {
        // Filter messages newer than the last message in local state
        const lastMsgTime = currentMsgs[currentMsgs.length - 1].created_at;
        query = query.gt('created_at', lastMsgTime);
      }

      const { data: newMsgs, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;

      if (newMsgs && newMsgs.length > 0) {
        setMessages((prev) => {
          const merged = [...prev];
          let added = false;
          for (const msg of newMsgs) {
            if (!merged.some(m => m.id === msg.id)) {
              merged.push(msg as Message);
              added = true;
            }
          }
          if (added) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          }
          return merged;
        });
      }
    } catch (err) {
      console.error('Error fetching new messages:', err);
    }
  };

  const subscribeToMessages = () => {
    const channel = (supabase.channel(`chat_messages:${roomId}`) as any)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          tableName: 'chat_messages'
        },
        (payload: any) => {
          const newMessage = payload.new as Message;
          if (newMessage.room_id !== roomId) return;

          setMessages((prev) => {
            // Guard against duplicate inserts from real-time events
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          // Scroll to end on new message
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;
    const textToSend = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    // Create optimistic message to show instantly
    const optimisticId = `temp-${Math.random().toString(36).substring(7)}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      room_id: roomId || '',
      sender_id: user.id,
      message: textToSend,
      created_at: new Date().toISOString()
    };

    // Optimistically render instantly
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Insert new message and select it back
      const { data: insertedMsg, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          message: textToSend
        })
        .select('*')
        .single();

      if (error) throw error;
      
      // Swap optimistic message with the official database message
      if (insertedMsg) {
        setMessages((prev) => 
          prev.map((msg) => msg.id === optimisticId ? (insertedMsg as Message) : msg)
        );
      }

      // Update room's updated_at timestamp to bubble it up in chats list
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message if insert failed
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;

    return (
      <View style={[
        styles.messageRow,
        isMine ? styles.myMessageRow : styles.otherMessageRow
      ]}>
        <View style={[
          styles.messageBubble,
          isMine ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMine ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isMine ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  const isSupport = otherUser?.role === 'admin';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/chat' as any)} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.avatarCircle}>
            {isSupport ? (
              <MessageSquare size={18} color="#F59E0B" />
            ) : (
              <User size={18} color="#8B5CF6" />
            )}
          </View>
          <View>
            <Text style={styles.headerTitle}>{otherUser?.full_name || 'Chat'}</Text>
            <Text style={styles.headerSubtitle}>
              {isSupport ? 'App Support' : otherUser?.role === 'supplier' ? 'Supplier' : 'Wholesaler'}
            </Text>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#6B7280"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Send size={18} color={inputText.trim() ? '#000' : '#4B5563'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 45,
    paddingBottom: 16,
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: { padding: 8, marginRight: 8 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  messagesList: { padding: 16, gap: 14, paddingBottom: 24 },
  messageRow: { flexDirection: 'row', width: '100%', marginVertical: 2 },
  myMessageRow: { justifyContent: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  myMessageBubble: {
    backgroundColor: '#F59E0B', // Amber color for my message bubble
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#1A1A1A', // Dark grey for other messages
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#000000', fontWeight: '500' },
  otherMessageText: { color: '#FFFFFF' },
  messageTime: { fontSize: 10, alignSelf: 'flex-end' },
  myMessageTime: { color: 'rgba(0, 0, 0, 0.6)' },
  otherMessageTime: { color: '#6B7280' },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0D0D0D',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
});
