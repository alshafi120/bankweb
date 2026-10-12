-- ==============================================================================
-- Withaq Bank - Complete Supabase PostgreSQL Schema
-- Project Ref: qlqfzwboxogabwffavec
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. Services (الخدمات المصرفية والرقمية)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) DEFAULT 'account',
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    summary_ar TEXT NOT NULL,
    summary_en TEXT NOT NULL,
    href VARCHAR(255) NOT NULL,
    position INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. Products / Accounts (الحسابات المصرفية)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    tagline_ar VARCHAR(255),
    tagline_en VARCHAR(255),
    features_ar JSONB DEFAULT '[]'::jsonb,
    features_en JSONB DEFAULT '[]'::jsonb,
    requirements_ar JSONB DEFAULT '[]'::jsonb,
    requirements_en JSONB DEFAULT '[]'::jsonb,
    minimum_balance BIGINT,
    currency VARCHAR(10) DEFAULT 'YER',
    position INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. Financing Products (التمويل الإسلامي)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financing_products (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    summary_ar TEXT NOT NULL,
    summary_en TEXT NOT NULL,
    body_ar TEXT,
    body_en TEXT,
    max_amount BIGINT NOT NULL,
    max_months INT NOT NULL,
    annual_profit_rate NUMERIC(5,2) NOT NULL,
    requirements_ar JSONB DEFAULT '[]'::jsonb,
    requirements_en JSONB DEFAULT '[]'::jsonb,
    position INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. Cards (البطائق المصرفية)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cards (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    summary_ar TEXT NOT NULL,
    summary_en TEXT NOT NULL,
    network VARCHAR(50) DEFAULT 'Visa',
    tone VARCHAR(50) DEFAULT 'jade',
    image_url TEXT,
    features_ar JSONB DEFAULT '[]'::jsonb,
    features_en JSONB DEFAULT '[]'::jsonb,
    fees_ar TEXT,
    fees_en TEXT,
    position INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. Locations (الفروع، الصرافات الآلية، والوكلاء)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('branch', 'atm', 'agent')),
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    city_ar VARCHAR(100) NOT NULL,
    city_en VARCHAR(100) NOT NULL,
    district_ar VARCHAR(100),
    district_en VARCHAR(100),
    address_ar TEXT NOT NULL,
    address_en TEXT NOT NULL,
    phone VARCHAR(50),
    hours_ar VARCHAR(255),
    hours_en VARCHAR(255),
    services_ar JSONB DEFAULT '[]'::jsonb,
    services_en JSONB DEFAULT '[]'::jsonb,
    lat NUMERIC(10,7),
    lng NUMERIC(10,7),
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. News & Offers (الأخبار والعروض)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    excerpt_ar TEXT NOT NULL,
    excerpt_en TEXT NOT NULL,
    content_ar TEXT,
    content_en TEXT,
    category_ar VARCHAR(100) DEFAULT 'عام',
    category_en VARCHAR(100) DEFAULT 'General',
    image_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.offers (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    details_ar TEXT NOT NULL,
    details_en TEXT NOT NULL,
    image_url TEXT,
    href VARCHAR(255) NOT NULL,
    starts_at DATE,
    ends_at DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. Customer Applications & Forms (طلبات فتح الحساب، التمويل، والبطاقات)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('account', 'financing', 'card')),
    status VARCHAR(30) DEFAULT 'pending',
    full_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_requests (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'new',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.complaints (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'submitted',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    category VARCHAR(100),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. Test Todos Table (لتجربة الربط)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.todos (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. Enable Row Level Security (RLS) & Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Allow public reads on content tables
CREATE POLICY "Public Read Services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Financing" ON public.financing_products FOR SELECT USING (true);
CREATE POLICY "Public Read Cards" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Public Read Locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Public Read News" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public Read Offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Public Read Todos" ON public.todos FOR SELECT USING (true);

-- Allow public submissions for forms & test table
CREATE POLICY "Public Insert Applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Contact" ON public.contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Complaints" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Todos" ON public.todos FOR INSERT WITH CHECK (true);
