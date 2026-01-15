import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings, FileText, HelpCircle, LogOut, Store, Truck } from 'lucide-react-native';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'b2b':
        return '#2196F3';
      case 'supplier':
        return '#FF9800';
      case 'admin':
        return '#9C27B0';
      default:
        return '#4CAF50';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'b2b':
        return 'Wholesale Customer';
      case 'supplier':
        return 'Supplier';
      case 'admin':
        return 'Administrator';
      default:
        return 'Customer';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={32} color="#ffffff" />
          </View>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Guest User'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        {profile?.role && (
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(profile.role) }]}>
            <Text style={styles.roleBadgeText}>{getRoleLabel(profile.role)}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <User size={20} color="#333" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Settings size={20} color="#333" />
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
          </TouchableOpacity>
        </View>

        {(profile?.role === 'supplier' || profile?.role === 'admin') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supplier</Text>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Store size={20} color="#333" />
                <Text style={styles.menuItemText}>Manage Products</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Truck size={20} color="#333" />
                <Text style={styles.menuItemText}>Manage Orders</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <FileText size={20} color="#333" />
                <Text style={styles.menuItemText}>KYC Verification</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <HelpCircle size={20} color="#333" />
              <Text style={styles.menuItemText}>Help Center</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <FileText size={20} color="#333" />
              <Text style={styles.menuItemText}>Terms & Conditions</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <FileText size={20} color="#333" />
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#FF5722" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5722',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
