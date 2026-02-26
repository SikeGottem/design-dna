-- Moodboards: free-form canvas boards with design intelligence
CREATE TABLE IF NOT EXISTS moodboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  canvas_data JSONB NOT NULL DEFAULT '{"items": [], "width": 1200, "height": 800, "background": "#0a0a0b"}',
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_moodboards_user_id ON moodboards(user_id);

ALTER TABLE moodboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own moodboards" ON moodboards
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public moodboards visible to all" ON moodboards
  FOR SELECT USING (is_public = true);
