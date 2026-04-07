import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save } from 'lucide-react-native';

export default function EditProfileScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCompanyName(profile.company_name || '');
      setTaxId(profile.tax_id || '');

      if (profile.address) {
        setStreet(profile.address.street || '');
        setCity(profile.address.city || '');
        setState(profile.address.state || '');
        setZipCode(profile.address.zipCode || '');
        setCountry(profile.address.country || '');
      }
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);

    try {
      const address = {
        street,
        city,
        state,
        zipCode,
        country,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          company_name: companyName,
          tax_id: taxId,
          address,
        })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshProfile();

      Alert.alert(t.success, t.profileUpdated, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t.error, t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.editProfile}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }]}>{t.personalInfo}</Text>

          <Text style={[styles.label, language.rtl && { textAlign: 'right' }]}>{t.fullName}</Text>
          <TextInput
            style={[styles.input, language.rtl && { textAlign: 'right' }]}
            placeholder={t.enterFullName}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={[styles.label, language.rtl && { textAlign: 'right' }]}>{t.phone}</Text>
          <TextInput
            style={[styles.input, language.rtl && { textAlign: 'right' }]}
            placeholder={t.phone}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={[styles.label, language.rtl && { textAlign: 'right' }]}>{t.email}</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled, language.rtl && { textAlign: 'right' }]}
            value={profile?.email}
            editable={false}
          />
        </View>

        {(profile?.role === 'b2b' || profile?.role === 'supplier') && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }]}>{t.businessInfo}</Text>

            <Text style={[styles.label, language.rtl && { textAlign: 'right' }]}>{t.companyName}</Text>
            <TextInput
              style={[styles.input, language.rtl && { textAlign: 'right' }]}
              placeholder={t.companyName}
              value={companyName}
              onChangeText={setCompanyName}
            />

            <Text style={[styles.label, language.rtl && { textAlign: 'right' }]}>{t.taxId}</Text>
            <TextInput
              style={[styles.input, language.rtl && { textAlign: 'right' }]}
              placeholder={t.taxId}
              value={taxId}
              onChangeText={setTaxId}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }]}>{t.address}</Text>

          <Text style={[styles.label, language.rtl && { textAlign: 'right' }]}>{t.streetAddress}</Text>
          <TextInput
            style={[styles.input, language.rtl && { textAlign: 'right' }]}
            placeholder={t.streetAddress}
            value={street}
            onChangeText={setStreet}
          />

          <Text style={[styles.label, language.rtl && { textAlign: 'right' }]}>{t.city}</Text>
          <TextInput
            style={[styles.input, language.rtl && { textAlign: 'right' }]}
            placeholder={t.city}
            value={city}
            onChangeText={setCity}
          />

          <View style={[styles.row, language.rtl && { flexDirection: 'row-reverse' }]}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, language.rtl && { textAlign: 'right' }]}>{t.state}</Text>
              <TextInput
                style={[styles.input, language.rtl && { textAlign: 'right' }]}
                placeholder={t.state}
                value={state}
                onChangeText={setState}
              />
            </View>

            <View style={styles.halfWidth}>
              <Text style={[styles.label, language.rtl && { textAlign: 'right' }]}>{t.zipCode}</Text>
              <TextInput
                style={[styles.input, language.rtl && { textAlign: 'right' }]}
                placeholder={t.zipCode}
                value={zipCode}
                onChangeText={setZipCode}
              />
            </View>
          </View>

          <Text style={[styles.label, language.rtl && { textAlign: 'right' }]}>{t.country}</Text>
          <TextInput
            style={[styles.input, language.rtl && { textAlign: 'right' }]}
            placeholder={t.country}
            value={country}
            onChangeText={setCountry}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Save size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>{t.save}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
