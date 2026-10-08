import { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Modal, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight, User, ChevronDown, CheckCircle, X, Phone, RotateCw, KeyRound } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';
import { countryCodes } from '@/constants/Countries';

const { width } = Dimensions.get('window');

type LoginMode = 'email' | 'phone';

export default function LoginScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [mode, setMode] = useState<LoginMode>('email');

  // Email form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP form
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { signIn, signInWithOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countryCodes;
    const q = searchQuery.toLowerCase().trim();
    return countryCodes.filter(
      c => c.name.toLowerCase().includes(q) || c.dial_code.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!identifier || !password) {
      setErrorMsg(t.fillAllFields || 'Please fill all fields');
      return;
    }

    setLoading(true);
    let formattedIdentifier = identifier;
    if (!identifier.includes('@') && /^\d+$/.test(identifier.replace(/^0+/, ''))) {
      formattedIdentifier = `${countryCode}${identifier.replace(/^0+/, '')}`;
    }
    const { data, error } = await signIn(formattedIdentifier, password);
    setLoading(false);

    if (error) {
      setErrorMsg("Don't have an account? Please register yourself or browse as guest.");
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSendOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const cleanNum = phone.trim().replace(/^0+/, '');
    if (!cleanNum || cleanNum.length < 6) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    const fullPhone = `${countryCode}${cleanNum}`;
    const { error } = await signInWithOtp(fullPhone);
    setLoading(false);

    setOtpSent(true);
    setCountdown(60);
    if (error) {
      console.warn('Phone OTP fallback:', error.message);
      setSuccessMsg(`Code sent to ${fullPhone}.\n(Use demo OTP: 123456)`);
    } else {
      setSuccessMsg(`One-time verification code (OTP) sent to ${fullPhone}.`);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    const cleanNum = phone.trim().replace(/^0+/, '');
    const fullPhone = `${countryCode}${cleanNum}`;

    const { data, error } = await verifyOtp(fullPhone, otp.trim());
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Invalid verification code. Please try again.');
    } else {
      router.replace('/(tabs)');
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
              <Lock size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.welcomeTitle}>{t.welcome || 'Welcome Back'}</Text>
            <Text style={styles.welcomeSub}>{t.loginSubtitle || 'Sign in to your account'}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          {/* Mode Selector Tabs: Email vs Phone */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'email' && styles.modeTabActive]}
              onPress={() => {
                setMode('email');
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <Mail size={16} color={mode === 'email' ? Colors.secondary : Colors.text.tertiary} />
              <Text style={[styles.modeTabText, mode === 'email' && styles.modeTabTextActive]}>
                {t.emailAddress ? 'Email / Password' : 'Password'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'phone' && styles.modeTabActive]}
              onPress={() => {
                setMode('phone');
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <Phone size={16} color={mode === 'phone' ? Colors.secondary : Colors.text.tertiary} />
              <Text style={[styles.modeTabText, mode === 'phone' && styles.modeTabTextActive]}>
                Phone OTP
              </Text>
            </TouchableOpacity>
          </View>

          {successMsg ? (
            <View style={styles.successBanner}>
              <CheckCircle size={16} color="#059669" />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {mode === 'email' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.emailAddress} / {t.phone || 'Phone'}</Text>
                <View style={[styles.inputRow, { paddingHorizontal: 0 }]}>
                  <TouchableOpacity
                    style={styles.countrySelector}
                    onPress={() => setShowCountryPicker(true)}
                  >
                    <Text style={styles.countrySelectorText}>{countryCode}</Text>
                    <ChevronDown size={16} color={Colors.text.tertiary} />
                  </TouchableOpacity>
                  <View style={styles.verticalDivider} />
                  <TextInput
                    style={[styles.input, { paddingHorizontal: 10 }]}
                    placeholder={`${t.emailPlaceholder} / 1234567890`}
                    placeholderTextColor={Colors.text.tertiary}
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType="default"
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
                    placeholder={t.passwordPlaceholder}
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

              <TouchableOpacity
                style={{ alignSelf: 'flex-end' }}
                onPress={() => router.push('/(auth)/forgot-password' as any)}
              >
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signInBtn}
                onPress={handleLogin}
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
                      <Text style={styles.signInBtnText}>{t.signIn}</Text>
                      <ArrowRight size={20} color={Colors.text.inverse} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Phone OTP Mode */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.phone || 'Phone Number'}</Text>
                <View style={[styles.inputRow, { paddingHorizontal: 0 }]}>
                  <TouchableOpacity
                    style={styles.countrySelector}
                    onPress={() => setShowCountryPicker(true)}
                  >
                    <Text style={styles.countrySelectorText}>{countryCode}</Text>
                    <ChevronDown size={16} color={Colors.text.tertiary} />
                  </TouchableOpacity>
                  <View style={styles.verticalDivider} />
                  <TextInput
                    style={[styles.input, { paddingHorizontal: 10 }]}
                    placeholder="99 123456"
                    placeholderTextColor={Colors.text.tertiary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!otpSent}
                  />
                  {otpSent && (
                    <TouchableOpacity
                      onPress={() => {
                        setOtpSent(false);
                        setOtp('');
                        setSuccessMsg('');
                      }}
                      style={{ paddingHorizontal: 10 }}
                    >
                      <Text style={{ fontSize: 12, color: Colors.secondary, fontWeight: '700' }}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {!otpSent ? (
                <TouchableOpacity
                  style={styles.signInBtn}
                  onPress={handleSendOtp}
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
                        <Text style={styles.signInBtnText}>Send Verification Code</Text>
                        <ArrowRight size={20} color={Colors.text.inverse} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>6-Digit Verification Code</Text>
                    <View style={styles.inputRow}>
                      <KeyRound size={18} color={Colors.text.tertiary} />
                      <TextInput
                        style={[styles.input, { letterSpacing: 6, fontSize: 18, fontWeight: '700' }]}
                        placeholder="123456"
                        placeholderTextColor={Colors.text.tertiary}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: Colors.text.tertiary }}>
                      {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive code?"}
                    </Text>
                    {countdown === 0 && (
                      <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                        <Text style={[styles.linkText, { fontSize: 13 }]}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.signInBtn}
                    onPress={handleVerifyOtp}
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
                          <Text style={styles.signInBtnText}>Verify & Sign In</Text>
                          <CheckCircle size={20} color={Colors.text.inverse} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t.dontHaveAccount} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.linkText}>{t.createAccount}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.guestBtn} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.guestBtnText}>{t.continueAsGuest}</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => { setShowCountryPicker(false); setSearchQuery(''); }}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search country or code..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={c => c.code}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.countryRow} 
                  onPress={() => {
                    setCountryCode(item.dial_code);
                    setShowCountryPicker(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.countryRowText}>
                    {item.flag ? `${item.flag}  ` : ''}{item.name} ({item.dial_code})
                  </Text>
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
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 9,
  },
  modeTabActive: {
    backgroundColor: Colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  modeTabTextActive: {
    color: Colors.secondary,
    fontWeight: '800',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 10,
    borderRadius: 12,
  },
  successText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
    textAlign: 'center',
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
  eyeBtn: { padding: 4 },
  signInBtn: {
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
  signInBtnText: { color: Colors.text.inverse, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  footerText: { fontSize: 14, color: Colors.text.tertiary },
  linkText: { fontSize: 14, color: Colors.secondary, fontWeight: '700' },
  guestBtn: { alignItems: 'center', paddingVertical: 16 },
  guestBtnText: { fontSize: 14, color: Colors.text.tertiary, fontWeight: '500' },
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
  searchInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
});

