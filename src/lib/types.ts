export interface ExtractionColor {
  hex: string;
  name: string;
  role: "primary" | "secondary" | "accent" | "background" | "text";
  prominence: number;
}

export interface ExtractionFont {
  name: string;
  category: string;
  weight: string;
  confidence: number;
  usage: string;
  alternatives?: string[];
}

export interface DesignCritique {
  layout_analysis: string;
  what_works: string[];
  scores: {
    layout: number;
    typography: number;
    color: number;
    hierarchy: number;
    overall: number;
  };
  principle: string;
}

export interface StyleGuide {
  id: string;
  user_id: string;
  name: string;
  save_ids: string[];
  guide_data: StyleGuideData;
  created_at: string;
}

export interface StyleGuideData {
  color_palette: { hex: string; name: string; usage: string }[];
  font_pairings: { heading: string; body: string; reason: string; heading_url?: string; body_url?: string }[];
  spacing_scale: number[];
  design_principles: string[];
  dos: string[];
  donts: string[];
  sample_components: { name: string; description: string }[];
}

export interface TasteProfileData {
  style_distribution: { tag: string; count: number; percentage: number }[];
  color_tendencies: { category: string; percentage: number }[];
  typography_preferences: { classification: string; count: number }[];
  design_type_mix: { type: string; count: number; percentage: number }[];
  taste_summary: string;
  taste_evolution: { month: string; dominant_style: string }[];
}

export interface ExtractionData {
  extraction_version: string;
  design_type: string;
  description: string;
  colors: ExtractionColor[];
  fonts: ExtractionFont[];
  mood_tags: string[];
  style_tags: string[];
  critique?: DesignCritique | null;
  confidence?: {
    colors: number;
    fonts: number;
    mood: number;
    overall: number;
  };
}

export interface Save {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url: string | null;
  original_filename: string | null;
  extraction_status: "pending" | "processing" | "complete" | "failed" | "partial";
  extraction_data: ExtractionData | null;
  design_type: string | null;
  description: string | null;
  user_notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_save_id: string | null;
  created_at: string;
  updated_at: string;
  saves?: Save[];
  save_count?: number;
  cover_save?: Save | null;
}

export interface BoardSave {
  board_id: string;
  save_id: string;
  position: number;
  added_at: string;
}

export type DesignType = "all" | "website" | "poster" | "packaging" | "logo" | "ui" | "illustration" | "other";
