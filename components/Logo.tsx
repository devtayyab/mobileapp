import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';

type LogoProps = {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
};

export function Logo({ size = 'medium', variant = 'dark' }: LogoProps) {
  const iconSize = size === 'large' ? 48 : size === 'medium' ? 36 : 24;
  const fontSize = size === 'large' ? 32 : size === 'medium' ? 24 : 18;
  const color = variant === 'light' ? '#ffffff' : '#333';

  return (
    <View style={styles.container}>
      <View style={[
        styles.iconContainer,
        size === 'large' && styles.iconContainerLarge,
        size === 'medium' && styles.iconContainerMedium,
        size === 'small' && styles.iconContainerSmall,
      ]}>
        <ShoppingBag size={iconSize} color="#ffffff" strokeWidth={2.5} />
      </View>
      <Text style={[styles.text, { fontSize, color }]}>
        Market<Text style={styles.accent}>Place</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  iconContainerLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  iconContainerMedium: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  iconContainerSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  accent: {
    color: '#4CAF50',
  },
});
