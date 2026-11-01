// Core Types for USKI STORE

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'courier' | 'customer';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  phone_number: string;
  street_address: string;
  district: string;
  city: string;
  province: string;
  postal_code: string;
  is_primary: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  icon?: string;
  image_url?: string;
  sort_order: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface Publisher {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string; // e.g., "Biru - 0.5mm", "A4 - 80gsm - 100 Lembar"
  price_override?: number | null;
  stock_quantity: number;
  attributes: Record<string, string>; // e.g. { color: 'Blue', size: '0.5mm' }
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku_master: string;
  isbn?: string; // Specific for books
  author?: string; // Specific for books
  category_id: string;
  category?: Category;
  brand_id?: string;
  brand?: Brand;
  publisher_id?: string;
  publisher?: Publisher;
  description: string;
  specifications: Record<string, string>;
  base_price: number;
  sale_price?: number | null; // Discount price if active
  discount_percentage?: number;
  stock_quantity: number;
  min_stock_alert: number;
  weight_grams: number;
  dimensions?: {
    length_cm: number;
    width_cm: number;
    height_cm: number;
  };
  is_active: boolean;
  is_featured: boolean;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
  is_customizable?: boolean;
  images: string[];
  variants?: ProductVariant[];
  rating: number;
  reviews_count: number;
  sales_count: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  product: Product;
  variant_id?: string;
  variant?: ProductVariant;
  quantity: number;
  selected_price: number;
}

export type OrderStatus =
  | 'awaiting_payment'
  | 'awaiting_verification'
  | 'processing'
  | 'ready_for_pickup'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod =
  | 'bank_transfer'
  | 'manual_qris'
  | 'midtrans_va'
  | 'midtrans_qris'
  | 'midtrans_cc'
  | 'cod';

export type PaymentStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant_name?: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  image_url?: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  proof_image_url?: string;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface ShipmentRecord {
  id: string;
  order_id: string;
  courier_name: string;
  service_type: string;
  tracking_number?: string;
  shipping_fee: number;
  status: string;
  recipient_name: string;
  phone_number: string;
  shipping_address: string;
  dispatched_at?: string;
  delivered_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  voucher_code?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  shipping_method: string;
  shipping_address: Address;
  payment?: PaymentRecord;
  shipment?: ShipmentRecord;
  courier_id?: string;
  courier_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type CustomRequestStatus =
  | 'pending_review'
  | 'checking_supplier'
  | 'quote_sent'
  | 'awaiting_customer_approval'
  | 'approved'
  | 'converted_to_order'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export interface CustomRequest {
  id: string;
  reference_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  institution_name?: string;
  title: string;
  category: string;
  description: string;
  specifications: string;
  quantity: number;
  target_date?: string;
  estimated_budget?: number;
  attachments: {
    name: string;
    url: string;
    file_type: string;
  }[];
  shipping_address?: string;
  status: CustomRequestStatus;
  quote?: CustomQuote;
  created_at: string;
}

export interface CustomQuoteItem {
  id: string;
  description: string;
  quantity: number;
  cogs_price: number; // Internal only
  unit_price: number;
  subtotal: number;
}

export interface CustomQuote {
  id: string;
  quote_number: string;
  custom_request_id: string;
  items: CustomQuoteItem[];
  cogs_total: number; // Internal COGS
  subtotal: number;
  additional_services_fee: number;
  shipping_fee: number;
  grand_total: number;
  lead_time_days: number;
  expires_at: string;
  admin_notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
}

export type VoucherTargetAudience =
  | 'all'
  | 'new_customer'
  | 'santri_pesantren'
  | 'guru_pengajar'
  | 'vip_member'
  | 'specific_phones';

export interface Voucher {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  target_audience?: VoucherTargetAudience;
  target_audience_label?: string;
  specific_phones?: string;
  usage_per_user?: number;
  applicable_category?: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url: string;
  badge_text?: string;
  is_active: boolean;
}

export interface Review {
  id: string;
  product_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  is_verified_purchase: boolean;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  variant_name?: string;
  sku: string;
  type: 'initial' | 'purchase_in' | 'sale_out' | 'manual_adjustment' | 'damaged' | 'return';
  quantity_delta: number;
  stock_after: number;
  notes: string;
  operator_name: string;
  created_at: string;
}

export type DeliveryStatus = 'assigned' | 'pickup' | 'on_delivery' | 'delivered' | 'failed';

export interface BreadcrumbPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed_kmh: number;
  address?: string;
  accuracy_meters?: number;
}

export interface CourierLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed_kmh: number;
  accuracy_meters?: number;
  address_approx: string;
  last_updated: string;
  last_timestamp?: number;
  battery_level?: number;
}

export interface ActiveDelivery {
  order_id: string;
  order_number: string;
  recipient_name: string;
  recipient_phone: string;
  destination_address: string;
  destination_coords: { lat: number; lng: number };
  started_at: string;
  eta_minutes: number;
  distance_km: number;
  progress_pct: number;
  status: DeliveryStatus;
  picked_up_at?: string;
  delivered_at?: string;
  failed_at?: string;
  failed_reason?: string;
  failed_notes?: string;
  reassigned_from?: string;
  reassign_reason?: string;
  proof_photo?: string;
  proof_signature?: string;
  delivery_notes?: string;
}

export interface CourierStationaryAlert {
  is_stationary: boolean;
  duration_minutes: number;
  alert_type: 'idle_too_long' | 'abnormal_speed' | null;
  message?: string;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar_url?: string;
  vehicle_type: 'motorcycle' | 'van';
  vehicle_plate: string;
  status: 'available' | 'delivering' | 'off_duty';
  current_location: CourierLocation;
  active_delivery?: ActiveDelivery | null;
  total_delivered_today: number;
  is_gps_active: boolean;
  last_seen_at?: string;
  trip_history?: BreadcrumbPoint[];
  stationary_alert?: CourierStationaryAlert;
}
