import { NextResponse } from "next/server";
import { getGemini } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { saveIds, name } = await request.json();

    if (!saveIds || !Array.isArray(saveIds) || saveIds.length < 3 || saveIds.length > 10) {
      return NextResponse.json({ error: "Select 3-10 saves" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch saves
    const { data: saves } = await supabase
      .from("saves")
      .select("*")
      .in("id", saveIds)
      .eq("extraction_status", "complete");

    if (!saves || saves.length < 3) {
      return NextResponse.json({ error: "Need at least 3 completed saves" }, { status: 400 });
    }

    // Aggregate extraction data
    const extractions = saves.map((s: any) => s.extraction_data).filter(Boolean);

    // Collect all colors across saves
    const allColors = extractions.flatMap((e: any) => e.colors || []);
    // Find most common color clusters
    const colorClusters = findColorClusters(allColors);

    const prompt = `You are a design system expert. I have ${extractions.length} design inspirations. Analyze them together and synthesize a unified style guide.

Here is the extraction data from each design:
${JSON.stringify(extractions, null, 2)}

The most common pixel-extracted colors across all designs are:
${JSON.stringify(colorClusters, null, 2)}

Generate a comprehensive style guide. Respond ONLY with valid JSON (no markdown fences):
{
  "color_palette": [
    { "hex": "#hexcode", "name": "Human name", "usage": "When/how to use this color" }
  ],
  "font_pairings": [
    { "heading": "Google Font Name", "body": "Google Font Name", "reason": "Why this pairing works" }
  ],
  "spacing_scale": [4, 8, 16, 24, 32, 48, 64],
  "design_principles": ["principle 1", "principle 2", "principle 3"],
  "dos": ["Do this", "Do that"],
  "donts": ["Don't do this", "Don't do that"],
  "sample_components": [
    { "name": "Button", "description": "Detailed description of how a button should look in this style" },
    { "name": "Card", "description": "..." },
    { "name": "Header", "description": "..." }
  ]
}

Rules:
- Color palette: 5-8 colors synthesized from common threads. Include primary, secondary, accent, background, text.
- Font pairings: 2-3 combos. Use ONLY real Google Fonts names.
- Design principles: 3-5 distilled from mood/style patterns.
- Dos and Don'ts: 4-6 each based on the patterns.
- Sample components: At least button, card, header. Be specific about colors, spacing, typography.`;

    const genai = getGemini();
    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([{ text: prompt }]);
    const content = result.response.text();
    if (!content) throw new Error("No response from AI");

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const guideData = JSON.parse(cleaned);

    // Add Google Fonts URLs
    if (guideData.font_pairings) {
      guideData.font_pairings = guideData.font_pairings.map((fp: any) => ({
        ...fp,
        heading_url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fp.heading)}:wght@400;500;600;700&display=swap`,
        body_url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fp.body)}:wght@300;400;500;600&display=swap`,
      }));
    }

    // Save to database
    const { data: guide, error } = await supabase
      .from("style_guides")
      .insert({
        user_id: user.id,
        name: name || "Untitled Style Guide",
        save_ids: saveIds,
        guide_data: guideData,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ guide });
  } catch (error) {
    console.error("Style guide generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function findColorClusters(colors: any[]): { hex: string; count: number }[] {
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

  for (const c of colors) {
    if (!c.hex) continue;
    const r = parseInt(c.hex.slice(1, 3), 16);
    const g = parseInt(c.hex.slice(3, 5), 16);
    const b = parseInt(c.hex.slice(5, 7), 16);

    // Quantize to nearest 32
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;

    const existing = buckets.get(key);
    if (existing) {
      existing.count++;
      existing.r = Math.round((existing.r * (existing.count - 1) + r) / existing.count);
      existing.g = Math.round((existing.g * (existing.count - 1) + g) / existing.count);
      existing.b = Math.round((existing.b * (existing.count - 1) + b) / existing.count);
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((c) => ({
      hex: `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`,
      count: c.count,
    }));
}
