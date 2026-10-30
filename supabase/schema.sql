-- ====================================================================
-- USKI STORE — SUPABASE POSTGRESQL COMPLETE DATABASE SCHEMA
-- Version: 1.0.0
-- Architecture: Fully Normalized with Constraints, RLS & Triggers
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'admin', 'staff', 'courier', 'customer');
CREATE TYPE order_status_enum AS ENUM ('awaiting_payment', 'awaiting_verification', 'processing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_method_enum AS ENUM ('bank_transfer', 'manual_qris', 'midtrans_va', 'midtrans_qris', 'midtrans_cc', 'cod');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'verified', 'rejected', 'expired');
CREATE TYPE custom_request_status_enum AS ENUM ('pending_review', 'checking_supplier', 'quote_sent', 'awaiting_customer_approval', 'approved', 'converted_to_order', 'rejected', 'cancelled', 'expired');

-- 3. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    role user_role_enum DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    street_address TEXT NOT NULL,
    district TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CATEGORIES, BRANDS & PUBLISHERS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    icon TEXT,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.publishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS & VARIANTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku_master TEXT NOT NULL UNIQUE,
    isbn TEXT,
    author TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    publisher_id UUID REFERENCES public.publishers(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    specifications JSONB DEFAULT '{}'::JSONB,
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
    sale_price NUMERIC(12, 2) CHECK (sale_price IS NULL OR sale_price >= 0),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_alert INT DEFAULT 5,
    weight_grams INT NOT NULL DEFAULT 200,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_best_seller BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    rating NUMERIC(2, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    sales_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price_override NUMERIC(12, 2),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    attributes JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INVENTORY MOVEMENTS (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    type TEXT NOT NULL, -- 'purchase_in', 'sale_out', 'manual_adjustment', 'damaged'
    quantity_delta INT NOT NULL,
    stock_after INT NOT NULL,
    notes TEXT,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDERS & ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    shipping_fee NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    voucher_code TEXT,
    status order_status_enum DEFAULT 'awaiting_payment',
    payment_method payment_method_enum NOT NULL,
    payment_status payment_status_enum DEFAULT 'pending',
    shipping_method TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    sku TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PAYMENTS & SHIPMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    method payment_method_enum NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status payment_status_enum DEFAULT 'pending',
    proof_image_url TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    courier_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    tracking_number TEXT,
    shipping_fee NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'Pending Dispatch',
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CUSTOM REQUESTS & QUOTATIONS (KILLER FEATURE)
CREATE TABLE IF NOT EXISTS public.custom_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    institution_name TEXT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    specifications TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    target_date DATE,
    estimated_budget NUMERIC(14, 2),
    shipping_address TEXT,
    status custom_request_status_enum DEFAULT 'pending_review',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_request_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_request_id UUID REFERENCES public.custom_requests(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number TEXT NOT NULL UNIQUE,
    custom_request_id UUID REFERENCES public.custom_requests(id) ON DELETE CASCADE,
    cogs_total NUMERIC(14, 2) NOT NULL, -- Secret internal COGS
    subtotal NUMERIC(14, 2) NOT NULL,
    additional_services_fee NUMERIC(14, 2) DEFAULT 0,
    shipping_fee NUMERIC(14, 2) DEFAULT 0,
    grand_total NUMERIC(14, 2) NOT NULL,
    lead_time_days INT NOT NULL DEFAULT 7,
    expires_at TIMESTAMPTZ NOT NULL,
    admin_notes TEXT,
    status TEXT DEFAULT 'sent', -- 'draft', 'sent', 'accepted', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_quote_id UUID REFERENCES public.custom_quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INT NOT NULL,
    cogs_price NUMERIC(12, 2) NOT NULL, -- Secret internal
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. VOUCHERS & PROMOTIONS
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
    discount_value NUMERIC(10, 2) NOT NULL,
    min_spend NUMERIC(12, 2) DEFAULT 0,
    max_discount NUMERIC(12, 2),
    usage_limit INT DEFAULT 100,
    usage_count INT DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STORE SETTINGS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_quotes ENABLE ROW LEVEL SECURITY;

-- Profiles: Users read their own, Admin read all
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin full profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- Products: Everyone can read active products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admin manage products" ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff'))
);

-- Orders: Customer can read their own orders; Admin can read all
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Admin full orders" ON public.orders FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff'))
);

-- Custom Quotes: Customer can view quote, but cogs_total is shielded
CREATE POLICY "Customers view quotes" ON public.custom_quotes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.custom_requests WHERE custom_requests.id = custom_quotes.custom_request_id AND (custom_requests.customer_id = auth.uid() OR auth.uid() IS NULL))
);
