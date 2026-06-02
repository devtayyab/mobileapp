import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe, Truck, ShieldCheck, ArrowRight } from 'lucide-react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  RadialGradient,
  Stop,
  Rect,
  Ellipse,
} from 'react-native-svg';
import { useLanguage } from '../../contexts/LanguageContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { width, height } = useWindowDimensions();
  const isSmall = height < 700;

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* ========= FULL-SCREEN BACKGROUND WITH GOLDEN STREAKS ========= */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            {/* Deep navy-to-black radial gradient background */}
            <RadialGradient id="bgRadial" cx="50%" cy="40%" rx="80%" ry="70%">
              <Stop offset="0%" stopColor="#000000" />
              <Stop offset="60%" stopColor="#000000" />
              <Stop offset="100%" stopColor="#000000" />
            </RadialGradient>

            {/* Gold streak gradient */}
            <SvgGradient id="goldStreak1" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFD700" stopOpacity="0" />
              <Stop offset="20%" stopColor="#FFD700" stopOpacity="0.6" />
              <Stop offset="50%" stopColor="#FFA500" stopOpacity="0.8" />
              <Stop offset="80%" stopColor="#FFD700" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </SvgGradient>

            <SvgGradient id="goldStreak2" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFE066" stopOpacity="0" />
              <Stop offset="30%" stopColor="#FFD700" stopOpacity="0.4" />
              <Stop offset="60%" stopColor="#DAA520" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </SvgGradient>

            {/* Purple/violet streak gradient */}
            <SvgGradient id="purpleStreak" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#9400D3" stopOpacity="0" />
              <Stop offset="30%" stopColor="#8B00FF" stopOpacity="0.5" />
              <Stop offset="60%" stopColor="#9D4EDD" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#6A0DAD" stopOpacity="0" />
            </SvgGradient>

            {/* Cyan accent streak */}
            <SvgGradient id="cyanStreak" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#00CED1" stopOpacity="0" />
              <Stop offset="40%" stopColor="#00F0FF" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#00CED1" stopOpacity="0" />
            </SvgGradient>

            {/* Bottom wave dark gradient */}
            <SvgGradient id="bottomWave" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#0D1B3E" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#020312" stopOpacity="0.95" />
            </SvgGradient>
          </Defs>

          {/* Full background fill */}
          <Rect x="0" y="0" width={width} height={height} fill="url(#bgRadial)" />

          {/* ---- LEFT SIDE GOLDEN LIGHT STREAKS ---- */}
          {/* Primary bold gold curve - left */}
          <Path
            d={`M -30,${height * 0.08} Q ${width * 0.15},${height * 0.25} -20,${height * 0.55}`}
            stroke="url(#goldStreak1)"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Secondary thinner gold curve - left */}
          <Path
            d={`M -15,${height * 0.12} Q ${width * 0.12},${height * 0.3} -10,${height * 0.5}`}
            stroke="url(#goldStreak2)"
            strokeWidth="1.2"
            fill="none"
          />
          {/* Tertiary dotted gold - left */}
          <Path
            d={`M -5,${height * 0.15} Q ${width * 0.08},${height * 0.32} 5,${height * 0.48}`}
            stroke="url(#goldStreak2)"
            strokeWidth="0.8"
            strokeDasharray="3,5"
            fill="none"
            opacity="0.5"
          />

          {/* ---- LEFT BOTTOM PURPLE WAVE ---- */}
          <Path
            d={`M -20,${height * 0.65} Q ${width * 0.2},${height * 0.72} ${width * 0.05},${height * 0.85} Q -10,${height * 0.92} -20,${height}`}
            stroke="url(#purpleStreak)"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d={`M -10,${height * 0.68} Q ${width * 0.15},${height * 0.75} ${width * 0.02},${height * 0.88}`}
            stroke="url(#purpleStreak)"
            strokeWidth="0.8"
            fill="none"
            opacity="0.4"
          />

          {/* ---- RIGHT SIDE GOLDEN LIGHT STREAKS ---- */}
          {/* Primary bold gold curve - right */}
          <Path
            d={`M ${width + 30},${height * 0.05} Q ${width * 0.82},${height * 0.22} ${width + 20},${height * 0.5}`}
            stroke="url(#goldStreak1)"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Secondary thinner gold - right */}
          <Path
            d={`M ${width + 15},${height * 0.1} Q ${width * 0.85},${height * 0.28} ${width + 10},${height * 0.48}`}
            stroke="url(#goldStreak2)"
            strokeWidth="1.2"
            fill="none"
          />
          {/* Cyan accent - right side */}
          <Path
            d={`M ${width + 10},${height * 0.15} Q ${width * 0.88},${height * 0.35} ${width + 5},${height * 0.52}`}
            stroke="url(#cyanStreak)"
            strokeWidth="0.8"
            fill="none"
          />

          {/* ---- RIGHT BOTTOM GOLDEN WAVE ---- */}
          <Path
            d={`M ${width + 20},${height * 0.6} Q ${width * 0.78},${height * 0.7} ${width * 0.9},${height * 0.82} Q ${width + 10},${height * 0.9} ${width + 20},${height}`}
            stroke="url(#goldStreak1)"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d={`M ${width + 10},${height * 0.63} Q ${width * 0.82},${height * 0.73} ${width * 0.92},${height * 0.85}`}
            stroke="url(#goldStreak2)"
            strokeWidth="0.8"
            fill="none"
            opacity="0.5"
          />

          {/* ---- BOTTOM WAVY DARK OVERLAY ---- */}
          <Path
            d={`M 0,${height * 0.78} Q ${width * 0.25},${height * 0.75} ${width * 0.5},${height * 0.8} Q ${width * 0.75},${height * 0.85} ${width},${height * 0.78} L ${width},${height} L 0,${height} Z`}
            fill="url(#bottomWave)"
            opacity="0.5"
          />

          {/* ---- AMBIENT GLOW SPOTS ---- */}
          {/* Top center warm golden glow for logo area */}
          <Ellipse cx={width / 2} cy={height * 0.18} rx={width * 0.45} ry={height * 0.15} fill="#FFD700" opacity="0.04" />
          {/* Bottom purple ambient */}
          <Ellipse cx={width * 0.3} cy={height * 0.9} rx={width * 0.4} ry={height * 0.12} fill="#7B2FBE" opacity="0.06" />
          {/* Right gold ambient */}
          <Ellipse cx={width * 0.85} cy={height * 0.35} rx={width * 0.2} ry={height * 0.15} fill="#DAA520" opacity="0.04" />
        </Svg>
      </View>

      {/* ========= SCROLLABLE CONTENT ========= */}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: width * 0.07, minHeight: height - 60 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* ========= LOGO SECTION ========= */}
          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/logo1.jpg')}
              style={{
                width: isSmall ? 300 : 380,
                height: isSmall ? 300 : 380,
              }}
              resizeMode="contain"
            />
          </View>

          {/* ========= TAGLINE ========= */}
          <View style={styles.taglineSection}>
            <Text style={[styles.tagline, { fontSize: isSmall ? 14 : 16 }]}>
              Empowering{' '}
              <Text style={styles.cyanHighlight}>Your Business,</Text>
              {'\n'}Connecting{' '}
              <Text style={styles.purpleHighlight}>Markets.</Text>
            </Text>
            <Text style={[styles.subtitle, { fontSize: isSmall ? 10 : 11 }]}>
              Discover a seamless multi-vendor marketplace{'\n'}designed for efficiency and growth.
            </Text>
          </View>

          {/* ========= FEATURES ROW ========= */}
          <View style={styles.featuresCard}>
            {/* Sparkle border dots - top left */}
            <View style={[styles.sparkle, { top: -2, left: 20 }]} />
            <View style={[styles.sparkle, { top: -2, right: 20 }]} />
            <View style={[styles.sparkle, { bottom: -2, left: width * 0.2 }]} />
            <View style={[styles.sparkle, { bottom: -2, right: width * 0.2 }]} />

            <View style={styles.featureItem}>
              <View style={styles.featureIconCircle}>
                <Globe size={18} color="#DAA520" strokeWidth={1.8} />
              </View>
              <Text style={styles.featureLabel}>Global Reach</Text>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureItem}>
              <View style={styles.featureIconCircle}>
                <Truck size={18} color="#DAA520" strokeWidth={1.8} />
              </View>
              <Text style={styles.featureLabel}>Fast Delivery</Text>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureItem}>
              <View style={[styles.featureIconCircle, styles.featureIconCirclePurple]}>
                <ShieldCheck size={18} color="#C77DFF" strokeWidth={1.8} />
              </View>
              <Text style={styles.featureLabel}>Secure Trade</Text>
            </View>
          </View>

          {/* ========= ACTION BUTTONS ========= */}
          <View style={styles.buttonsSection}>
            {/* Sign In - Primary CTA */}
            <TouchableOpacity
              style={styles.signInBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(auth)/login')}
            >
              <LinearGradient
                colors={['#0D0D2B', '#0A0A25', '#0D0D2B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInGradient}
              >
                <Text style={styles.signInText}>Sign In</Text>
                <Text style={styles.signInArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Create Account - Outlined */}
            <TouchableOpacity
              style={styles.createAccountBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>

            {/* Browse as Guest */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace('/(tabs)')}
              style={styles.guestBtn}
            >
              <Text style={styles.guestText}>Browse as Guest</Text>
            </TouchableOpacity>

            {/* Terms Footer */}
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.termsLink}
                onPress={() => router.push('/terms' as any)}
              >
                Terms &amp; Privacy Policy
              </Text>
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 24,
  },

  /* ---- Logo ---- */
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  /* ---- Tagline ---- */
  taglineSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  tagline: {
    fontWeight: '800',
    color: '#F59E0B',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  cyanHighlight: {
    color: '#00D4FF',
    fontStyle: 'italic',
    fontWeight: '800',
    textShadowColor: 'rgba(0, 212, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  purpleHighlight: {
    color: '#C77DFF',
    fontWeight: '800',
    textShadowColor: 'rgba(199, 125, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    color: '#9CA3B8',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '400',
    letterSpacing: 0.1,
  },

  /* ---- Features Card ---- */
  featuresCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(200, 162, 78, 0.2)',
    marginTop: 18,
    position: 'relative',
    overflow: 'visible',
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD700',
    opacity: 0.7,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  featureIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(218, 165, 32, 0.1)',
    borderWidth: 1.8,
    borderColor: 'rgba(218, 165, 32, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  featureIconCirclePurple: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderColor: 'rgba(157, 78, 221, 0.45)',
    shadowColor: '#9D4EDD',
  },
  featureLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D4C5A0',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  featureDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(200, 162, 78, 0.15)',
  },

  /* ---- Buttons ---- */
  buttonsSection: {
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  signInBtn: {
    width: '100%',
    height: 50,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(218, 165, 32, 0.6)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    letterSpacing: 1.5,
  },
  signInArrow: {
    fontSize: 20,
    fontWeight: '400',
    color: '#F59E0B',
  },
  createAccountBtn: {
    width: '100%',
    height: 50,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6A3DE8',
    backgroundColor: 'transparent',
    shadowColor: '#6A3DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  createAccountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A67FFF',
    letterSpacing: 0.8,
  },
  guestBtn: {
    paddingVertical: 0,
  },
  guestText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 11,
    color: '#6B7188',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 0,
  },
  termsLink: {
    color: '#F59E0B',
    fontWeight: '600',
  },
});
