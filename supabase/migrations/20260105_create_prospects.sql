-- Create prospects table for demo request leads
CREATE TABLE IF NOT EXISTS prospects (
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
CREATE INDEX IF NOT EXISTS prospects_status_idx ON prospects(status);
CREATE INDEX IF NOT EXISTS prospects_created_at_idx ON prospects(created_at DESC);

-- Enable RLS
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Super admin can do everything
CREATE POLICY "Super admins can manage prospects" ON prospects
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Public can insert (for demo form submissions)
CREATE POLICY "Anyone can submit prospects" ON prospects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
