import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const EXTRACTION_SYSTEM_PROMPT = `You are a design analysis expert. Analyze the provided image and extract design DNA.

Respond ONLY with valid JSON matching this schema:
{
  "extraction_version": "1.0",
  "design_type": "website|app_ui|poster|packaging|logo|brand_identity|illustration|photography|social_media|print|other",
  "description": "One concise sentence describing this design piece",
  "colors": [
    {
      "hex": "#hexcode",
      "name": "Human-readable color name",
      "role": "background|primary|secondary|accent|text",
      "prominence": 0.0
    }
  ],
  "fonts": [
    {
      "name": "Font Name",
      "category": "sans-serif|serif|monospace|display|handwriting",
      "weight": "400, 700",
      "usage": "headings|body|display|captions",
      "confidence": 0.0,
      "alternatives": ["Alt Font 1"]
    }
  ],
  "mood_tags": ["tag1", "tag2"],
  "style_tags": ["tag1", "tag2"],
  "confidence": {
    "colors": 0.0,
    "fonts": 0.0,
    "mood": 0.0,
    "overall": 0.0
  }
}

Rules:
- Colors: Extract 5-8 dominant colors. Order by visual prominence. Include background, primary, secondary, accent roles.
- Fonts: Identify typefaces. If unsure, provide best guess + alternatives. Set confidence 0-1.
- Mood tags: 3-8 single-word descriptors for the emotional feel. Think: how would a designer search for this?
- Style tags: Visual technique descriptors (flat, gradient, illustrated, photographic, etc.)
- Be precise with color hex values. Use the actual pixel colors, not approximations.
- Consider whether this is a photograph OF a design (adjust for lighting/angle) or a direct digital screenshot (colors are pixel-accurate).`;
