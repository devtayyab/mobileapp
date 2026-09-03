type ProductRow = {
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

type ProfileRow = {
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

type CategoryRow = {
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

type SupplierRow = {
  id: string;
  user_id: string;
  business_name: string;
  created_at: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13';
  };
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: Partial<ProductRow>;
        Update: Partial<ProductRow>;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: Partial<CategoryRow>;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      suppliers: {
        Row: SupplierRow;
        Insert: Partial<SupplierRow>;
        Update: Partial<SupplierRow>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      bulk_update_products: {
        Args: {
          updates: {
            id: string;
            b2c_price?: number;
            b2b_price?: number;
            stock_quantity?: number;
            is_active?: boolean;
            category_id?: string;
          }[];
        };
        Returns: number;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};

export type Product = Database['public']['Tables']['products']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
