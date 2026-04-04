import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { ArrowLeft, Bell, Lock, Eye, Globe, Check } from 'lucide-react-native';
import { useLanguage, LANGUAGES, Language } from '@/contexts/LanguageContext';
import { useCurrency, CURRENCIES, Currency } from '@/contexts/CurrencyContext';

export default function SettingsScreen() {
  const { language, t, setLanguage } = useLanguage();
  const { currency: activeCurrency, setCurrency } = useCurrency();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const handleLanguageSelect = async (lang: Language) => {
    await setLanguage(lang);
    setLangModalVisible(false);
  };

  const handleCurrencySelect = async (curr: Currency) => {
    await setCurrency(curr);
    setCurrencyModalVisible(false);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <View style={[styles.container, !!language.rtl && { direction: 'rtl' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" style={!!language.rtl && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.settings}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>{t.notifications || 'Notifications'}</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t.pushNotifications || 'Push Notifications'}</Text>
              <Text style={styles.settingDescription}>Receive push notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#D1D5DB', true: '#007AFF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t.emailNotifications || 'Email Notifications'}</Text>
              <Text style={styles.settingDescription}>Receive email updates</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#D1D5DB', true: '#007AFF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t.orderUpdates || 'Order Updates'}</Text>
              <Text style={styles.settingDescription}>Get notified about orders</Text>
            </View>
            <Switch
              value={orderUpdates}
              onValueChange={setOrderUpdates}
              trackColor={{ false: '#D1D5DB', true: '#007AFF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t.promotions || 'Promotions'}</Text>
              <Text style={styles.settingDescription}>Receive promotional offers</Text>
            </View>
            <Switch
              value={promotions}
              onValueChange={setPromotions}
              trackColor={{ false: '#D1D5DB', true: '#007AFF' }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>{t.privacy || 'Privacy & Security'}</Text>
          </View>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Lock size={20} color="#6B7280" />
              <Text style={styles.menuItemText}>{t.changePassword || 'Change Password'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Eye size={20} color="#6B7280" />
              <Text style={styles.menuItemText}>{t.privacySettings || 'Privacy Settings'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>{t.general || 'General'}</Text>
          </View>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setLangModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <Globe size={20} color="#6B7280" />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>{t.language || 'Language'}</Text>
                <Text style={styles.menuItemSubtext}>{language?.flag} {language?.nativeName}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setCurrencyModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.currencyIcon}>{activeCurrency?.symbol || '$'}</Text>
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>{t.currency || 'Currency'}</Text>
                <Text style={styles.menuItemSubtext}>{activeCurrency?.code || 'USD'}</Text>
              </View>
            </View>
            <View style={{ width: 20 }}>
              <Check size={20} color="transparent" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={langModalVisible}
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectLanguage || 'Select Language'}</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Text style={styles.closeText}>{t.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.langItem}
                  onPress={() => handleLanguageSelect(item)}
                >
                  <View style={styles.langItemLeft}>
                    <Text style={styles.langFlag}>{item.flag}</Text>
                    <View>
                      <Text style={styles.langName}>{item.nativeName}</Text>
                      <Text style={styles.langSubName}>{item.name}</Text>
                    </View>
                  </View>
                  {language?.code === item.code && (
                    <Check size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={currencyModalVisible}
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.currency || 'Currency'}</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Text style={styles.closeText}>{t.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.langItem}
                  onPress={() => handleCurrencySelect(item)}
                >
                  <View style={styles.langItemLeft}>
                    <Text style={styles.langFlag}>{item.flag}</Text>
                    <View>
                      <Text style={styles.langName}>{item.name}</Text>
                      <Text style={styles.langSubName}>{item.code} ({item.symbol})</Text>
                    </View>
                  </View>
                  {activeCurrency?.code === item.code && (
                    <Check size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  menuItemSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  currencyIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    width: 30,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  langItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  langFlag: {
    fontSize: 28,
  },
  langName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  langSubName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});
