-- Migration: EcoPulse V2 Schema Expansion
-- Safely alters existing tables and creates new ones if they do not exist.

-- 1. Alter existing profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS household_size integer default 1;

-- 2. Alter existing activities table
ALTER TABLE public.activities 
  ADD COLUMN IF NOT EXISTS title text DEFAULT 'Logged Activity',
  ADD COLUMN IF NOT EXISTS details jsonb;

-- 3. Create CarbonCalculations table
CREATE TABLE IF NOT EXISTS public.carbon_calculations (
  id uuid default uuid_generate_v4() primary key,
  activity_id uuid references public.activities(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  category text not null,
  co2_amount numeric not null,
  calculation_details jsonb, -- e.g. {"factor": 0.08, "multiplier": 5}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.carbon_calculations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own calculations" ON carbon_calculations;
CREATE POLICY "Users can view own calculations" ON carbon_calculations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own calculations" ON carbon_calculations;
CREATE POLICY "Users can insert own calculations" ON carbon_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Create CarbonScores history
CREATE TABLE IF NOT EXISTS public.carbon_scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  score integer not null,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.carbon_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own scores" ON carbon_scores;
CREATE POLICY "Users can view own scores" ON carbon_scores FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own scores" ON carbon_scores;
CREATE POLICY "Users can insert own scores" ON carbon_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create Challenges & Badges
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  category text not null,
  points integer not null default 10,
  duration_days integer not null default 1
);

CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  challenge_id uuid references public.challenges(id) not null,
  status text not null default 'active', -- active, completed
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own challenges" ON user_challenges;
CREATE POLICY "Users can view own challenges" ON user_challenges FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own challenges" ON user_challenges;
CREATE POLICY "Users can insert own challenges" ON user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own challenges" ON user_challenges;
CREATE POLICY "Users can update own challenges" ON user_challenges FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.badges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  icon_url text,
  requirement text
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  badge_id uuid references public.badges(id) not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- 6. Communities
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  type text -- 'college', 'organization', 'local'
);

CREATE TABLE IF NOT EXISTS public.community_members (
  community_id uuid references public.communities(id) not null,
  user_id uuid references public.profiles(id) not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members viewable by all" ON community_members;
CREATE POLICY "Members viewable by all" ON community_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can join communities" ON community_members;
CREATE POLICY "Users can join communities" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  report_type text not null, -- 'weekly', 'monthly', 'yearly'
  total_emissions numeric not null,
  carbon_score integer not null,
  category_breakdown jsonb,
  ai_recommendations text,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id);

-- 8. Predictions (Machine Learning Outputs)
CREATE TABLE IF NOT EXISTS public.predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  predicted_month timestamp with time zone not null,
  predicted_co2 numeric not null,
  model_version text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own predictions" ON predictions;
CREATE POLICY "Users can view own predictions" ON predictions FOR SELECT USING (auth.uid() = user_id);

-- Seed Core Challenges
INSERT INTO public.challenges (id, title, description, category, points, duration_days)
VALUES 
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Commute Green', 'Log 3 public transport or cycling trips to reduce your transit emissions.', 'transport', 30, 7),
  ('c2c2c2c2-2222-2222-2222-222222222222', 'Plant-Based Feast', 'Eat and log 3 vegetarian or vegan meals to cut down beef/meat carbon load.', 'food', 40, 7),
  ('c3c3c3c3-3333-3333-3333-333333333333', 'Power Saver', 'Log 3 energy saving actions (like turning off AC or using solar power).', 'energy', 50, 7)
ON CONFLICT (id) DO NOTHING;

