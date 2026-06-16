-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create profiles (Users) table
CREATE TABLE public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  age integer,
  city text,
  occupation text,
  household_size integer default 1,
  eco_score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Create activities table for carbon tracking
CREATE TABLE public.activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  category text not null, -- 'transport', 'food', 'shopping', 'home', 'waste'
  title text not null,
  details jsonb, -- e.g. {"distance": 5, "mode": "bus"} or {"meal_type": "beef"}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Create CarbonCalculations table
CREATE TABLE public.carbon_calculations (
  id uuid default uuid_generate_v4() primary key,
  activity_id uuid references public.activities(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  category text not null,
  co2_amount numeric not null,
  calculation_details jsonb, -- e.g. {"factor": 0.08, "multiplier": 5}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.carbon_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own calculations" ON carbon_calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calculations" ON carbon_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Create CarbonScores history
CREATE TABLE public.carbon_scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  score integer not null,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.carbon_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scores" ON carbon_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON carbon_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create Challenges & Badges
CREATE TABLE public.challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  category text not null,
  points integer not null default 10,
  duration_days integer not null default 1
);

CREATE TABLE public.user_challenges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  challenge_id uuid references public.challenges(id) not null,
  status text not null default 'active', -- active, completed
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own challenges" ON user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON user_challenges FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.badges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  icon_url text,
  requirement text
);

CREATE TABLE public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  badge_id uuid references public.badges(id) not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- 6. Communities
CREATE TABLE public.communities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  type text -- 'college', 'organization', 'local'
);

CREATE TABLE public.community_members (
  community_id uuid references public.communities(id) not null,
  user_id uuid references public.profiles(id) not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by all" ON community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Reports
CREATE TABLE public.reports (
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
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id);

-- 8. Predictions (Machine Learning Outputs)
CREATE TABLE public.predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  predicted_month timestamp with time zone not null,
  predicted_co2 numeric not null,
  model_version text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own predictions" ON predictions FOR SELECT USING (auth.uid() = user_id);

-- 9. Storage for Avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible." 
  ON storage.objects FOR SELECT 
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload an avatar." 
  ON storage.objects FOR INSERT 
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own avatar." 
  ON storage.objects FOR UPDATE 
  USING ( bucket_id = 'avatars' AND auth.uid() = owner )
  WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own avatar." 
  ON storage.objects FOR DELETE 
  USING ( bucket_id = 'avatars' AND auth.uid() = owner );
