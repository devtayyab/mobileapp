type ProductRow = {
  id: string;
  supplier_id: string;
  category_id: string | null;
  origin_country_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  specifications: any;
  sku: string | null;
  barcode: string | null;
  b2c_price: number;
  b2b_price: number | null;
  cost_price: number | null;
  moq: number | null;
  shipping_cost: number | null;
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

type ProductImageRow = {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
};

type CartItemRow = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  user_id: string;
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

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  supplier_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  supplier_amount: number;
  platform_commission: number;
  created_at: string;
};

type PaymentRow = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_gateway: string | null;
  payment_method: string | null;
  created_at: string;
};

type CountryRow = {
  id: string;
  name: string;
  code: string;
  vat_percentage: number;
  vat_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SupplierShippingRateRow = {
  id: string;
  supplier_id: string;
  country_id: string;
  shipping_charge: number;
  delivery_time_days: number | null;
  is_active: boolean;
  created_at: string;
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
      product_images: {
        Row: ProductImageRow;
        Insert: Partial<ProductImageRow>;
        Update: Partial<ProductImageRow>;
        Relationships: [];
      };
      cart_items: {
        Row: CartItemRow;
        Insert: Partial<CartItemRow>;
        Update: Partial<CartItemRow>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: Partial<OrderRow>;
        Update: Partial<OrderRow>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: Partial<OrderItemRow>;
        Update: Partial<OrderItemRow>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: Partial<PaymentRow>;
        Update: Partial<PaymentRow>;
        Relationships: [];
      };
      countries: {
        Row: CountryRow;
        Insert: Partial<CountryRow>;
        Update: Partial<CountryRow>;
        Relationships: [];
      };
      supplier_shipping_rates: {
        Row: SupplierShippingRateRow;
        Insert: Partial<SupplierShippingRateRow>;
        Update: Partial<SupplierShippingRateRow>;
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
      create_supplier_profile: {
        Args: { p_business_name: string };
        Returns: string;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};

export type Product = Database['public']['Tables']['products']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type CartItem = Database['public']['Tables']['cart_items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Country = Database['public']['Tables']['countries']['Row'];

export type Role = 'customer' | 'b2b' | 'supplier' | 'admin';
