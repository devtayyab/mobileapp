import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/Colors';

export default function TermsScreen() {
  const { t, language } = useLanguage();

  const handleBack = () => {
    if (router.canGoBack()) { router.back(); }
    else { router.replace('/(tabs)/profile'); }
  };

  return (
    <View style={[styles.container, !!language.rtl && { direction: 'rtl' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} style={!!language.rtl && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.termsConditions || 'Terms & Conditions'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>SATHUN TERMS AND CONDITIONS</Text>

        <Text style={styles.heading}>1. Introduction</Text>
        <Text style={styles.paragraph}>Welcome to SATHUN, a global dropshipping marketplace operated by Thakuri Brand, Cyprus. By using this platform, you agree to these Terms and Conditions.</Text>

        <Text style={styles.heading}>2. Platform Nature</Text>
        <Text style={styles.paragraph}>SATHUN is an international marketplace where sellers can list products for both retail and wholesale. The platform does not own, manufacture, or store any products.</Text>

        <Text style={styles.heading}>3. User Accounts</Text>
        <Text style={styles.paragraph}>Users must provide accurate information and maintain account security.</Text>

        <Text style={styles.heading}>4. Marketplace Model</Text>
        <Text style={styles.listItem}>• Sellers independently upload and manage their products</Text>
        <Text style={styles.listItem}>• Buyers can purchase products individually or in bulk</Text>
        <Text style={styles.listItem}>• Sellers set their own pricing, including wholesale pricing and minimum quantities</Text>

        <Text style={styles.heading}>5. Orders & Payments</Text>
        <Text style={styles.listItem}>• Customers make payments through the SATHUN platform</Text>
        <Text style={styles.listItem}>• Payments are securely processed via integrated payment systems</Text>
        <Text style={styles.listItem}>• SATHUN automatically deducts its commission before releasing payment to the seller</Text>

        <Text style={styles.heading}>6. Commission Structure</Text>
        <Text style={styles.listItem}>• Retail sales: 12% commission</Text>
        <Text style={styles.listItem}>• Wholesale sales: 8% commission</Text>

        <Text style={styles.heading}>7. Shipping (Dropshipping Model)</Text>
        <Text style={styles.listItem}>• Sellers are responsible for shipping products directly to customers</Text>
        <Text style={styles.listItem}>• Sellers must provide valid tracking information</Text>
        <Text style={styles.listItem}>• Delivery times are determined by the seller</Text>

        <Text style={styles.heading}>8. Returns & Refunds</Text>
        <Text style={styles.listItem}>• Sellers are responsible for handling returns and refunds</Text>
        <Text style={styles.listItem}>• SATHUN may assist but is not responsible</Text>

        <Text style={styles.heading}>9. Seller Responsibility</Text>
        <Text style={styles.listItem}>• Sellers must upload accurate product details, images, and pricing</Text>
        <Text style={styles.listItem}>• Sellers must ensure product authenticity and legality</Text>

        <Text style={styles.heading}>10. Prohibited Activities</Text>
        <Text style={styles.paragraph}>Illegal, counterfeit, or unsafe products are strictly prohibited.</Text>

        <Text style={styles.heading}>11. Limitation of Liability</Text>
        <Text style={styles.paragraph}>SATHUN is not responsible for product quality, delivery issues, or disputes.</Text>

        <Text style={styles.heading}>12. International Use</Text>
        <Text style={styles.paragraph}>The platform is designed for global use and may be accessed worldwide.</Text>

        <Text style={styles.heading}>13. Governing Law</Text>
        <Text style={styles.paragraph}>These Terms are governed by the laws of Cyprus.</Text>

        <Text style={styles.heading}>14. Updates</Text>
        <Text style={styles.paragraph}>SATHUN may update these Terms at any time.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
