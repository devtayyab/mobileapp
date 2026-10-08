import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, FlatList, Linking, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Send, Clock, CheckCircle, AlertCircle, XCircle,
  Mail, MessageSquare, Bot, Sparkles, Building, Globe, ExternalLink, HelpCircle
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  link?: { href: string; label: string };
}

const FAQ_KNOWLEDGE_BASE = [
  {
    keywords: ['track', 'order', 'status', 'shipping status', 'where is my package'],
    question: 'How do I track my order?',
    answer: 'You can track orders directly under Profile > My Orders. Every shipped parcel includes a carrier tracking code and real-time updates provided by the seller.'
  },
  {
    keywords: ['return', 'refund', 'money back', 'damaged', 'broken'],
    question: 'What is the return & refund policy?',
    answer: 'Buyers are protected by our marketplace guarantee. If an item arrives damaged or not as described, report it within 14 days of delivery with photos for resolution.'
  },
  {
    keywords: ['payment', 'pay', 'visa', 'mastercard', 'stripe', 'apple pay', 'google pay'],
    question: 'What payment methods are supported?',
    answer: 'We securely support Visa, Mastercard, American Express, Stripe, Apple Pay, and Google Pay with end-to-end encryption.'
  },
  {
    keywords: ['seller', 'supplier', 'sell', 'vendor', 'b2b'],
    question: 'How do I become a supplier?',
    answer: 'Navigate to Profile > Supplier Portal to submit your business details, identity documents (KYC), and catalog. Approvals are typically processed promptly.'
  },
  {
    keywords: ['contact', 'email', 'owner', 'company', 'cyprus', 'takuri'],
    question: 'Who operates Sathun Global Marketplace?',
    answer: 'Sathun Global Marketplace (sathunglobal.com) is operated by Sole Trader / Owner: Sunita Shahi under the business name Takuri Brand, Cyprus. Official Support: shahisunita264@gmail.com'
  }
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const Colors = useTheme();
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'chat' | 'submit' | 'tickets'>('chat');
  const [requestText, setRequestText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tickets
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Support Chat Bot State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Hello! Welcome to Sathun Global Marketplace Support. How can we help you today?',
      time: 'Just now'
    },
    {
      id: 'welcome-2',
      sender: 'bot',
      text: 'You can tap any frequently asked question below, or type your question. We provide immediate automated assistance.',
      time: 'Just now'
    }
  ]);
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (user && activeTab === 'tickets') {
      fetchMyTickets();
    }
  }, [user, activeTab]);

  const fetchMyTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSendChatMessage = async (customText?: string) => {
    const textToSend = (customText || chatInput).trim();
    if (!textToSend) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setChatInput('');

    // Scroll to bottom
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Look for matching FAQ
    const lower = textToSend.toLowerCase();
    const matchedFaq = FAQ_KNOWLEDGE_BASE.find((faq) =>
      faq.keywords.some((kw) => lower.includes(kw))
    );

    setTimeout(async () => {
      let botResponse: ChatMessage;

      if (matchedFaq) {
        botResponse = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: matchedFaq.answer,
          time: 'Just now'
        };
      } else {
        // Fallback response required by item 7
        botResponse = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: 'We have received your message and are looking into it. Our support team has logged your inquiry and will follow up shortly at your registered email. For immediate help, contact us directly at shahisunita264@gmail.com.',
          time: 'Just now',
          link: {
            href: 'mailto:shahisunita264@gmail.com',
            label: 'Email shahisunita264@gmail.com'
          }
        };

        // If user is authenticated, also automatically record a ticket so it is saved in DB
        if (user) {
          try {
            await supabase.from('support_tickets').insert([
              {
                user_id: user.id,
                email: profile?.email || user.email || 'user@sathunglobal.com',
                description: `[Chat Inquiry]: ${textToSend}`
              }
            ]);
          } catch (e) {
            // Silently ignore insert error
          }
        }
      }

      setMessages((prev) => [...prev, botResponse]);
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 400);
  };

  const handleSubmitTicket = async () => {
    if (!requestText.trim()) {
      Alert.alert('Error', 'Please enter your request details.');
      return;
    }

    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to submit a support ticket.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([
          {
            user_id: user.id,
            email: profile?.email || user.email || 'No email provided',
            description: requestText.trim(),
          }
        ]);

      if (error) throw error;
      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background.primary }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: Colors.background.secondary, borderBottomColor: Colors.border.medium }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/' as any))}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.text.primary }]}>Help & Support</Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:shahisunita264@gmail.com')}>
          <Mail size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Official Operating Entity Card */}
      <View style={[styles.entityCard, { backgroundColor: Colors.background.secondary, borderColor: Colors.border.medium }]}>
        <View style={styles.entityRow}>
          <Building size={16} color={Colors.primary} />
          <Text style={[styles.entityTitle, { color: Colors.text.primary }]}>
            Sathun Global Marketplace
          </Text>
        </View>
        <Text style={[styles.entitySub, { color: Colors.text.secondary }]}>
          Operated by Sunita Shahi (Takuri Brand, Cyprus)
        </Text>
        <TouchableOpacity
          style={styles.entityEmailRow}
          onPress={() => Linking.openURL('mailto:shahisunita264@gmail.com')}
        >
          <Mail size={14} color="#059669" />
          <Text style={styles.entityEmailText}>Official Support: shahisunita264@gmail.com</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: Colors.background.secondary, borderBottomColor: Colors.border.medium }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'chat' && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'chat' ? Colors.primary : Colors.text.tertiary }]}>
            Support Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'submit' && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab('submit')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'submit' ? Colors.primary : Colors.text.tertiary }]}>
            Submit Ticket
          </Text>
        </TouchableOpacity>
        {user && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'tickets' && { borderBottomColor: Colors.primary }]}
            onPress={() => setActiveTab('tickets')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'tickets' ? Colors.primary : Colors.text.tertiary }]}>
              My Tickets
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab 1: Instant Support Chat Bot */}
      {activeTab === 'chat' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <ScrollView
            ref={chatScrollRef}
            contentContainerStyle={styles.chatScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick FAQ Pills */}
            <View style={styles.faqPillsContainer}>
              <Text style={[styles.faqPillsHeading, { color: Colors.text.tertiary }]}>
                Frequent Questions (Tap for instant answer):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.faqChipsRow}>
                {FAQ_KNOWLEDGE_BASE.map((faq, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.faqChip, { backgroundColor: Colors.background.secondary, borderColor: Colors.border.medium }]}
                    onPress={() => handleSendChatMessage(faq.question)}
                  >
                    <Sparkles size={12} color={Colors.primary} />
                    <Text style={[styles.faqChipText, { color: Colors.text.primary }]}>{faq.question}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Chat Messages */}
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.msgWrapper,
                  msg.sender === 'user' ? styles.msgWrapperUser : styles.msgWrapperBot
                ]}
              >
                {msg.sender === 'bot' && (
                  <View style={[styles.botAvatar, { backgroundColor: Colors.primary }]}>
                    <Bot size={14} color="#FFF" />
                  </View>
                )}
                <View
                  style={[
                    styles.msgBubble,
                    msg.sender === 'user'
                      ? [styles.msgBubbleUser, { backgroundColor: Colors.primary }]
                      : [styles.msgBubbleBot, { backgroundColor: Colors.background.secondary, borderColor: Colors.border.medium }]
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      { color: msg.sender === 'user' ? '#FFF' : Colors.text.primary }
                    ]}
                  >
                    {msg.text}
                  </Text>
                  {msg.link && (
                    <TouchableOpacity
                      style={styles.msgLinkBtn}
                      onPress={() => Linking.openURL(msg.link!.href)}
                    >
                      <Mail size={13} color="#059669" />
                      <Text style={styles.msgLinkText}>{msg.link.label}</Text>
                    </TouchableOpacity>
                  )}
                  <Text
                    style={[
                      styles.msgTime,
                      { color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : Colors.text.tertiary }
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Chat Input Bar */}
          <View style={[styles.chatInputBar, { backgroundColor: Colors.background.secondary, borderTopColor: Colors.border.medium }]}>
            <TextInput
              style={[styles.chatInput, { backgroundColor: Colors.background.primary, color: Colors.text.primary, borderColor: Colors.border.medium }]}
              placeholder="Ask a question..."
              placeholderTextColor={Colors.text.tertiary}
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={() => handleSendChatMessage()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.chatSendBtn, { backgroundColor: Colors.primary }]}
              onPress={() => handleSendChatMessage()}
            >
              <Send size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Tab 2: Submit Ticket */}
      {activeTab === 'submit' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!isSubmitted ? (
            <>
              <Text style={[styles.title, { color: Colors.text.primary }]}>Submit a Support Ticket</Text>

              <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
                Need dedicated support regarding an order, payment, or supplier account? Describe your issue below and our team will get in touch with you at your registered email.
              </Text>

              <View style={[styles.infoBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Text style={{ fontSize: 13, color: '#1E40AF', lineHeight: 20 }}>
                  Official Email: <Text style={{ fontWeight: '700' }}>shahisunita264@gmail.com</Text>{'\n'}
                  Platform: Sathun Global Marketplace (sathunglobal.com){'\n'}
                  Business: Takuri Brand, Cyprus
                </Text>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: Colors.background.secondary, color: Colors.text.primary, borderColor: Colors.border.medium }]}
                placeholder="Type your request here in detail..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={requestText}
                onChangeText={setRequestText}
              />
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmitTicket}
                disabled={submitting}
              >
                <Send size={18} color="#FFF" />
                <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Request'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <CheckCircle size={56} color="#059669" style={{ marginBottom: 16 }} />
              <Text style={[styles.title, { color: Colors.text.primary, textAlign: 'center' }]}>Request Submitted</Text>
              <Text style={[styles.paragraph, { color: Colors.text.secondary, textAlign: 'center' }]}>
                We have received your message and are looking into it. Our support team has logged your inquiry and will follow up shortly at your registered email. For immediate help, contact us directly at shahisunita264@gmail.com.
              </Text>
              <TouchableOpacity
                style={[styles.submitBtn, { width: '100%', marginTop: 20 }]}
                onPress={() => {
                  setIsSubmitted(false);
                  setRequestText('');
                  setActiveTab('tickets');
                }}
              >
                <Text style={styles.submitBtnText}>View My Tickets</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Tab 3: My Tickets */}
      {activeTab === 'tickets' && (
        <View style={[styles.content, { flex: 1 }]}>
          {loadingTickets ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : myTickets.length > 0 ? (
            <FlatList
              data={myTickets}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                let StatusIcon = AlertCircle;
                let statusColor = '#D97706';
                if (item.status === 'resolved') { StatusIcon = CheckCircle; statusColor = '#059669'; }
                if (item.status === 'in_progress') { StatusIcon = Clock; statusColor = '#2563EB'; }
                if (item.status === 'closed') { StatusIcon = XCircle; statusColor = '#4B5563'; }

                return (
                  <View style={[styles.ticketCard, { backgroundColor: Colors.background.secondary, borderColor: Colors.border.medium }]}>
                    <View style={styles.ticketHeader}>
                      <Text style={[styles.ticketDate, { color: Colors.text.tertiary }]}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                      <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: statusColor + '15' }]}>
                        <StatusIcon size={12} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={[styles.ticketDesc, { color: Colors.text.primary }]}>{item.description}</Text>
                  </View>
                );
              }}
            />
          ) : (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <HelpCircle size={48} color={Colors.text.tertiary} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, color: Colors.text.tertiary, fontWeight: '600' }}>No support tickets found.</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  entityCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  entityTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  entitySub: {
    fontSize: 13,
    marginBottom: 6,
  },
  entityEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  entityEmailText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chatScroll: {
    padding: 16,
    paddingBottom: 24,
  },
  faqPillsContainer: {
    marginBottom: 16,
  },
  faqPillsHeading: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  faqChipsRow: {
    flexDirection: 'row',
  },
  faqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  faqChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: '85%',
  },
  msgWrapperUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  msgWrapperBot: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    gap: 8,
  },
  botAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  msgBubble: {
    padding: 12,
    borderRadius: 16,
  },
  msgBubbleUser: {
    borderBottomRightRadius: 4,
  },
  msgBubbleBot: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
  },
  msgLinkText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  chatSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 120,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ticketCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ticketDesc: {
    fontSize: 14,
    lineHeight: 20,
  }
});
