import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // User is not logged in but trying to access app -> Redirect to welcome
      router.replace('/(auth)/welcome');
    } else if (user && inAuthGroup) {
      // User is logged in but in auth screens -> Redirect into app
      if (profile?.role === 'supplier') {
        router.replace('/supplier/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } else if (user && !inAuthGroup) {
      // User is logged in and in app -> Check role alignment
      const inSupplierGroup = segments[0] === 'supplier';

      if (profile?.role === 'supplier' && !inSupplierGroup) {
        router.replace('/supplier/dashboard');
      } else if (profile?.role !== 'supplier' && profile?.role !== 'admin' && inSupplierGroup) {
        // If regular user tries to access supplier, kick them out
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments, profile]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
