import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: 'customer' | 'b2b' | 'supplier' | 'admin';
          company_name: string | null;
          tax_id: string | null;
          address: any;
          created_at: string;
          updated_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          supplier_id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          specifications: any;
          sku: string | null;
          barcode: string | null;
          b2c_price: number;
          b2b_price: number | null;
          cost_price: number | null;
          currency: string;
          stock_quantity: number;
          low_stock_threshold: number;
          is_active: boolean;
          is_featured: boolean;
          auto_sync_enabled: boolean;
          external_product_id: string | null;
          weight: number | null;
          dimensions: any;
          created_at: string;
          updated_at: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          image_url: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          status: string;
          subtotal: number;
          tax: number;
          shipping_fee: number;
          platform_commission: number;
          total: number;
          currency: string;
          shipping_address: any;
          billing_address: any;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
