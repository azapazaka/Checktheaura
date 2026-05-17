-- 1. Monetization schema updates
ALTER TABLE public.profiles 
ADD COLUMN is_pro BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN stripe_customer_id TEXT;

-- 2. Coach JSON analysis updates
ALTER TABLE public.coach_analyses
DROP COLUMN highlights,
DROP COLUMN mistakes,
DROP COLUMN tip,
ADD COLUMN analysis_data JSONB;
