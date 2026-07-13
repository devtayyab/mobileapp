import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Shield } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function PaymentSettingsScreen() {
  const Colors = useTheme();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { user } = useAuth();
  
  const [secretKey, setSecretKey] = useState('');
  const [publishableKey, setPublishableKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setInitializing(true);
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('stripe_secret_key, stripe_publishable_key')
        .eq('id', 1)
        .single();

      if (error) throw error;
      
      if (data) {
        setSecretKey(data.stripe_secret_key || '');
        setPublishableKey(data.stripe_publishable_key || '');
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load payment settings. Ensure you have admin privileges.');
    } finally {
      setInitializing(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('payment_settings')
        .upsert({
          id: 1,
          stripe_secret_key: secretKey.trim() || null,
          stripe_publishable_key: publishableKey.trim() || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      Alert.alert('Success', 'Payment settings saved successfully.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: Colors.background.secondary, borderBottomColor: Colors.border.light }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Colors.background.primary, borderColor: Colors.border.medium }]}>
          <ArrowLeft size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.text.primary }]}>Payment Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={[styles.infoBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Shield size={24} color="#1D4ED8" />
            <Text style={[styles.infoText, { color: '#1E3A8A' }]}>
              These settings control the Stripe integration for the entire platform. Only admins can view or modify these keys.
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: Colors.background.secondary, borderColor: Colors.border.light }]}>
            <Text style={[styles.sectionTitle, { color: Colors.text.tertiary }]}>Stripe API Keys</Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: Colors.text.primary }]}>Secret Key (sk_test_... or sk_live_...)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: Colors.background.primary, borderColor: Colors.border.medium, color: Colors.text.primary }]}
                placeholder="sk_..."
                placeholderTextColor="#94A3B8"
                value={secretKey}
                onChangeText={setSecretKey}
                secureTextEntry
                autoCapitalize="none"
              />
              <Text style={[styles.helpText, { color: Colors.text.tertiary }]}>Used by the backend to process payments and transfers.</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: Colors.text.primary }]}>Publishable Key (pk_test_... or pk_live_...)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: Colors.background.primary, borderColor: Colors.border.medium, color: Colors.text.primary }]}
                placeholder="pk_..."
                placeholderTextColor="#94A3B8"
                value={publishableKey}
                onChangeText={setPublishableKey}
                autoCapitalize="none"
              />
              <Text style={[styles.helpText, { color: Colors.text.tertiary }]}>Used by the frontend UI if needed.</Text>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1 },
  form: { padding: 20 },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  section: {
    borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15,
  },
  helpText: { fontSize: 12, marginTop: 6 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1D4ED8', padding: 16, borderRadius: 14, gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
