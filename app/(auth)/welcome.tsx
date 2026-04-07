import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '@/components/Logo';
import { ShoppingBag, Truck, Shield, ArrowRight, User } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();

  return (
    <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#111827']}
        style={styles.background}
      >
        {/* Dynamic Background Circles */}
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />

        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Logo size="large" variant="light" />
            </View>
            <Text style={styles.tagline}>
              {t.welcomeTagline}
            </Text>
            <Text style={styles.subtitle}>
              {t.welcomeSubtitle}
            </Text>
          </View>

          {/* Features Illustration */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <ShoppingBag size={24} color="#60A5FA" />
              </View>
              <Text style={styles.featureTitle}>{t.globalReach}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.featureItem}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Truck size={24} color="#34D399" />
              </View>
              <Text style={styles.featureTitle}>{t.fastDelivery}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.featureItem}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Shield size={24} color="#A78BFA" />
              </View>
              <Text style={styles.featureTitle}>{t.secureTrade}</Text>
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/login')}
            >
              <LinearGradient
                colors={['#4F46E5', '#4338CA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.primaryButtonText}>{t.signIn}</Text>
                <ArrowRight size={20} color="#FFF" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.secondaryButtonText}>{t.createAccount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.guestButtonText}>{t.browseAsGuest}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t.termsAndPrivacy}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    overflow: 'hidden', // This is key to fix side scrolling
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  bgCircle1: {
    width: width, // Reduced from width * 1.2 to be safer
    height: width,
    backgroundColor: '#4F46E5',
    top: -width * 0.4,
    left: -width * 0.1,
  },
  bgCircle2: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: '#06B6D4',
    bottom: -width * 0.1,
    right: -width * 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  logoWrapper: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagline: {
    fontSize: 24,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  guestButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
  },
  linkText: {
    color: '#64748B',
    textDecorationLine: 'underline',
  },
});
