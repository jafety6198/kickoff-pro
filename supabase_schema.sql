
-- SUPABASE SCHEMA RESET (Run this in Supabase SQL Editor if you encounter migration errors)
-- WARNING: This will delete existing cloud data. Local data is safe.

-- DROP TABLE IF EXISTS public.scouting_reports CASCADE;
-- DROP TABLE IF EXISTS public.news_items CASCADE;
-- DROP TABLE IF EXISTS public.players CASCADE;
-- DROP TABLE IF EXISTS public.fixtures CASCADE;
-- DROP TABLE IF EXISTS public.teams CASCADE;
-- DROP TABLE IF EXISTS public.league_members CASCADE;
-- DROP TABLE IF EXISTS public.leagues CASCADE;
-- DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Leagues Table
CREATE TABLE IF NOT EXISTS public.leagues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    creator_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    password_hash TEXT,
    season INTEGER DEFAULT 1,
    mode TEXT CHECK (mode IN ('league', 'knockout')),
    team_count INTEGER DEFAULT 8,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. League Members
CREATE TABLE IF NOT EXISTS public.league_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('owner', 'admin', 'guest')) DEFAULT 'guest',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, user_id)
);

-- 4. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    manager_name TEXT,
    handle_name TEXT,
    logo_url TEXT,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    gf INTEGER DEFAULT 0,
    ga INTEGER DEFAULT 0,
    gd INTEGER DEFAULT 0,
    pts INTEGER DEFAULT 0,
    squad_image_url TEXT,
    formation TEXT,
    strength INTEGER,
    playstyle TEXT,
    description TEXT,
    color TEXT,
    form TEXT[], 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Fixtures Table
CREATE TABLE IF NOT EXISTS public.fixtures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    round INTEGER NOT NULL,
    leg1_score_home INTEGER,
    leg1_score_away INTEGER,
    leg1_status TEXT DEFAULT 'pending',
    leg1_stats JSONB,
    leg2_score_home INTEGER,
    leg2_score_away INTEGER,
    leg2_status TEXT DEFAULT 'pending',
    leg2_stats JSONB,
    prediction JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Players Table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    passes INTEGER DEFAULT 0,
    goal_history INTEGER[],
    last_teams_played TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. News Items
CREATE TABLE IF NOT EXISTS public.news_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT, 
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Scouting Reports
CREATE TABLE IF NOT EXISTS public.scouting_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    report_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- RLS ---
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scouting_reports ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- League Policies
CREATE POLICY "Leagues viewable by members or creator" ON public.leagues FOR SELECT 
USING (creator_id = auth.uid() OR EXISTS (SELECT 1 FROM league_members WHERE league_id = leagues.id AND user_id = auth.uid()));

CREATE POLICY "Leagues insertable by authenticated" ON public.leagues FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Leagues updatable by owners" ON public.leagues FOR UPDATE 
USING (creator_id = auth.uid());

-- Member Policies
CREATE POLICY "Members viewable by league members" ON public.league_members FOR SELECT 
USING (EXISTS (SELECT 1 FROM league_members lm WHERE lm.league_id = league_members.league_id AND lm.user_id = auth.uid()));

CREATE POLICY "Users can join as member" ON public.league_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can remove members" ON public.league_members FOR DELETE
USING (EXISTS (SELECT 1 FROM public.leagues WHERE id = league_id AND creator_id = auth.uid()));

-- Data Policies
CREATE POLICY "Teams access for league members" ON public.teams FOR ALL 
USING (EXISTS (SELECT 1 FROM league_members WHERE league_id = teams.league_id AND user_id = auth.uid()));

CREATE POLICY "Fixtures access for league members" ON public.fixtures FOR ALL 
USING (EXISTS (SELECT 1 FROM league_members WHERE league_id = fixtures.league_id AND user_id = auth.uid()));

CREATE POLICY "Players access for league members" ON public.players FOR ALL 
USING (EXISTS (SELECT 1 FROM league_members WHERE league_id = players.league_id AND user_id = auth.uid()));

CREATE POLICY "News access for league members" ON public.news_items FOR ALL 
USING (EXISTS (SELECT 1 FROM league_members WHERE league_id = news_items.league_id AND user_id = auth.uid()));

CREATE POLICY "Scouting access for league members" ON public.scouting_reports FOR ALL 
USING (EXISTS (SELECT 1 FROM league_members WHERE league_id = scouting_reports.league_id AND user_id = auth.uid()));

-- Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Sync any existing users
INSERT INTO public.user_profiles (id, email, display_name)
SELECT id, email, raw_user_meta_data->>'display_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
