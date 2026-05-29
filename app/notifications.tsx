import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Bell, ShoppingBag, Truck, Info, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Palette } from '@/constants/Colors';

export default function NotificationsScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { t, language } = useLanguage();

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <ShoppingBag size={22} color={Colors.primary} />;
      case 'order_status': return <Truck size={22} color={Colors.success} />;
      case 'new_product': return <Bell size={22} color={Colors.warning} />;
      default: return <Info size={22} color={Colors.text.tertiary} />;
    }
  };

  const handleNotifPress = (notif: any) => {
    markAsRead(notif.id);
    if (notif.payload?.order_id) {
      router.push('/(tabs)/orders' as any);
    } else if (notif.payload?.product_id) {
      router.push(`/product/${notif.payload.product_id}` as any);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.notifItem, !item.is_read && styles.unreadItem]} 
      onPress={() => handleNotifPress(item)}
    >
      <View style={styles.iconWrap}>{getIcon(item.type)}</View>
      <View style={styles.textWrap}>
        <Text style={[styles.notifTitle, !item.is_read && styles.unreadTitle]}>{item.title}</Text>
        <Text style={styles.notifMsg}>{item.message}</Text>
        <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={Colors.text.primary} style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.notifications || 'Notifications'}</Text>
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <CheckCircle2 size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (Colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    backgroundColor: Colors.background.secondary, paddingTop: 60, paddingBottom: 16,
    paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.border.medium,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  markAllBtn: { padding: 4 },
  list: { padding: 16 },
  notifItem: {
    flexDirection: 'row', backgroundColor: Colors.background.secondary, padding: 16, borderRadius: 16,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border.medium, gap: 14,
    alignItems: 'center',
  },
  unreadItem: { backgroundColor: Colors.background.tertiary, borderColor: Colors.primary },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.background.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  textWrap: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  unreadTitle: { color: Colors.text.secondary, fontWeight: '700' },
  notifMsg: { fontSize: 13, color: Colors.text.tertiary, lineHeight: 18 },
  notifTime: { fontSize: 11, color: Colors.text.tertiary, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 12 },
  emptyText: { fontSize: 16, color: Colors.text.tertiary, fontWeight: '500' },
});
