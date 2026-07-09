import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Modal, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight, User, ShoppingBag, Briefcase, Store, ChevronDown, CheckCircle, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';
import { countryCodes } from '@/constants/Countries';

const { width } = Dimensions.get('window');

type UserRole = 'customer' | 'b2b' | 'supplier';

export default function RegisterScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+1');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const ROLES: Array<{ key: UserRole; label: string; sub: string; icon: any; color: string; bg: string }> = [
    // Each role shows its own theme's brand color (Customer=green, B2B=pink, Supplier=blue).
    { key: 'customer', label: 'Customer', sub: '(Shop)', icon: ShoppingBag, color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' },
    { key: 'b2b', label: 'Wholesale', sub: '(B2B)', icon: Briefcase, color: '#FF4D8D', bg: 'rgba(255, 77, 141, 0.1)' },
    { key: 'supplier', label: 'Retailer', sub: 'Sell products', icon: Store, color: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)' },
  ];

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(t.error, t.nameRequired);
      return;
    }
    if (!email || !phone || !password || !confirmPassword) {
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
    const fullPhone = `${countryCode}${phone.replace(/^0+/, '')}`;
    const { error } = await signUp(email, fullPhone, password, role, name.trim());
    setLoading(false);

    if (error) {
      Alert.alert(t.registrationFailed, error.message);
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.container as any}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.topContent}>
            <View style={styles.iconWrap}>
              <User size={24} color={Colors.secondary} />
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
            <Text style={styles.label}>{t.emailAddress === 'Email Address' ? 'Email' : t.emailAddress} <Text style={{ color: Colors.secondary }}>*</Text></Text>
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
            <Text style={styles.label}>{t.phone || 'Phone Number'} <Text style={{ color: Colors.secondary }}>*</Text></Text>
            <View style={[styles.inputRow, { paddingHorizontal: 0, paddingVertical: 0 }]}>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.countrySelectorText}>{countryCode}</Text>
                <ChevronDown size={16} color={Colors.text.tertiary} />
              </TouchableOpacity>
              <View style={styles.verticalDivider} />
              <TextInput
                style={[styles.input, { paddingVertical: 10, paddingHorizontal: 10 }]}
                placeholder="1234567890"
                placeholderTextColor={Colors.text.tertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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

      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryCodes}
              keyExtractor={c => c.code}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.countryRow} 
                  onPress={() => {
                    setCountryCode(item.dial_code);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryRowText}>{item.name} ({item.dial_code})</Text>
                  {countryCode === item.dial_code && <CheckCircle size={20} color={Colors.secondary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scrollContent: { flexGrow: 1 },
  topSection: {
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
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
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: Colors.text.primary, letterSpacing: -1 },
  welcomeSub: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center' },
  formCard: {
    backgroundColor: Colors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  roleSection: { gap: 8 },
  roleGrid: { flexDirection: 'row', gap: 8 },
  roleCard: {
    flex: 1, alignItems: 'center', padding: 8, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.border.medium, gap: 4,
    backgroundColor: Colors.background.primary,
  },
  roleIcon: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 2,
  },
  roleLabel: { fontSize: 12, fontWeight: '800' },
  roleSub: { fontSize: 10, color: Colors.text.tertiary, textAlign: 'center' },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text.primary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background.primary, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colors.border.medium,
  },
  input: { flex: 1, fontSize: 14, color: Colors.text.secondary },
  eyeBtn: { padding: 4 },
  createBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
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
  createBtnText: { color: Colors.text.inverse, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  footerText: { fontSize: 14, color: Colors.text.tertiary },
  linkText: { fontSize: 14, color: Colors.secondary, fontWeight: '700' },
  termsText: {
    fontSize: 12, color: Colors.text.tertiary, textAlign: 'center',
    paddingHorizontal: 20, marginTop: 12, lineHeight: 18,
  },
  termsLink: { color: Colors.secondary, fontWeight: '600' },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  countrySelectorText: { fontSize: 14, color: Colors.text.secondary, fontWeight: '600' },
  verticalDivider: { width: 1, height: '60%', backgroundColor: Colors.border.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  countryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  countryRowText: { fontSize: 16, color: Colors.text.secondary },
});

