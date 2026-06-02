-- FitAI Coach — Gamification & rapports (exécuter dans Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}',
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_subscription JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges_cache JSONB DEFAULT '[]';

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges: user owns" ON user_badges;
CREATE POLICY "Badges: user owns" ON user_badges FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reports: user owns" ON weekly_reports;
CREATE POLICY "Reports: user owns" ON weekly_reports FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_week ON weekly_reports(user_id, week_start);
