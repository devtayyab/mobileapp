import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight, User, ShoppingBag, Briefcase, Store } from 'lucide-react-native';

type UserRole = 'customer' | 'b2b' | 'supplier';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();

  const ROLES: Array<{ key: UserRole; label: string; sub: string; icon: any; color: string; bg: string }> = [
    { key: 'customer', label: t.customerRole, sub: t.customerSub, icon: ShoppingBag, color: '#059669', bg: '#ECFDF5' },
    { key: 'b2b', label: t.wholesaleRole, sub: t.wholesaleSub, icon: Briefcase, color: '#1D4ED8', bg: '#EFF6FF' },
    { key: 'supplier', label: t.supplierRole, sub: t.supplierSub, icon: Store, color: '#D97706', bg: '#FFFBEB' },
  ];

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(t.error, t.nameRequired);
      return;
    }
    if (!email || !password || !confirmPassword) {
      Alert.alert(t.error, t.fillAllFields);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t.error, t.passwordsDoNotMatch);
      return;
    }
    if (password.length < 6) {
      Alert.alert(t.error, t.passwordLength);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, role, name.trim());
    setLoading(false);

    if (error) {
      Alert.alert(t.registrationFailed, error.message);
    } else {
      router.push('/(auth)/login')
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, language.rtl && { direction: 'rtl' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#FFF" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <View style={styles.topContent}>
            <View style={styles.iconWrap}>
              <User size={28} color="#FFF" />
            </View>
            <Text style={styles.welcomeTitle}>{t.createAccount}</Text>
            <Text style={styles.welcomeSub}>{t.joinMarketplace}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.roleSection}>
            <Text style={styles.label}>{t.accountType}</Text>
            <View style={styles.roleGrid}>
              {ROLES.map(({ key, label, sub, icon: Icon, color, bg }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.roleCard, role === key && styles.roleCardActive, role === key && { borderColor: color }]}
                  onPress={() => setRole(key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIcon, { backgroundColor: role === key ? bg : '#F8FAFC' }]}>
                    <Icon size={18} color={role === key ? color : '#94A3B8'} />
                  </View>
                  <Text style={[styles.roleLabel, role === key && { color }]}>{label}</Text>
                  <Text style={styles.roleSub}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.fullName} <Text style={{ color: '#EF4444' }}>*</Text></Text>
            <View style={styles.inputRow}>
              <User size={18} color="#94A3B8" />
              <TextInput
                style={[styles.input, language.rtl && { textAlign: 'right' }]}
                placeholder={t.enterFullName}
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.emailAddress}</Text>
            <View style={styles.inputRow}>
              <Mail size={18} color="#94A3B8" />
              <TextInput
                style={[styles.input, language.rtl && { textAlign: 'right' }]}
                placeholder="your@email.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.password}</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color="#94A3B8" />
              <TextInput
                style={[styles.input, language.rtl && { textAlign: 'right' }]}
                placeholder={t.atLeast6Chars}
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.confirmPassword}</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color="#94A3B8" />
              <TextInput
                style={[styles.input, language.rtl && { textAlign: 'right' }]}
                placeholder={t.reEnterPassword}
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createBtn, loading && styles.createBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.createBtnText}>{t.createAccount}</Text>
                <ArrowRight size={18} color="#FFF" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t.alreadyHaveAccount} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkText}>{t.signIn}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.termsText}>
          {t.termsAgreement}{' '}
          <Text style={styles.termsLink}>{t.termsOfService}</Text>
          {' '}{t.and}{' '}
          <Text style={styles.termsLink}>{t.privacyPolicy}</Text>
        </Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { flexGrow: 1 },
  topSection: {
    backgroundColor: '#1E293B',
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 32,
  },
  topContent: { alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  welcomeTitle: { fontSize: 26, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.3 },
  welcomeSub: { fontSize: 14, color: '#94A3B8' },
  formCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 18,
  },
  roleSection: { gap: 10 },
  roleGrid: { flexDirection: 'row', gap: 8 },
  roleCard: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0', gap: 4,
  },
  roleCardActive: { borderWidth: 2 },
  roleIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  roleLabel: { fontSize: 12, fontWeight: '700', color: '#374151' },
  roleSub: { fontSize: 10, color: '#94A3B8', textAlign: 'center' },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFC', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  eyeBtn: { padding: 2 },
  createBtn: {
    backgroundColor: '#059669', paddingVertical: 16,
    borderRadius: 14, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    marginTop: 4,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: '#6B7280' },
  linkText: { fontSize: 14, color: '#1D4ED8', fontWeight: '700' },
  termsText: {
    fontSize: 12, color: '#94A3B8', textAlign: 'center',
    paddingHorizontal: 32, marginTop: 16, lineHeight: 18,
  },
  termsLink: { color: '#1D4ED8', fontWeight: '600' },
});
