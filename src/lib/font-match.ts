/**
 * Font matching via visual comparison.
 * 
 * Approach:
 * 1. AI classifies the font style (geometric sans, humanist serif, etc.)
 * 2. We have a curated map of Google Fonts per classification
 * 3. We return candidates for the user to visually compare
 * 
 * This is more honest than pretending AI can identify exact fonts.
 */

export interface FontClassification {
  classification: string;
  traits: string;
  weight: string;
  usage: string;
  category: string;
}

export interface FontCandidate {
  name: string;
  url: string;
  googleFontsUrl: string;
}

// Curated Google Fonts mapped to style classifications
const FONT_MAP: Record<string, FontCandidate[]> = {
  "geometric sans-serif": [
    { name: "Inter", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Inter" },
    { name: "DM Sans", url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/DM+Sans" },
    { name: "Outfit", url: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Outfit" },
    { name: "Plus Jakarta Sans", url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Plus+Jakarta+Sans" },
    { name: "Figtree", url: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Figtree" },
    { name: "Poppins", url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Poppins" },
    { name: "Nunito Sans", url: "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Nunito+Sans" },
    { name: "Albert Sans", url: "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Albert+Sans" },
  ],
  "grotesque sans-serif": [
    { name: "Space Grotesk", url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Space+Grotesk" },
    { name: "Manrope", url: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Manrope" },
    { name: "Sora", url: "https://fonts.googleapis.com/css2?family=Sora:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Sora" },
    { name: "General Sans", url: "https://fonts.googleapis.com/css2?family=General+Sans:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/General+Sans" },
    { name: "Satoshi", url: "https://fonts.googleapis.com/css2?family=Satoshi:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Satoshi" },
    { name: "Geist", url: "https://fonts.googleapis.com/css2?family=Geist:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Geist" },
  ],
  "humanist sans-serif": [
    { name: "Open Sans", url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Open+Sans" },
    { name: "Source Sans 3", url: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Source+Sans+3" },
    { name: "Lato", url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Lato" },
    { name: "Noto Sans", url: "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Noto+Sans" },
    { name: "Cabin", url: "https://fonts.googleapis.com/css2?family=Cabin:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Cabin" },
  ],
  "neo-grotesque sans-serif": [
    { name: "Roboto", url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Roboto" },
    { name: "Helvetica Neue", url: "", googleFontsUrl: "" },
    { name: "IBM Plex Sans", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/IBM+Plex+Sans" },
    { name: "Work Sans", url: "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Work+Sans" },
  ],
  "condensed sans-serif": [
    { name: "Barlow Condensed", url: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Barlow+Condensed" },
    { name: "Oswald", url: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Oswald" },
    { name: "Fjalla One", url: "https://fonts.googleapis.com/css2?family=Fjalla+One&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Fjalla+One" },
    { name: "Bebas Neue", url: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Bebas+Neue" },
  ],
  "modern serif": [
    { name: "Playfair Display", url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Playfair+Display" },
    { name: "DM Serif Display", url: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/DM+Serif+Display" },
    { name: "Cormorant Garamond", url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Cormorant+Garamond" },
    { name: "Fraunces", url: "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Fraunces" },
  ],
  "transitional serif": [
    { name: "Libre Baskerville", url: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Libre+Baskerville" },
    { name: "Lora", url: "https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Lora" },
    { name: "Merriweather", url: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Merriweather" },
    { name: "Source Serif 4", url: "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Source+Serif+4" },
  ],
  "slab serif": [
    { name: "Roboto Slab", url: "https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Roboto+Slab" },
    { name: "Zilla Slab", url: "https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Zilla+Slab" },
    { name: "Bitter", url: "https://fonts.googleapis.com/css2?family=Bitter:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Bitter" },
  ],
  "display": [
    { name: "Righteous", url: "https://fonts.googleapis.com/css2?family=Righteous&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Righteous" },
    { name: "Fredoka", url: "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Fredoka" },
    { name: "Unbounded", url: "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Unbounded" },
    { name: "Space Mono", url: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Space+Mono" },
  ],
  "monospace": [
    { name: "JetBrains Mono", url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/JetBrains+Mono" },
    { name: "Fira Code", url: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Fira+Code" },
    { name: "Source Code Pro", url: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Source+Code+Pro" },
    { name: "IBM Plex Mono", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/IBM+Plex+Mono" },
  ],
  "handwriting": [
    { name: "Caveat", url: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Caveat" },
    { name: "Kalam", url: "https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Kalam" },
    { name: "Patrick Hand", url: "https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap", googleFontsUrl: "https://fonts.google.com/specimen/Patrick+Hand" },
  ],
};

/**
 * Given a font classification from AI, return candidate fonts for visual comparison.
 * Matches against keys using fuzzy substring matching.
 */
export function getCandidateFonts(classification: string): FontCandidate[] {
  const lower = classification.toLowerCase();
  
  // Try exact match first
  if (FONT_MAP[lower]) return FONT_MAP[lower];
  
  // Fuzzy match — find the best matching category
  let bestMatch = "";
  let bestScore = 0;
  
  for (const key of Object.keys(FONT_MAP)) {
    const words = key.split(/[\s-]+/);
    const score = words.filter(w => lower.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = key;
    }
  }
  
  if (bestMatch && bestScore > 0) return FONT_MAP[bestMatch];
  
  // Fallback to geometric sans-serif (most common in modern design)
  return FONT_MAP["geometric sans-serif"];
}
