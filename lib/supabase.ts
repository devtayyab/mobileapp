import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://bqjsimigctrfywqiflah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxanNpbWlnY3RyZnl3cWlmbGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODU2NzQsImV4cCI6MjA4NDA2MTY3NH0.hmAFJDxrgFBTDi6yOz2pJ2jaMwp-f_7jrmSZNyljHso'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
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
          shipping_country_id: string | null;
          vat_amount: number;
          created_at: string;
          updated_at: string;
        };
      };
      countries: {
        Row: {
          id: string;
          name: string;
          code: string;
          vat_percentage: number;
          vat_type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      couriers: {
        Row: {
          id: string;
          name: string;
          code: string;
          tracking_url_format: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      supplier_shipping_rates: {
        Row: {
          id: string;
          supplier_id: string;
          country_id: string;
          shipping_charge: number;
          delivery_time_days: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
