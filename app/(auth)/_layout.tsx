import { Stack } from 'expo-router/stack';
import { Colors } from '@/constants/Colors';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background.primary },
    }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="auth-options" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
