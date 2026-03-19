-- Self-serve SaaS sign-up support
-- Adds payment tracking to client plans and onboarding state to profiles

-- 1. Payment status on plans (existing clients default to 'paid')
ALTER TABLE public.display_client_plans
    ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid'
    CHECK (payment_status IN ('paid', 'trial', 'pending'));

-- 2. Onboarding flag on profiles (existing users default to true = skip wizard)
ALTER TABLE public.display_profiles
    ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT true;
