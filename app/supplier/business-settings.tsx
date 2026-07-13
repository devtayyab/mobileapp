import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Switch, Linking
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Store, AlertCircle, CreditCard, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

type SupplierData = {
  id: string;
  business_name: string;
  business_description: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  website: string | null;
  is_active: boolean;
  kyc_status: string;
  commission_rate: number;
};

export default function BusinessSettingsScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeOnboardingComplete, setStripeOnboardingComplete] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  useEffect(() => {
    loadSupplierData();
  }, [user?.id]);

  const loadSupplierData = async () => {
    if (!user?.id) { setInitializing(false); return; }
    setInitializing(true);

    const { data, error } = await supabase
      .from('suppliers')
      .select('id, business_name, business_description, business_email, business_phone, business_address, website, is_active, kyc_status, commission_rate, stripe_account_id, stripe_onboarding_complete')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading supplier:', error);
      setInitializing(false);
      return;
    }

    if (!data) {
      setNotFound(true);
      setInitializing(false);
      return;
    }

    setSupplierId(data.id);
    setBusinessName(data.business_name || '');
    setBusinessDescription(data.business_description || '');
    setBusinessEmail(data.business_email || '');
    setBusinessPhone(data.business_phone || '');
    setBusinessAddress(data.business_address || '');
    setWebsite(data.website || '');
    setIsActive(data.is_active ?? true);
    setStripeAccountId(data.stripe_account_id || null);
    setStripeOnboardingComplete(data.stripe_onboarding_complete || false);
    setInitializing(false);
  };

  const handleSetupStripe = async () => {
    try {
      setStripeLoading(true);
      setStripeError('');
      
      const { data: connectData, error: connectError } = await supabase.functions.invoke('create-stripe-connect-account');
      if (connectError) {
        let errorMsg = connectError.message;
        if (connectError.context) {
          try {
            const contextObj = await connectError.context.json();
            if (contextObj.error) errorMsg = contextObj.error;
          } catch(e) {}
        }
        throw new Error('Stripe Error: ' + errorMsg);
      }
      
      // Update local state if needed
      if (connectData?.stripeAccountId) {
        setStripeAccountId(connectData.stripeAccountId);
      }
      
      const { data: linkData, error: linkError } = await supabase.functions.invoke('create-stripe-account-link', {
        body: {
          refresh_url: 'exp://localhost:8081', // Fallback for dev
          return_url: 'exp://localhost:8081',
        }
      });
      if (linkError) throw new Error(linkError.message || 'Failed to create Stripe link');
      
      if (linkData?.url) {
        Linking.openURL(linkData.url);
      }
    } catch (error: any) {
      setStripeError(error.message);
      Alert.alert('Stripe Setup Error', error.message);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert('Error', 'Business name is required.');
      return;
    }

    if (!supplierId) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          business_name: businessName.trim(),
          business_description: businessDescription.trim() || null,
          business_email: businessEmail.trim() || null,
          business_phone: businessPhone.trim() || null,
          business_address: businessAddress.trim() || null,
          website: website.trim() || null,
          is_active: isActive,
        })
        .eq('id', supplierId);

      if (error) throw error;

      Alert.alert('Saved', 'Business settings updated successfully.', [
        { text: 'OK', onPress: () => (router.canGoBack() ? router.back() : router.replace('/')) },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.backBtn}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <Store size={48} color="#D1D5DB" />
          <Text style={styles.notFoundText}>No supplier profile found.</Text>
          <Text style={styles.notFoundSub}>Add a product first to initialize your supplier profile.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Info</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Business Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Your business name"
                placeholderTextColor="#94A3B8"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Business Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your business..."
                placeholderTextColor="#94A3B8"
                value={businessDescription}
                onChangeText={setBusinessDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Business Email</Text>
              <TextInput
                style={styles.input}
                placeholder="business@email.com"
                placeholderTextColor="#94A3B8"
                value={businessEmail}
                onChangeText={setBusinessEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Business Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#94A3B8"
                value={businessPhone}
                onChangeText={setBusinessPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                placeholder="https://yourwebsite.com"
                placeholderTextColor="#94A3B8"
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Business Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Street, City, State, ZIP, Country"
                placeholderTextColor="#94A3B8"
                value={businessAddress}
                onChangeText={setBusinessAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payout Settings</Text>
            <View style={styles.payoutContainer}>
              <View style={styles.payoutInfo}>
                <CreditCard size={24} color={stripeOnboardingComplete ? '#10B981' : '#64748B'} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.toggleLabel}>Stripe Connected Account</Text>
                  <Text style={styles.toggleSub}>
                    {stripeOnboardingComplete 
                      ? 'Your account is verified and ready to receive payouts.' 
                      : 'Set up your bank details to receive payouts securely.'}
                  </Text>
                </View>
              </View>

              {!stripeOnboardingComplete ? (
                <View>
                  <TouchableOpacity 
                    style={[styles.stripeBtn, stripeLoading && styles.submitBtnDisabled]} 
                    onPress={handleSetupStripe}
                    disabled={stripeLoading}
                  >
                    {stripeLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.stripeBtnText}>Set up Payouts</Text>
                    )}
                  </TouchableOpacity>
                  {stripeError && (
                    <Text style={{color: 'red', marginTop: 10, fontWeight: 'bold'}}>{stripeError}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.completedBadge}>
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={styles.completedText}>Verified</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store Status</Text>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Store Active</Text>
                <Text style={styles.toggleSub}>Allow customers to see your products</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Save size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>Save Settings</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: Colors.background.secondary, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.background.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  notFoundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  notFoundText: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  notFoundSub: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  content: { flex: 1 },
  form: { padding: 20 },
  section: {
    backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 },
  required: { color: Colors.error },
  input: {
    backgroundColor: Colors.background.primary, borderWidth: 1.5, borderColor: Colors.border.medium,
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 13,
    fontSize: 14, color: Colors.text.primary,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  toggleSub: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1D4ED8', padding: 16, borderRadius: 14, gap: 8, marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  payoutContainer: { gap: 16 },
  payoutInfo: { flexDirection: 'row', alignItems: 'center' },
  stripeBtn: {
    backgroundColor: '#635BFF', padding: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  stripeBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  completedBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, 
    borderRadius: 8, alignSelf: 'flex-start' 
  },
  completedText: { color: '#10B981', fontWeight: '600', fontSize: 13 },
});
