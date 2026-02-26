import { NextResponse } from "next/server";
import { getGemini } from "@/lib/gemini";
import { extractColors } from "@/lib/color-extract";
import { getCandidateFonts } from "@/lib/font-match";
import { createClient } from "@/lib/supabase/server";

const EXTRACTION_PROMPT = `You are a design analysis expert. Analyze this image.

Colors have ALREADY been extracted from pixels. Do NOT identify colors.

Your job:

1. **design_type**: website, app_ui, poster, packaging, logo, brand_identity, illustration, photography, social_media, print, other
2. **description**: One concise sentence describing this design
3. **fonts**: For each distinct text style visible in the image:
   - **classification**: Precisely classify the font style. Use one of these categories: "geometric sans-serif", "grotesque sans-serif", "humanist sans-serif", "neo-grotesque sans-serif", "condensed sans-serif", "modern serif", "transitional serif", "slab serif", "display", "monospace", "handwriting". Be specific.
   - **traits**: Describe what makes this typeface distinctive (e.g., "high x-height, rounded terminals, uniform stroke width, open apertures")
   - **weight**: The approximate weight (300, 400, 500, 600, 700, 800, 900)
   - **usage**: headings, body, display, captions
   - **sample_text**: Copy the actual text from the image that uses this font (first few words, max 30 chars)
4. **mood_tags**: 3-8 single-word emotional/aesthetic descriptors
5. **style_tags**: Visual technique tags (flat, gradient, photographic, etc.)

Respond ONLY with valid JSON (no markdown fences):
{
  "design_type": "string",
  "description": "string",
  "fonts": [
    {
      "classification": "geometric sans-serif",
      "traits": "high x-height, rounded terminals, uniform stroke width",
      "weight": "700",
      "usage": "headings",
      "sample_text": "Welcome to our"
    }
  ],
  "mood_tags": ["minimal", "warm"],
  "style_tags": ["flat", "geometric"]
}

Rules:
- classification MUST be one of the listed categories. Pick the closest one.
- traits should describe distinguishing visual features a designer would notice.
- sample_text: copy the ACTUAL text from the image that uses this font. This is critical for visual comparison.
- If there are multiple distinct font styles (e.g., headings vs body), list each separately.
- Do NOT try to guess the exact font name. Just classify the style accurately.`;

export async function POST(request: Request) {
  try {
    const { saveId, imageUrl } = await request.json();

    if (!saveId || !imageUrl) {
      return NextResponse.json({ error: "Missing saveId or imageUrl" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update status to processing
    await supabase
      .from("saves")
      .update({ extraction_status: "processing" })
      .eq("id", saveId);

    // Fetch image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Step 1: Extract EXACT colors from pixels
    const pixelColors = await extractColors(imageBuffer, 8);

    // Step 2: Send to Gemini for fonts, mood, style, and color naming
    const base64Image = imageBuffer.toString("base64");
    const genai = getGemini();
    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: { mimeType, data: base64Image },
      },
      {
        text: EXTRACTION_PROMPT,
      },
    ]);

    const content = result.response.text();
    if (!content) throw new Error("No response from AI");

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const aiResult = JSON.parse(cleaned);

    // Colors are pixel-exact. No AI guessing needed.
    const colors = pixelColors.map((pc, i) => ({
      hex: pc.hex,
      name: pc.hex, // Just show the hex — it's the truth
      role: i === 0 ? "background" : i === 1 ? "primary" : i === 2 ? "secondary" : "accent",
      prominence: pc.percentage / 100,
    }));

    // Attach candidate fonts from our curated map
    const fontsWithCandidates = (aiResult.fonts || []).map((font: any) => ({
      ...font,
      candidates: getCandidateFonts(font.classification || "geometric sans-serif"),
    }));

    // Build final extraction object
    const extraction = {
      extraction_version: "2.0",
      design_type: aiResult.design_type,
      description: aiResult.description,
      colors,
      fonts: fontsWithCandidates,
      mood_tags: aiResult.mood_tags || [],
      style_tags: aiResult.style_tags || [],
      confidence: {
        colors: 0.95, // Pixel-extracted = high confidence
        fonts: Math.max(...(aiResult.fonts?.map((f: any) => f.confidence) || [0])),
        mood: 0.8,
        overall: 0.85,
      },
    };

    // Update save
    await supabase
      .from("saves")
      .update({
        extraction_status: "complete",
        extraction_data: extraction,
        design_type: extraction.design_type,
        description: extraction.description,
      })
      .eq("id", saveId);

    // Denormalize colors
    if (extraction.colors.length) {
      const colorRows = extraction.colors.map((c: any, i: number) => ({
        save_id: saveId,
        hex: c.hex,
        rgb_r: parseInt(c.hex.slice(1, 3), 16),
        rgb_g: parseInt(c.hex.slice(3, 5), 16),
        rgb_b: parseInt(c.hex.slice(5, 7), 16),
        role: c.role,
        prominence: c.prominence,
        position: i,
      }));
      // Delete old colors first (in case of retry)
      await supabase.from("save_colors").delete().eq("save_id", saveId);
      await supabase.from("save_colors").insert(colorRows);
    }

    // Denormalize tags
    const tags = [
      ...(extraction.mood_tags || []).map((t: string) => ({ save_id: saveId, tag: t, tag_type: "mood" as const })),
      ...(extraction.style_tags || []).map((t: string) => ({ save_id: saveId, tag: t, tag_type: "style" as const })),
    ];
    if (tags.length) {
      await supabase.from("save_tags").delete().eq("save_id", saveId);
      await supabase.from("save_tags").insert(tags);
    }

    return NextResponse.json({ extraction });
  } catch (error) {
    console.error("Extraction error:", error);

    try {
      const { saveId } = await request.clone().json();
      if (saveId) {
        const supabase = await createClient();
        await supabase.from("saves").update({ extraction_status: "failed" }).eq("id", saveId);
      }
    } catch {}

    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
