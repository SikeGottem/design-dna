"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Moodboard } from "@/lib/types";
import { LayoutDashboard, Lock } from "lucide-react";
import Link from "next/link";

export default function MoodboardViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [moodboard, setMoodboard] = useState<Moodboard | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("moodboards").select("*").eq("id", id).eq("is_public", true).single();
      if (!data) { setNotFound(true); return; }
      setMoodboard(data as Moodboard);
    })();
  }, [id]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0b] text-white">
        <Lock className="mb-4 h-10 w-10 text-zinc-600" />
        <h1 className="text-lg font-semibold">This moodboard is private</h1>
        <p className="mt-1 text-sm text-zinc-500">Ask the owner to share it publicly</p>
        <Link href="/moodboards" className="mt-4 text-sm text-violet-400 hover:underline">← Back to moodboards</Link>
      </div>
    );
  }

  if (!moodboard) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const { canvas_data } = moodboard;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-500 to-teal-400" />
          <span className="text-sm font-semibold">{moodboard.name}</span>
        </div>
        <span className="text-xs text-zinc-600">Made with Design DNA</span>
      </div>

      <div className="flex items-center justify-center overflow-auto p-8">
        <div
          className="relative rounded-lg shadow-2xl"
          style={{
            width: canvas_data.width,
            height: canvas_data.height,
            background: canvas_data.background,
            transform: "scale(0.7)",
            transformOrigin: "top center",
          }}
        >
          {canvas_data.items.map((item) => (
            <div
              key={item.id}
              className="absolute"
              style={{
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
                zIndex: item.zIndex,
                transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
              }}
            >
              {item.type === "image" && item.imageUrl && (
                <img src={item.imageUrl} alt="" className="h-full w-full rounded-md object-cover" />
              )}
              {item.type === "text" && (
                <div className="h-full w-full rounded-md bg-white/5 border border-white/10 p-3" style={{ fontSize: item.fontSize ?? 14 }}>
                  <p className="text-white/80 whitespace-pre-wrap">{item.text}</p>
                </div>
              )}
              {item.type === "color" && (
                <div className="h-full w-full rounded-lg" style={{ backgroundColor: item.color }}>
                  <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/40 px-2 py-1 text-center">
                    <span className="text-[10px] font-mono text-white/70">{item.color}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {moodboard.description && (
        <div className="mx-auto max-w-2xl px-6 pb-8 text-center">
          <p className="text-sm text-zinc-500">{moodboard.description}</p>
        </div>
      )}
    </div>
  );
}
