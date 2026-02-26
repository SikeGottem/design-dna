-- Design DNA - Initial Schema
-- Run via Supabase Dashboard SQL Editor or `supabase db push`

-- Users (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Saves
CREATE TABLE IF NOT EXISTS saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_filename TEXT,
  image_width INT,
  image_height INT,
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'complete', 'failed', 'partial')),
  extraction_data JSONB,
  extraction_version TEXT,
  design_type TEXT,
  description TEXT,
  user_notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_saves_user_id ON saves(user_id);
CREATE INDEX idx_saves_design_type ON saves(user_id, design_type);
CREATE INDEX idx_saves_created_at ON saves(user_id, created_at DESC);
CREATE INDEX idx_saves_extraction_status ON saves(extraction_status) WHERE extraction_status != 'complete';

-- Save Colors (denormalized for search)
CREATE TABLE IF NOT EXISTS save_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  save_id UUID REFERENCES saves(id) ON DELETE CASCADE NOT NULL,
  hex TEXT NOT NULL,
  rgb_r INT,
  rgb_g INT,
  rgb_b INT,
  lab_l FLOAT,
  lab_a FLOAT,
  lab_b FLOAT,
  role TEXT,
  prominence FLOAT,
  position INT
);

CREATE INDEX idx_save_colors_save_id ON save_colors(save_id);
CREATE INDEX idx_save_colors_lab ON save_colors(lab_l, lab_a, lab_b);

-- Save Tags (denormalized for search)
CREATE TABLE IF NOT EXISTS save_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  save_id UUID REFERENCES saves(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  tag_type TEXT CHECK (tag_type IN ('mood', 'style', 'custom')),
  UNIQUE(save_id, tag)
);

CREATE INDEX idx_save_tags_tag ON save_tags(tag);
CREATE INDEX idx_save_tags_save_id ON save_tags(save_id);

-- Boards
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_save_id UUID REFERENCES saves(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_boards_user_id ON boards(user_id);

-- Board Saves (junction table)
CREATE TABLE IF NOT EXISTS board_saves (
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  save_id UUID REFERENCES saves(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (board_id, save_id)
);

-- Full-text search
ALTER TABLE saves ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(description, '') || ' ' ||
      coalesce(design_type, '') || ' ' ||
      coalesce(user_notes, '')
    )
  ) STORED;

CREATE INDEX idx_saves_fts ON saves USING GIN(fts);

-- Row Level Security
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE save_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE save_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own saves" ON saves FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users see own save_colors" ON save_colors FOR ALL USING (
  save_id IN (SELECT id FROM saves WHERE user_id = auth.uid())
);
CREATE POLICY "Users see own save_tags" ON save_tags FOR ALL USING (
  save_id IN (SELECT id FROM saves WHERE user_id = auth.uid())
);
CREATE POLICY "Users see own boards" ON boards FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users see own board_saves" ON board_saves FOR ALL USING (
  board_id IN (SELECT id FROM boards WHERE user_id = auth.uid())
);

-- Storage bucket (create via Supabase Dashboard):
-- Bucket: "saves" (public)
-- Policy: authenticated users can CRUD their own {user_id}/ prefix
