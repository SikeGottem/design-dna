CREATE TABLE IF NOT EXISTS style_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  save_ids UUID[] NOT NULL,
  guide_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE style_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own guides" ON style_guides FOR ALL USING (user_id = auth.uid());
