import { useStripe as useStripeNative } from '@stripe/stripe-react-native';

export function useStripe() {
  return useStripeNative();
}
