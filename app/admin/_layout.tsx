import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="suppliers" />
      <Stack.Screen name="products" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="users" />
    </Stack>
  );
}
