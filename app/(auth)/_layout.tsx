import { Stack } from 'expo-router/stack';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthLayout() {
  const Colors = useTheme();
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
