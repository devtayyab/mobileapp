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
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight, User, ChevronDown, CheckCircle, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';
import { countryCodes } from '@/constants/Countries';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+1');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert(t.error, t.fillAllFields);
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
      Alert.alert(t.loginFailed, error.message);
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.emailAddress} / {t.phone || 'Phone'}</Text>
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
});

