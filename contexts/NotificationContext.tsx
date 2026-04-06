import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Bell, ShoppingBag, Truck, Info, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  payload: any;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
  };

  const subscribeToNotifications = () => {
    if (!user) return;
    
    return supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          showToast(newNotif);
        }
      )
      .subscribe();
  };

  const showToast = (notif: Notification) => {
    setActiveToasts(prev => [...prev, notif]);
    // Auto remove after 6 seconds
    setTimeout(() => {
      removeToast(notif.id);
    }, 6000);
  };

  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
      {/* Toast Layer */}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {activeToasts.map((toast, index) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </View>
    </NotificationContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Notification, onDismiss: () => void }) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 20,
      useNativeDriver: true,
      tension: 40,
      friction: 7
    }).start();
  }, []);

  const getIcon = () => {
    switch (toast.type) {
      case 'new_order': return <ShoppingBag size={20} color="#1D4ED8" />;
      case 'order_status': return <Truck size={20} color="#059669" />;
      case 'new_product': return <Bell size={20} color="#EA580C" />;
      default: return <Info size={20} color="#6B7280" />;
    }
  };

  const handlePress = () => {
    if (toast.payload?.order_id) {
      router.push('/(tabs)/orders' as any);
    } else if (toast.payload?.product_id) {
      router.push(`/product/${toast.payload.product_id}` as any);
    }
    onDismiss();
  };

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity style={styles.toastInner} onPress={handlePress}>
        <View style={styles.toastIconWrap}>{getIcon()}</View>
        <View style={styles.toastTextWrap}>
          <Text style={styles.toastTitle} numberOfLines={1}>{toast.title}</Text>
          <Text style={styles.toastMsg} numberOfLines={2}>{toast.message}</Text>
        </View>
        <TouchableOpacity style={styles.toastClose} onPress={onDismiss}>
          <X size={16} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    gap: 10,
  },
  toast: {
    width: width - 40,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  toastIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastTextWrap: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  toastMsg: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  toastClose: {
    padding: 4,
  },
});
