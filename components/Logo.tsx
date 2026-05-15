import { View, Image, StyleSheet } from 'react-native';

type LogoProps = {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
};

export function Logo({ size = 'medium', variant = 'dark' }: LogoProps) {
  const dimensions = {
    large: { width: 160, height: 160 },
    medium: { width: 90, height: 90 },
    small: { width: 48, height: 48 },
  }[size];

  const padding = {
    large: 16,
    medium: 10,
    small: 6,
  }[size];

  return (
    <View style={[
      styles.container,
      {
        width: dimensions.width + padding * 2,
        height: dimensions.height + padding * 2,
        padding,
      }
    ]}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={dimensions}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});
