-- Create prospects table for demo request leads
-- NOTE: Uses display_ prefix to match the shared Supabase project convention
CREATE TABLE IF NOT EXISTS display_prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    plan TEXT,
    screens TEXT,
    message TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'converted', 'lost')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for common queries
CREATE INDEX IF NOT EXISTS display_prospects_status_idx ON display_prospects(status);
CREATE INDEX IF NOT EXISTS display_prospects_created_at_idx ON display_prospects(created_at DESC);

-- Enable RLS
ALTER TABLE display_prospects ENABLE ROW LEVEL SECURITY;

-- Super admin can do everything
CREATE POLICY "display: Super admins manage prospects" ON display_prospects
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM display_profiles
            WHERE display_profiles.id = auth.uid()
            AND display_profiles.role = 'super_admin'
        )
    );

-- Public can insert (for demo form submissions)
CREATE POLICY "display: Anyone can submit prospects" ON display_prospects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
