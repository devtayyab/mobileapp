import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, MapPin, CreditCard, CheckCircle, Package, ArrowRight
} from 'lucide-react-native';

type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    b2c_price: number;
    b2b_price: number | null;
    currency: string;
    supplier_id: string;
  };
};

type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export default function CheckoutScreen() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [placedTotal, setPlacedTotal] = useState(0);
  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [errors, setErrors] = useState<Partial<Address>>({});

  useEffect(() => {
    if (user) {
      loadCheckoutData();
    }
  }, [user]);

  const loadCheckoutData = async () => {
    try {
      if (!user?.id) return;

      const { data: items, error } = await supabase
        .from('cart_items')
        .select(`
          id, product_id, quantity,
          products (id, name, b2c_price, b2b_price, currency, supplier_id)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(items as any);

      if (profile?.address) {
        setAddress(profile.address as any);
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (item: CartItem) => {
    if (profile?.role === 'b2b' && item.products.b2b_price) return item.products.b2b_price;
    return item.products.b2c_price;
  };

  const calculateSubtotal = () =>
    cartItems.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);

  const calculateTotal = () => calculateSubtotal();

  const validateAddress = () => {
    const newErrors: Partial<Address> = {};
    if (!address.street.trim()) newErrors.street = 'Required';
    if (!address.city.trim()) newErrors.city = 'Required';
    if (!address.state.trim()) newErrors.state = 'Required';
    if (!address.zipCode.trim()) newErrors.zipCode = 'Required';
    if (!address.country.trim()) newErrors.country = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) {
      Alert.alert(t.error, t.shippingAddress);
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert(t.error, t.yourCartIsEmpty);
      return;
    }

    setPlacing(true);

    try {
      const orderNumber = `ORD-${Date.now()}`;
      const subtotal = calculateSubtotal();
      const platformCommission = subtotal * 0.1;
      const total = calculateTotal();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user?.id,
          status: 'pending',
          subtotal,
          tax: 0,
          shipping_fee: 0,
          platform_commission: platformCommission,
          total,
          currency: cartItems[0].products.currency,
          shipping_address: address,
          billing_address: address,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        supplier_id: item.products.supplier_id,
        product_name: item.products.name,
        quantity: item.quantity,
        unit_price: getPrice(item),
        subtotal: getPrice(item) * item.quantity,
        supplier_amount: getPrice(item) * item.quantity * 0.9,
        platform_commission: getPrice(item) * item.quantity * 0.1,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      await supabase.from('payments').insert({
        order_id: order.id,
        payment_gateway: 'stripe',
        amount: total,
        currency: cartItems[0].products.currency,
        status: 'completed',
        payment_method: paymentMethod,
      });

      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user?.id);

      if (deleteError) throw deleteError;

      setPlacedOrderNumber(orderNumber);
      setPlacedTotal(total);
      setOrderSuccess(true);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(t.error, t.error);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  if (orderSuccess) {
    return (
      <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <CheckCircle size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>{t.orderPlaced}</Text>
          <Text style={styles.successSub}>{t.orderConfirmedMessage}</Text>

          <View style={styles.orderCard}>
            <View style={[styles.orderCardRow, language.rtl && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.orderCardLabel}>{t.orderNumber}</Text>
              <Text style={styles.orderCardValue}>{placedOrderNumber}</Text>
            </View>
            <View style={styles.orderCardDivider} />
            <View style={[styles.orderCardRow, language.rtl && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.orderCardLabel}>{t.totalPaid}</Text>
              <Text style={styles.orderCardAmount}>
                {cartItems[0]?.products.currency} {placedTotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.orderCardDivider} />
            <View style={[styles.orderCardRow, language.rtl && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.orderCardLabel}>{t.payment}</Text>
              <Text style={styles.orderCardValue}>
                {paymentMethod === 'card' ? t.creditDebitCard : t.cashOnDelivery}
              </Text>
            </View>
            <View style={styles.orderCardDivider} />
            <View style={[styles.orderCardRow, language.rtl && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.orderCardLabel}>{t.status}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{t.pending}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.viewOrdersBtn, language.rtl && { flexDirection: 'row-reverse' }]}
            onPress={() => router.replace('/(tabs)/orders')}
          >
            <Package size={18} color="#FFF" />
            <Text style={styles.viewOrdersBtnText}>{t.viewMyOrders}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueShoppingBtn, language.rtl && { flexDirection: 'row-reverse' }]}
            onPress={() => router.replace('/(tabs)/shop')}
          >
            <Text style={styles.continueShoppingText}>{t.continueShopping}</Text>
            <ArrowRight size={16} color="#1D4ED8" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, language.rtl && { direction: 'rtl' }]}>
      <View style={[styles.header, language.rtl && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/shop')} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#111827" style={language.rtl && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.checkout}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.section, language.rtl && { alignItems: 'flex-end' }]}>
          <View style={[styles.sectionHeader, language.rtl && { flexDirection: 'row-reverse' }]}>
            <MapPin size={20} color="#1D4ED8" />
            <Text style={styles.sectionTitle}>{t.shippingAddress}</Text>
          </View>

          <TextInput
            style={[styles.input, errors.street && styles.inputError, language.rtl && { textAlign: 'right' }]}
            placeholder={t.streetAddress}
            placeholderTextColor="#94A3B8"
            value={address.street || ''}
            onChangeText={(v) => { setAddress({ ...address, street: v }); setErrors({ ...errors, street: undefined }); }}
          />
          <TextInput
            style={[styles.input, errors.city && styles.inputError, language.rtl && { textAlign: 'right' }]}
            placeholder={t.city}
            placeholderTextColor="#94A3B8"
            value={address.city || ''}
            onChangeText={(v) => { setAddress({ ...address, city: v }); setErrors({ ...errors, city: undefined }); }}
          />
          <View style={[styles.row, language.rtl && { flexDirection: 'row-reverse' }]}>
            <TextInput
              style={[styles.input, styles.halfInput, errors.state && styles.inputError, language.rtl && { textAlign: 'right' }]}
              placeholder={t.state}
              placeholderTextColor="#94A3B8"
              value={address.state || ''}
              onChangeText={(v) => { setAddress({ ...address, state: v }); setErrors({ ...errors, state: undefined }); }}
            />
            <TextInput
              style={[styles.input, styles.halfInput, errors.zipCode && styles.inputError, language.rtl && { textAlign: 'right' }]}
              placeholder={t.zipCode}
              placeholderTextColor="#94A3B8"
              value={address.zipCode || ''}
              onChangeText={(v) => { setAddress({ ...address, zipCode: v }); setErrors({ ...errors, zipCode: undefined }); }}
            />
          </View>
          <TextInput
            style={[styles.input, errors.country && styles.inputError, language.rtl && { textAlign: 'right' }]}
            placeholder={t.country}
            placeholderTextColor="#94A3B8"
            value={address.country || ''}
            onChangeText={(v) => { setAddress({ ...address, country: v }); setErrors({ ...errors, country: undefined }); }}
          />
        </View>

        <View style={[styles.section, language.rtl && { alignItems: 'flex-end' }]}>
          <View style={[styles.sectionHeader, language.rtl && { flexDirection: 'row-reverse' }]}>
            <CreditCard size={20} color="#1D4ED8" />
            <Text style={styles.sectionTitle}>{t.paymentMethod}</Text>
          </View>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive, language.rtl && { flexDirection: 'row-reverse' }]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={[styles.radioButton, paymentMethod === 'card' && styles.radioButtonActive, language.rtl && { marginRight: 0, marginLeft: 12 }]}>
              {paymentMethod === 'card' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.paymentOptionText}>{t.creditDebitCard}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive, language.rtl && { flexDirection: 'row-reverse' }]}
            onPress={() => setPaymentMethod('cash')}
          >
            <View style={[styles.radioButton, paymentMethod === 'cash' && styles.radioButtonActive, language.rtl && { marginRight: 0, marginLeft: 12 }]}>
              {paymentMethod === 'cash' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.paymentOptionText}>{t.cashOnDelivery}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, language.rtl && { alignItems: 'flex-end' }]}>
          <Text style={[styles.sectionTitle, language.rtl && { textAlign: 'right' }]}>{t.orderSummary}</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={[styles.orderItem, language.rtl && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.orderItemName, language.rtl && { textAlign: 'right' }]} numberOfLines={1}>
                {item.products.name} x {item.quantity}
              </Text>
              <Text style={styles.orderItemPrice}>
                {item.products.currency} {(getPrice(item) * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={[styles.summaryRow, language.rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.summaryLabel}>{t.subtotal}</Text>
            <Text style={styles.summaryValue}>
              {cartItems[0]?.products.currency} {calculateSubtotal().toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryRow, language.rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.summaryLabel}>{t.shipping}</Text>
            <Text style={styles.summaryValueGreen}>{t.free}</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.summaryRow, language.rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.summaryLabelBold}>{t.total}</Text>
            <Text style={styles.summaryValueBold}>
              {cartItems[0]?.products.currency} {calculateTotal().toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, placing && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={placing}
        >
          {placing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.placeOrderButtonText}>{t.placeOrder}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  content: { flex: 1 },
  section: { backgroundColor: '#FFF', padding: 20, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginLeft: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    padding: 12, fontSize: 15, marginBottom: 12,
    backgroundColor: '#F8FAFC', color: '#111827',
  },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  paymentOptionActive: { borderColor: '#1D4ED8', backgroundColor: '#EFF6FF' },
  radioButton: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  radioButtonActive: { borderColor: '#1D4ED8' },
  radioButtonInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1D4ED8' },
  paymentOptionText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  orderItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
  },
  orderItemName: { flex: 1, fontSize: 14, color: '#6B7280', marginRight: 12 },
  orderItemPrice: { fontSize: 14, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6,
  },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, color: '#111827' },
  summaryValueGreen: { fontSize: 14, color: '#10B981', fontWeight: '600' },
  summaryLabelBold: { fontSize: 16, fontWeight: '700', color: '#111827' },
  summaryValueBold: { fontSize: 18, fontWeight: '800', color: '#1D4ED8' },
  footer: {
    backgroundColor: '#FFF', padding: 20, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  placeOrderButton: {
    backgroundColor: '#1D4ED8', paddingVertical: 16,
    borderRadius: 14, alignItems: 'center',
  },
  placeOrderButtonDisabled: { opacity: 0.6 },
  placeOrderButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  successContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 28, gap: 16,
  },
  successIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  successSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  orderCard: {
    width: '100%', backgroundColor: '#FFF', borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8,
  },
  orderCardRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8,
  },
  orderCardDivider: { height: 1, backgroundColor: '#F1F5F9' },
  orderCardLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  orderCardValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  orderCardAmount: { fontSize: 16, fontWeight: '800', color: '#10B981' },
  statusBadge: {
    backgroundColor: '#FEF9C3', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  viewOrdersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1D4ED8', paddingHorizontal: 32, paddingVertical: 15,
    borderRadius: 14, width: '100%', justifyContent: 'center', marginTop: 8,
  },
  viewOrdersBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  continueShoppingBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10,
  },
  continueShoppingText: { fontSize: 15, fontWeight: '600', color: '#1D4ED8' },
});
