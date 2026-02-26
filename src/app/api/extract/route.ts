import { NextResponse } from "next/server";
import { getOpenAI, EXTRACTION_SYSTEM_PROMPT } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

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

    // Call GPT-4o Vision
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
            { type: "text", text: "Extract the design DNA from this image." },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    const extraction = JSON.parse(content);

    // Update save with extraction data
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
    if (extraction.colors?.length) {
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
      await supabase.from("save_colors").insert(colorRows);
    }

    // Denormalize tags
    const tags = [
      ...(extraction.mood_tags || []).map((t: string) => ({ save_id: saveId, tag: t, tag_type: "mood" })),
      ...(extraction.style_tags || []).map((t: string) => ({ save_id: saveId, tag: t, tag_type: "style" })),
    ];
    if (tags.length) {
      await supabase.from("save_tags").insert(tags);
    }

    return NextResponse.json({ extraction });
  } catch (error) {
    console.error("Extraction error:", error);

    // Try to update status to failed
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
