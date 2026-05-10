-- ============================================================
-- FitAI Coach — Schema Supabase Complet (Idempotent)
-- Exécute ce script dans Supabase > SQL Editor
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  sex TEXT CHECK (sex IN ('m','f')),
  age INTEGER,
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,1),
  goal_weight_kg NUMERIC(5,2),
  goal TEXT CHECK (goal IN ('gain','loss','maintain')),
  activity_level NUMERIC(3,2) DEFAULT 1.55,
  mode TEXT CHECK (mode IN ('normal','strict','extreme')) DEFAULT 'normal',
  deadline_weeks INTEGER DEFAULT 4,
  equipment TEXT[] DEFAULT '{}',
  diet_constraints TEXT[] DEFAULT '{}',
  program_start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')) NOT NULL,
  food_name TEXT NOT NULL,
  quantity_g NUMERIC(6,1),
  kcal INTEGER,
  protein_g NUMERIC(5,1),
  carbs_g NUMERIC(5,1),
  fat_g NUMERIC(5,1),
  photo_url TEXT,
  source TEXT CHECK (source IN ('manual','ai_scan','search')) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, logged_date)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_name TEXT,
  day_index INTEGER,
  exercises JSONB DEFAULT '[]',
  completed BOOLEAN DEFAULT FALSE,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user','assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_kcal INTEGER NOT NULL,
  target_protein NUMERIC(5,1) NOT NULL,
  target_carbs NUMERIC(5,1) NOT NULL,
  target_fat NUMERIC(5,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_date)
);

-- ============================================================
-- WEEKLY CHECKINS (Adaptive Progression Engine)
-- ============================================================
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight NUMERIC(5,2),
  calories_avg INTEGER,
  adherence_score NUMERIC(3,1) CHECK (adherence_score >= 0 AND adherence_score <= 10),
  sleep_score NUMERIC(3,1) CHECK (sleep_score >= 0 AND sleep_score <= 10),
  fatigue_score NUMERIC(3,1) CHECK (fatigue_score >= 0 AND fatigue_score <= 10),
  motivation_score NUMERIC(3,1) CHECK (motivation_score >= 0 AND motivation_score <= 10),
  workout_performance_score NUMERIC(3,1) CHECK (workout_performance_score >= 0 AND workout_performance_score <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Checkins: user owns" ON weekly_checkins FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON weekly_checkins(user_id, checkin_date);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_goal ON profiles(goal);
CREATE INDEX IF NOT EXISTS idx_profiles_mode ON profiles(mode);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_food_logs_meal ON food_logs(user_id, meal_type, logged_date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: user owns" ON profiles;
CREATE POLICY "Profiles: user owns" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Food logs: user owns" ON food_logs;
CREATE POLICY "Food logs: user owns" ON food_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Weight logs: user owns" ON weight_logs;
CREATE POLICY "Weight logs: user owns" ON weight_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workout sessions: user owns" ON workout_sessions;
CREATE POLICY "Workout sessions: user owns" ON workout_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Chat messages: user owns" ON chat_messages;
CREATE POLICY "Chat messages: user owns" ON chat_messages FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Daily targets: user owns" ON daily_targets;
CREATE POLICY "Daily targets: user owns" ON daily_targets FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
