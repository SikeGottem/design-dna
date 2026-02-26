import { NextResponse } from "next/server";
import { getGemini } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: saves } = await supabase
      .from("saves")
      .select("*")
      .eq("extraction_status", "complete")
      .order("created_at", { ascending: true });

    if (!saves || saves.length === 0) {
      return NextResponse.json({ error: "No completed saves found" }, { status: 400 });
    }

    const extractions = saves.map((s: any) => ({
      extraction: s.extraction_data,
      created_at: s.created_at,
    })).filter((e: any) => e.extraction);

    // Aggregate mood tags
    const tagCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    const fontClassCounts = new Map<string, number>();
    const allColors: string[] = [];

    for (const { extraction } of extractions) {
      for (const tag of [...(extraction.mood_tags || []), ...(extraction.style_tags || [])]) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
      if (extraction.design_type) {
        typeCounts.set(extraction.design_type, (typeCounts.get(extraction.design_type) || 0) + 1);
      }
      for (const font of extraction.fonts || []) {
        const cls = font.classification || font.category || "unknown";
        fontClassCounts.set(cls, (fontClassCounts.get(cls) || 0) + 1);
      }
      for (const c of extraction.colors || []) {
        if (c.hex) allColors.push(c.hex);
      }
    }

    const total = extractions.length;
    const styleDistribution = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count, percentage: Math.round((count / total) * 100) }));

    const designTypeMix = [...typeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count, percentage: Math.round((count / total) * 100) }));

    const typographyPreferences = [...fontClassCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([classification, count]) => ({ classification, count }));

    // Color tendencies
    const colorTendencies = analyzeColorTendencies(allColors);

    // Taste evolution by month
    const monthMap = new Map<string, Map<string, number>>();
    for (const { extraction, created_at } of extractions) {
      const month = created_at.slice(0, 7); // YYYY-MM
      if (!monthMap.has(month)) monthMap.set(month, new Map());
      const m = monthMap.get(month)!;
      for (const tag of extraction.mood_tags || []) {
        m.set(tag, (m.get(tag) || 0) + 1);
      }
    }
    const tasteEvolution = [...monthMap.entries()].map(([month, tags]) => {
      const sorted = [...tags.entries()].sort((a, b) => b[1] - a[1]);
      return { month, dominant_style: sorted[0]?.[0] || "varied" };
    });

    // AI summary
    const prompt = `You are a design taste analyst. Based on this user's design library data, write a personal, insightful taste summary paragraph (3-4 sentences). Like Spotify Wrapped but for design taste.

Style distribution: ${JSON.stringify(styleDistribution)}
Design types: ${JSON.stringify(designTypeMix)}
Typography: ${JSON.stringify(typographyPreferences)}
Color tendencies: ${JSON.stringify(colorTendencies)}
Total saves: ${total}

Write ONLY the paragraph, no quotes, no JSON. Make it feel personal and specific. Reference actual patterns you see.`;

    const genai = getGemini();
    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([{ text: prompt }]);
    const tasteSummary = result.response.text()?.trim() || "Unable to generate summary.";

    return NextResponse.json({
      profile: {
        style_distribution: styleDistribution,
        color_tendencies: colorTendencies,
        typography_preferences: typographyPreferences,
        design_type_mix: designTypeMix,
        taste_summary: tasteSummary,
        taste_evolution: tasteEvolution,
        total_saves: total,
      },
    });
  } catch (error) {
    console.error("Taste profile error:", error);
    return NextResponse.json({ error: "Failed to generate taste profile" }, { status: 500 });
  }
}

function analyzeColorTendencies(hexColors: string[]): { category: string; percentage: number }[] {
  let warm = 0, cool = 0, neutral = 0;
  let saturated = 0, muted = 0;
  let light = 0, dark = 0;

  for (const hex of hexColors) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r + g + b) / 3;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;

    if (r > b + 20) warm++;
    else if (b > r + 20) cool++;
    else neutral++;

    if (saturation > 0.4) saturated++;
    else muted++;

    if (brightness > 160) light++;
    else dark++;
  }

  const total = hexColors.length || 1;
  return [
    { category: "Warm tones", percentage: Math.round((warm / total) * 100) },
    { category: "Cool tones", percentage: Math.round((cool / total) * 100) },
    { category: "Neutral", percentage: Math.round((neutral / total) * 100) },
    { category: "Saturated", percentage: Math.round((saturated / total) * 100) },
    { category: "Muted", percentage: Math.round((muted / total) * 100) },
    { category: "Light", percentage: Math.round((light / total) * 100) },
    { category: "Dark", percentage: Math.round((dark / total) * 100) },
  ];
}
