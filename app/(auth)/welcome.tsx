import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/Logo';
import { ShoppingBag, Truck, Shield, ArrowRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';

export default function WelcomeScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const { t } = useLanguage();
  const { width, height } = useWindowDimensions();
  const isSmall = height < 700;

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative circles */}
      <View style={[styles.circle1, { width: width * 1.3, height: width * 1.3, top: -width * 0.5, right: -width * 0.4 }]} />
      <View style={[styles.circle2, { width: width * 1.1, height: width * 1.1, bottom: -width * 0.4, left: -width * 0.3 }]} />

      <View style={[styles.content, { paddingHorizontal: width * 0.07 }]}>
        {/* Logo + Text */}
        <View style={styles.header}>
          <View style={{ marginBottom: isSmall ? 12 : 20 }}>
            <Logo size={isSmall ? 'medium' : 'large'} variant="light" />
          </View>
          <Text style={[styles.tagline, { fontSize: isSmall ? 20 : Math.min(width * 0.075, 30) }]}>
            {t.welcomeTagline || 'Global Sourcing,\nLocal Service'}
          </Text>
          <Text style={[styles.subtitle, { fontSize: isSmall ? 12 : 14 }]}>
            {t.welcomeSubtitle || 'Experience the future of marketplace.'}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresRow}>
          {[
            { icon: <ShoppingBag size={20} color={Colors.primary} />, label: t.globalReach || 'Global Reach' },
            { icon: <Truck size={20} color={Colors.success} />, label: t.fastDelivery || 'Fast Delivery' },
            { icon: <Shield size={20} color={Colors.accent} />, label: t.secureTrade || 'Secure Trade' },
          ].map((item, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.iconBox}>{item.icon}</View>
              <Text style={styles.featureLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.primaryButton, { height: isSmall ? 50 : 56 }]}
            activeOpacity={0.9}
            onPress={() => router.push('/(auth)/auth-options')}
          >
            <LinearGradient colors={Colors.gradients.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
              <Text style={styles.btnText}>Get Started</Text>
              <ArrowRight size={20} color={Colors.text.inverse} />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            By continuing, you agree to our <Text style={styles.link}>Terms &amp; Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute', borderRadius: 9999,
    backgroundColor: Colors.primary, opacity: 0.08,
  },
  circle2: {
    position: 'absolute', borderRadius: 9999,
    backgroundColor: Colors.primaryDark, opacity: 0.06,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 16,
  },
  header: { alignItems: 'center' },
  tagline: {
    fontWeight: '800', color: Colors.text.primary,
    textAlign: 'center', marginBottom: 10, lineHeight: 32, letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.text.tertiary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8,
  },
  featuresRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 12, borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.border.medium,
  },
  featureItem: { alignItems: 'center', flex: 1 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6, backgroundColor: Colors.background.tertiary,
  },
  featureLabel: { fontSize: 11, fontWeight: '700', color: Colors.text.primary, textAlign: 'center' },
  bottom: { alignItems: 'center', gap: 14 },
  primaryButton: {
    width: '100%', borderRadius: 16, overflow: 'hidden',
    elevation: 8, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12,
  },
  gradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { fontSize: 17, fontWeight: '700', color: Colors.text.inverse },
  footerText: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'center', lineHeight: 18 },
  link: { color: Colors.primary, fontWeight: '600' },
});
