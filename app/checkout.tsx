import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, CreditCard } from 'lucide-react-native';

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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      const { data: items, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            name,
            b2c_price,
            b2b_price,
            currency,
            supplier_id
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setCartItems(items as any);

      if (profile?.address) {
        setAddress(profile.address);
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (item: CartItem) => {
    if (profile?.role === 'b2b' && item.products.b2b_price) {
      return item.products.b2b_price;
    }
    return item.products.b2c_price;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (getPrice(item) * item.quantity), 0);
  };

  const calculatePlatformCommission = () => {
    return calculateSubtotal() * 0.10;
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const handlePlaceOrder = async () => {
    if (!address.street || !address.city || !address.state || !address.zipCode || !address.country) {
      Alert.alert('Incomplete Address', 'Please fill in all address fields');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    setPlacing(true);

    try {
      const orderNumber = `ORD-${Date.now()}`;
      const subtotal = calculateSubtotal();
      const platformCommission = calculatePlatformCommission();
      const total = calculateTotal();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user?.id,
          status: 'pending',
          subtotal: subtotal,
          tax: 0,
          shipping_fee: 0,
          platform_commission: platformCommission,
          total: total,
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
        supplier_amount: (getPrice(item) * item.quantity) * 0.9,
        platform_commission: (getPrice(item) * item.quantity) * 0.1,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          payment_gateway: 'stripe',
          amount: total,
          currency: cartItems[0].products.currency,
          status: 'completed',
          payment_method: paymentMethod,
        });

      if (paymentError) throw paymentError;

      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user?.id);

      if (deleteError) throw deleteError;

      Alert.alert(
        'Order Placed',
        `Your order ${orderNumber} has been placed successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/orders'),
          },
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Street Address"
            value={address.street}
            onChangeText={(text) => setAddress({ ...address, street: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            value={address.city}
            onChangeText={(text) => setAddress({ ...address, city: text })}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State"
              value={address.state}
              onChangeText={(text) => setAddress({ ...address, state: text })}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="ZIP Code"
              value={address.zipCode}
              onChangeText={(text) => setAddress({ ...address, zipCode: text })}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={address.country}
            onChangeText={(text) => setAddress({ ...address, country: text })}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'card' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('cash')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'cash' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.paymentOptionText}>Cash on Delivery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName} numberOfLines={1}>
                {item.products.name} x {item.quantity}
              </Text>
              <Text style={styles.orderItemPrice}>
                {item.products.currency} {(getPrice(item) * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {cartItems[0]?.products.currency || 'USD'} {calculateSubtotal().toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>Free</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Total</Text>
            <Text style={styles.summaryValueBold}>
              {cartItems[0]?.products.currency || 'USD'} {calculateTotal().toFixed(2)}
            </Text>
          </View>
        </View>
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
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  paymentOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginRight: 12,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  placeOrderButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
