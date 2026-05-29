import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight, User, ShoppingBag, Briefcase, Store } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type UserRole = 'customer' | 'b2b' | 'supplier';

export default function RegisterScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const ROLES: Array<{ key: UserRole; label: string; sub: string; icon: any; color: string; bg: string }> = [
    // Each role shows its own theme's brand color (Customer=green, B2B=pink, Supplier=blue).
    { key: 'customer', label: t.customerRole || 'Buyer', sub: t.customerSub || 'Shop products', icon: ShoppingBag, color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' },
    { key: 'b2b', label: t.wholesaleRole || 'B2B', sub: t.wholesaleSub || 'Business trade', icon: Briefcase, color: '#FF4D8D', bg: 'rgba(255, 77, 141, 0.1)' },
    { key: 'supplier', label: t.supplierRole || 'Supplier', sub: t.supplierSub || 'Sell products', icon: Store, color: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)' },
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
      router.push('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.topContent}>
            <View style={styles.iconWrap}>
              <User size={32} color={Colors.secondary} />
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
                  style={[styles.roleCard, role === key && { borderColor: color, backgroundColor: 'rgba(255,255,255,0.02)' }]}
                  onPress={() => setRole(key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIcon, { backgroundColor: role === key ? bg : Colors.background.primary }]}>
                    <Icon size={18} color={role === key ? color : Colors.text.tertiary} />
                  </View>
                  <Text style={[styles.roleLabel, { color: role === key ? color : Colors.text.primary }]}>{label}</Text>
                  <Text style={styles.roleSub}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.fullName} <Text style={{ color: Colors.secondary }}>*</Text></Text>
            <View style={styles.inputRow}>
              <User size={18} color={Colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder={t.enterFullName}
                placeholderTextColor={Colors.text.tertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.emailAddress}</Text>
            <View style={styles.inputRow}>
              <Mail size={18} color={Colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.password}</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color={Colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder={t.atLeast6Chars}
                placeholderTextColor={Colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={18} color={Colors.text.tertiary} /> : <Eye size={18} color={Colors.text.tertiary} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.confirmPassword}</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color={Colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder={t.reEnterPassword}
                placeholderTextColor={Colors.text.tertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={Colors.gradients.premium}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              {loading ? (
                <ActivityIndicator color={Colors.text.inverse} />
              ) : (
                <>
                  <Text style={styles.createBtnText}>{t.createAccount}</Text>
                  <ArrowRight size={20} color={Colors.text.inverse} />
                </>
              )}
            </LinearGradient>
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
        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scrollContent: { flexGrow: 1 },
  topSection: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  topContent: { alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 70, height: 70, borderRadius: 24,
    backgroundColor: 'rgba(0, 168, 107, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  welcomeTitle: { fontSize: 30, fontWeight: '800', color: Colors.text.primary, letterSpacing: -1 },
  welcomeSub: { fontSize: 16, color: Colors.text.tertiary, textAlign: 'center' },
  formCard: {
    backgroundColor: Colors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  roleSection: { gap: 12 },
  roleGrid: { flexDirection: 'row', gap: 8 },
  roleCard: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.border.medium, gap: 6,
    backgroundColor: Colors.background.primary,
  },
  roleIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 2,
  },
  roleLabel: { fontSize: 12, fontWeight: '800' },
  roleSub: { fontSize: 10, color: Colors.text.tertiary, textAlign: 'center' },
  inputGroup: { gap: 10 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text.primary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background.primary, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.border.medium,
  },
  input: { flex: 1, fontSize: 16, color: Colors.text.secondary },
  eyeBtn: { padding: 4 },
  createBtn: {
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  createBtnText: { color: Colors.text.inverse, fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  footerText: { fontSize: 15, color: Colors.text.tertiary },
  linkText: { fontSize: 15, color: Colors.secondary, fontWeight: '700' },
  termsText: {
    fontSize: 12, color: Colors.text.tertiary, textAlign: 'center',
    paddingHorizontal: 32, marginTop: 20, lineHeight: 18,
  },
  termsLink: { color: Colors.secondary, fontWeight: '600' },
});

