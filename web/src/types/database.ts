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
  /** `boolean DEFAULT true` with no NOT NULL — null is reachable. */
  is_active: boolean | null;
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
  /** Presence heartbeat, added to profiles by the chat migration (20260408120000). */
  is_online: boolean | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

/* ── Postgres enums (supabase/migrations/20260115152126_...sql) ───────── */
export type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
/** NOTE: distinct vocabulary from OrderStatus — 'shipped' is NOT valid here. */
export type ShipmentStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed';

type ChatRoomRow = {
  id: string;
  room_type: 'p2p' | 'support';
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type ChatParticipantRow = {
  id: string;
  room_id: string | null;
  user_id: string | null;
  joined_at: string;
};

type ChatMessageRow = {
  id: string;
  room_id: string | null;
  sender_id: string | null;
  message: string;
  is_read: boolean | null;
  created_at: string;
};

type ProductReviewRow = {
  id: string;
  product_id: string | null;
  user_id: string | null;
  rating: number;
  comment: string | null;
  /** DEFAULT flipped true -> false in migration 20260702163000. */
  is_approved: boolean | null;
  created_at: string;
  updated_at: string;
};

/**
 * Three conflicting `CREATE TABLE IF NOT EXISTS notifications` bodies exist in
 * the migrations; only the earliest (20260220172711) actually creates the table,
 * so related_id/related_type are real. `payload` came from a later ALTER.
 */
type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  /** Free-form text: 'info' | 'order_status' | 'new_order' | 'new_product' | ... */
  type: string;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean | null;
  created_at: string;
  payload: any;
};

type KycDocumentRow = {
  id: string;
  supplier_id: string | null;
  document_type: string;
  document_url: string;
  document_number: string | null;
  status: KycStatus | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  /** Added by a later conditional ALTER, not in the base CREATE TABLE. */
  rejection_reason: string | null;
  created_at: string;
};

type ShipmentRow = {
  id: string;
  order_id: string | null;
  supplier_id: string | null;
  /** Added by ALTER in 20260615145100; supersedes the legacy `carrier` text. */
  courier_id: string | null;
  tracking_number: string | null;
  carrier: string | null;
  status: ShipmentStatus | null;
  shipped_at: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  tracking_updates: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CourierRow = {
  id: string;
  name: string;
  code: string;
  tracking_url_format: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
};

type SupportTicketRow = {
  id: string;
  user_id: string | null;
  email: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed' | null;
  created_at: string;
  updated_at: string;
};

/** Singleton config row pinned to id = 1 — an INT, not a uuid. */
type PaymentSettingRow = {
  id: number;
  stripe_secret_key: string | null;
  stripe_publishable_key: string | null;
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
  /** `boolean DEFAULT true` with no NOT NULL — null is reachable. */
  is_active: boolean | null;
  display_order: number;
  created_at: string;
};

/**
 * Base columns come from 20260115152126; the rest were added by later ALTERs
 * (20260220172711 review fields, 20260220183748 business fields,
 * 20260708124500 Stripe Connect).
 */
type SupplierRow = {
  id: string;
  user_id: string;
  business_name: string;
  business_registration_number: string | null;
  business_type: string | null;
  kyc_status: KycStatus | null;
  kyc_submitted_at: string | null;
  kyc_approved_at: string | null;
  kyc_rejected_reason: string | null;
  commission_rate: number | null;
  bank_account_details: any;
  auto_payout_enabled: boolean | null;
  payout_threshold: number | null;
  is_active: boolean | null;
  /** Added by 20260220172711 */
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  /** Added by 20260220183748 */
  business_description: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  website: string | null;
  /** Added by 20260708124500 */
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  created_at: string;
  updated_at: string;
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
      chat_rooms: {
        Row: ChatRoomRow;
        Insert: Partial<ChatRoomRow>;
        Update: Partial<ChatRoomRow>;
        Relationships: [];
      };
      chat_participants: {
        Row: ChatParticipantRow;
        Insert: Partial<ChatParticipantRow>;
        Update: Partial<ChatParticipantRow>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: Partial<ChatMessageRow>;
        Update: Partial<ChatMessageRow>;
        Relationships: [];
      };
      product_reviews: {
        Row: ProductReviewRow;
        Insert: Partial<ProductReviewRow>;
        Update: Partial<ProductReviewRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow>;
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      kyc_documents: {
        Row: KycDocumentRow;
        Insert: Partial<KycDocumentRow>;
        Update: Partial<KycDocumentRow>;
        Relationships: [];
      };
      shipments: {
        Row: ShipmentRow;
        Insert: Partial<ShipmentRow>;
        Update: Partial<ShipmentRow>;
        Relationships: [];
      };
      couriers: {
        Row: CourierRow;
        Insert: Partial<CourierRow>;
        Update: Partial<CourierRow>;
        Relationships: [];
      };
      support_tickets: {
        Row: SupportTicketRow;
        Insert: Partial<SupportTicketRow>;
        Update: Partial<SupportTicketRow>;
        Relationships: [];
      };
      payment_settings: {
        Row: PaymentSettingRow;
        Insert: Partial<PaymentSettingRow>;
        Update: Partial<PaymentSettingRow>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      /**
       * Per-row bulk update in one transaction.
       * A key that is PRESENT is written (including an explicit null, which
       * clears a nullable column); a key that is ABSENT leaves the column
       * untouched. See migration 20260903003000.
       */
      bulk_update_products: {
        Args: {
          updates: {
            id: string;
            b2c_price?: number;
            b2b_price?: number | null;
            stock_quantity?: number;
            is_active?: boolean;
            category_id?: string | null;
          }[];
        };
        Returns: number;
      };
      create_supplier_profile: {
        Args: { p_business_name: string };
        Returns: string;
      };
      /** Aggregated in SQL so totals aren't truncated by PostgREST max-rows. */
      admin_platform_stats: {
        Args: Record<string, never>;
        Returns: any;
      };
      /** Per-currency revenue report; aggregated in SQL for the same reason. */
      admin_revenue_report: {
        Args: Record<string, never>;
        Returns: any;
      };
      /** SECURITY DEFINER; raises unless the caller supplies part of the order. */
      update_order_status_from_shipment: {
        Args: { p_order_id: string; p_status: OrderStatus };
        Returns: undefined;
      };
      /** Returns the Stripe publishable key stored in payment_settings. */
      get_stripe_publishable_key: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      /** Deletes the calling user's account (used by profile settings). */
      delete_user: {
        Args: Record<string, never>;
        Returns: undefined;
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
export type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ProductReview = Database['public']['Tables']['product_reviews']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type KycDocument = Database['public']['Tables']['kyc_documents']['Row'];
export type Shipment = Database['public']['Tables']['shipments']['Row'];
export type Courier = Database['public']['Tables']['couriers']['Row'];
export type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];

export type Role = 'customer' | 'b2b' | 'supplier' | 'admin';
