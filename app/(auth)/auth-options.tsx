import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/Logo';
import { ArrowRight } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AuthOptionsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { width, height } = useWindowDimensions();
  const isSmall = height < 700;

  return (
    <SafeAreaView style={styles.container as any}>
      {/* Decorative circles */}
      <View style={[styles.circle1, { width: width * 1.3, height: width * 1.3, top: -width * 0.5, right: -width * 0.4 }]} />
      <View style={[styles.circle2, { width: width * 1.1, height: width * 1.1, bottom: -width * 0.4, left: -width * 0.3 }]} />

      <View style={[styles.content, { paddingHorizontal: width * 0.07 }]}>
        {/* Logo + Text */}
        <View style={styles.header}>
          <View style={{ marginBottom: isSmall ? 12 : 20 }}>
            <Logo size={isSmall ? 'medium' : 'large'} variant="light" />
          </View>
          <Text style={[styles.title, { fontSize: isSmall ? 22 : Math.min(width * 0.085, 34) }]}>
            {t.welcomeBack || 'Welcome Back'}
          </Text>
          <Text style={[styles.subtitle, { fontSize: isSmall ? 12 : 14 }]}>
            {t.authOptionsSubtitle || 'Join the most exclusive marketplace for professionals and businesses.'}
          </Text>
        </View>

        {/* Buttons */}
        <View style={[styles.actions, { gap: isSmall ? 10 : 14 }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { height: isSmall ? 50 : 56 }]}
            activeOpacity={0.9}
            onPress={() => router.push('/(auth)/login')}
          >
            <LinearGradient colors={Colors.gradients.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
              <Text style={styles.primaryBtnText}>{t.signIn || 'Sign In'}</Text>
              <ArrowRight size={20} color={Colors.text.inverse} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { height: isSmall ? 50 : 56 }]}
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.secondaryBtnText}>{t.createAccount || 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.guestBtnText}>{t.browseAsGuest || 'Browse as Guest'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 28,
    paddingBottom: 24,
  },
  header: { alignItems: 'center' },
  title: {
    fontWeight: '800', color: Colors.text.primary,
    textAlign: 'center', marginBottom: 12, letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.text.tertiary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8,
  },
  actions: { width: '100%' },
  primaryButton: {
    width: '100%', borderRadius: 16, overflow: 'hidden',
    elevation: 8, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12,
  },
  gradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: Colors.text.inverse },
  secondaryButton: {
    width: '100%', borderRadius: 16, borderWidth: 1.5,
    borderColor: Colors.border.dark, backgroundColor: Colors.background.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 17, fontWeight: '700', color: Colors.text.primary },
  guestButton: { paddingVertical: 12, alignItems: 'center' },
  guestBtnText: { fontSize: 14, color: Colors.text.tertiary, fontWeight: '600' },
});
