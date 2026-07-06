-- Royal Funeral Supplies - Supabase Setup Script
-- Run this in the Supabase SQL Editor

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    category TEXT REFERENCES public.groups(slug) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tier INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    image TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policies for both tables (Public Read/Write for simplicity since this is an admin dashboard without real auth yet)
-- Note: In a production environment with real auth, INSERT/UPDATE should be restricted to authenticated users.
CREATE POLICY "Allow public read on groups" ON public.groups FOR SELECT TO public USING (true);
CREATE POLICY "Allow public all on groups" ON public.groups FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on products" ON public.products FOR SELECT TO public USING (true);
CREATE POLICY "Allow public all on products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. Create Storage Buckets for Images
INSERT INTO storage.buckets (id, name, public) VALUES ('royal-groups', 'royal-groups', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('royal-products', 'royal-products', true) ON CONFLICT DO NOTHING;

-- 5. Storage Policies
CREATE POLICY "Allow public read on royal-groups" ON storage.objects FOR SELECT TO public USING (bucket_id = 'royal-groups');
CREATE POLICY "Allow public uploads to royal-groups" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'royal-groups');
CREATE POLICY "Allow public update to royal-groups" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'royal-groups');
CREATE POLICY "Allow public delete to royal-groups" ON storage.objects FOR DELETE TO public USING (bucket_id = 'royal-groups');

CREATE POLICY "Allow public read on royal-products" ON storage.objects FOR SELECT TO public USING (bucket_id = 'royal-products');
CREATE POLICY "Allow public uploads to royal-products" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'royal-products');
CREATE POLICY "Allow public update to royal-products" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'royal-products');
CREATE POLICY "Allow public delete to royal-products" ON storage.objects FOR DELETE TO public USING (bucket_id = 'royal-products');
