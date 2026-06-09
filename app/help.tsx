import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

export default function HelpCenterScreen() {
  const router = useRouter();
  const Colors = useTheme();
  const [requestText, setRequestText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'submit' | 'tickets'>('submit');
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && activeTab === 'tickets') {
      fetchMyTickets();
    }
  }, [user, activeTab]);

  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async () => {
    if (!requestText.trim()) {
      Alert.alert('Error', 'Please enter your request details.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a request.');
      return;
    }

    setLoading(true);
    
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

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: Colors.background.secondary, borderBottomColor: Colors.border.medium }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.text.primary }]}>Help Center</Text>
        <View style={{ width: 24 }} />
      </View>

      {user && (
        <View style={[styles.tabContainer, { backgroundColor: Colors.background.secondary, borderBottomColor: Colors.border.medium }]}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'submit' && { borderBottomColor: Colors.primary }]}
            onPress={() => setActiveTab('submit')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'submit' ? Colors.primary : Colors.text.tertiary }]}>Submit Request</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'tickets' && { borderBottomColor: Colors.primary }]}
            onPress={() => setActiveTab('tickets')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'tickets' ? Colors.primary : Colors.text.tertiary }]}>My Tickets</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {activeTab === 'submit' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!isSubmitted ? (
          <>
            <Text style={[styles.title, { color: Colors.text.primary }]}>Welcome to our Help Center!</Text>
            
            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              Thank you for using our platform. We are committed to providing you with a smooth and reliable dropshipping experience. If you are experiencing any issues or have questions regarding your account, orders, products, shipping, payments, or any other service, our support team is here to assist you.
            </Text>
            
            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              Before contacting support, please ensure that you have checked the relevant information within the app, as many common questions can be resolved through the available settings and order details.
            </Text>
            
            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              For faster assistance, please include the following information when submitting your request:
            </Text>
            <View style={styles.list}>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• Your registered email address</Text>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• Order ID (if applicable)</Text>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• Product name or details</Text>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• A clear description of the issue</Text>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• Screenshots or supporting evidence, if available</Text>
            </View>

            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              Please note:
            </Text>
            <View style={styles.list}>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• Order processing and shipping updates may take some time to appear.</Text>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• Delivery times may vary depending on the destination country and shipping method.</Text>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• Refunds and returns are subject to our policies and eligibility requirements.</Text>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• Incomplete information may result in delays in resolving your request.</Text>
            </View>

            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              Our support team will review your inquiry and respond as soon as possible. We appreciate your patience and thank you for choosing our platform.
            </Text>
            
            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              We are always working to improve our services and provide the best possible experience for our users.
            </Text>

            <Text style={[styles.paragraph, { color: Colors.text.secondary, marginTop: 10 }]}>
              Best Regards,{'\n'}Support Team
            </Text>

            <View style={[styles.divider, { backgroundColor: Colors.border.medium }]} />

            <Text style={[styles.title, { color: Colors.text.primary, fontSize: 18, marginTop: 10 }]}>Submit a Request</Text>
            <TextInput
              style={[styles.input, { backgroundColor: Colors.background.secondary, color: Colors.text.primary, borderColor: Colors.border.medium }]}
              placeholder="Type your request here..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={requestText}
              onChangeText={setRequestText}
            />
            <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
              <Send size={18} color="#FFF" />
              <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit Request'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: Colors.text.primary }]}>Request Submitted</Text>
            
            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              Thank you for contacting our Support Team.
            </Text>

            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              We have successfully received your request and our team will review the information you provided, including your account details, email address, order information, and any attachments or screenshots submitted with your request.
            </Text>

            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              Your support ticket has been recorded and is currently being processed. Please allow our team some time to investigate the issue and provide the most accurate solution.
            </Text>

            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              What happens next?
            </Text>
            <View style={styles.list}>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• Our support team will review your request.</Text>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• If additional information is required, we will contact you using your registered email address.</Text>
              <Text style={[styles.listItem, { color: Colors.text.secondary }]}>• Once the review is completed, you will receive an update regarding the status of your request.</Text>
            </View>

            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              Please note that response times may vary depending on the complexity of the issue and the volume of support requests currently being handled.
            </Text>

            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              We kindly ask that you avoid submitting multiple requests regarding the same issue, as this may cause delays in processing your ticket.
            </Text>

            <Text style={[styles.paragraph, { color: Colors.text.secondary }]}>
              Thank you for your patience and understanding. We appreciate your trust in our platform and will do our best to assist you as quickly as possible.
            </Text>

            <TouchableOpacity style={styles.submitBtn} onPress={() => router.back()}>
              <Text style={styles.submitBtnText}>Go Back</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      ) : (
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  list: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
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
    fontSize: 16,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
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
