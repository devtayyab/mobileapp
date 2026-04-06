import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Bell, ShoppingBag, Truck, Info, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotificationsScreen() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { t, language } = useLanguage();

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <ShoppingBag size={22} color="#1D4ED8" />;
      case 'order_status': return <Truck size={22} color="#059669" />;
      case 'new_product': return <Bell size={22} color="#EA580C" />;
      default: return <Info size={22} color="#6B7280" />;
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
            <ArrowLeft size={24} color="#111827" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.notifications || 'Notifications'}</Text>
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <CheckCircle2 size={20} color="#1D4ED8" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFF', paddingTop: 60, paddingBottom: 16,
    paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  markAllBtn: { padding: 4 },
  list: { padding: 16 },
  notifItem: {
    flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', gap: 14,
    alignItems: 'center',
  },
  unreadItem: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
  },
  textWrap: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 2 },
  unreadTitle: { color: '#0F172A', fontWeight: '700' },
  notifMsg: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  notifTime: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 12 },
  emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
});
