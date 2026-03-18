-- Add fit_mode to screens: controls how media fills the display
-- 'contain' = fit within screen, may have black bars (default)
-- 'cover' = fill entire screen, may crop edges (always keeps aspect ratio)
ALTER TABLE public.display_screens
    ADD COLUMN IF NOT EXISTS fit_mode text NOT NULL DEFAULT 'contain'
    CHECK (fit_mode IN ('contain', 'cover'));
