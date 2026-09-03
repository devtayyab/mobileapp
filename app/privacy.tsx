import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

export default function PrivacyScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { t, language } = useLanguage();

  const handleBack = () => {
    if (router.canGoBack()) { (router.canGoBack() ? router.back() : router.replace('/')); }
    else { router.replace('/(tabs)/profile'); }
  };

  return (
    <View style={[styles.container, !!language.rtl && { direction: 'rtl' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} style={!!language.rtl && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.privacyPolicy || 'Privacy Policy'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>SATHUN GLOBAL PRIVACY POLICY</Text>

        <Text style={styles.heading}>1. Introduction</Text>
        <Text style={styles.paragraph}>SATHUN GLOBAL is committed to protecting user and seller data.</Text>

        <Text style={styles.heading}>2. Information Collected</Text>
        <Text style={styles.listItem}>• Name, email, phone number</Text>
        <Text style={styles.listItem}>• Address and location</Text>
        <Text style={styles.listItem}>• Payment information</Text>
        <Text style={styles.listItem}>• Product and transaction data</Text>

        <Text style={styles.heading}>3. Use of Data</Text>
        <Text style={styles.listItem}>• To operate the platform</Text>
        <Text style={styles.listItem}>• Process transactions</Text>
        <Text style={styles.listItem}>• Improve services</Text>
        <Text style={styles.listItem}>• Prevent fraud</Text>

        <Text style={styles.heading}>4. Data Sharing</Text>
        <Text style={styles.paragraph}>Data may be shared with sellers, payment providers, and legal authorities when required.</Text>

        <Text style={styles.heading}>5. Data Security</Text>
        <Text style={styles.paragraph}>We apply reasonable measures to protect data.</Text>

        <Text style={styles.heading}>6. International Processing</Text>
        <Text style={styles.paragraph}>Data may be processed globally due to the international nature of the platform.</Text>

        <Text style={styles.heading}>7. User Rights</Text>
        <Text style={styles.paragraph}>Users may request access, correction, or deletion of data.</Text>

        <Text style={styles.heading}>8. Updates</Text>
        <Text style={styles.paragraph}>Policy may be updated from time to time. Continued use implies acceptance.</Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1, borderBottomColor: Colors.border.medium,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  content: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, marginBottom: 24 },
  heading: {
    fontSize: 16, fontWeight: '700', color: Colors.primary,
    marginTop: 20, marginBottom: 8,
  },
  paragraph: { fontSize: 15, color: Colors.text.tertiary, lineHeight: 24, marginBottom: 8 },
  listItem: { fontSize: 15, color: Colors.text.tertiary, lineHeight: 24, marginLeft: 8, marginBottom: 4 },
});
