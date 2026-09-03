import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

export default function ForgotPasswordScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const { t } = useLanguage();
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg(t.fillAllFields || 'Please enter your email');
      return;
    }

    setLoading(true);
    const { error } = await resetPasswordForEmail(email.trim());
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <SafeAreaView style={styles.container as any}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topSection}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
            >
              <ArrowLeft size={22} color={Colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.topContent}>
              <View style={styles.iconWrap}>
                <Mail size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.title}>Reset your password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we&apos;ll send you a link to reset your password.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            {sent ? (
              <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                <CheckCircle size={40} color={Colors.secondary} />
                <Text style={styles.confirmText}>
                  If an account exists for {email}, we&apos;ve sent a link to reset your password.
                </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.linkText}>Back to sign in</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.emailAddress || 'Email'}</Text>
                  <View style={styles.inputRow}>
                    <Mail size={18} color={Colors.text.tertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder={t.emailPlaceholder || 'you@example.com'}
                      placeholderTextColor={Colors.text.tertiary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={Colors.text.inverse} />
                  ) : (
                    <Text style={styles.submitBtnText}>Send reset link</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scrollContent: { flexGrow: 1 },
  topSection: { paddingTop: 10, paddingBottom: 16, paddingHorizontal: 24 },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  topContent: { alignItems: 'center', gap: 6 },
  iconWrap: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(0, 168, 107, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center', paddingHorizontal: 12 },
  formCard: {
    backgroundColor: Colors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    gap: 12,
  },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text.primary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background.primary, borderRadius: 14,
    paddingHorizontal: 14, height: 50,
    borderWidth: 1.5, borderColor: Colors.border.medium,
  },
  input: { flex: 1, fontSize: 14, color: Colors.text.secondary, paddingVertical: 0 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', fontWeight: '500' },
  submitBtn: {
    height: 48, borderRadius: 14, backgroundColor: Colors.secondary,
    justifyContent: 'center', alignItems: 'center', marginTop: 6,
  },
  submitBtnText: { color: Colors.text.inverse, fontSize: 16, fontWeight: '700' },
  confirmText: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center' },
  linkText: { fontSize: 14, color: Colors.secondary, fontWeight: '700' },
});
