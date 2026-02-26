"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Globe } from "lucide-react";
import type { Moodboard } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function MoodboardsPage() {
  const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("moodboards")
        .select("*")
        .order("updated_at", { ascending: false });
      setMoodboards((data as Moodboard[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const handleNew = () => router.push("/moodboards/new");

  return (
    <AppShell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Moodboards</h1>
          <p className="text-sm text-zinc-500">Free-form visual canvases for your design vision</p>
        </div>
        <Button onClick={handleNew} size="sm" className="gap-2 bg-violet-600 hover:bg-violet-500">
          <Plus className="h-3.5 w-3.5" />
          New Moodboard
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/2] animate-pulse rounded-xl border border-white/5 bg-[#141416]" />
          ))}
        </div>
      ) : moodboards.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
            <LayoutDashboard className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
            <h3 className="mb-1 text-lg font-semibold">No moodboards yet</h3>
            <p className="mb-4 text-sm text-zinc-500">Create a free-form canvas to explore your design direction</p>
            <Button onClick={handleNew} className="gap-2 bg-violet-600 hover:bg-violet-500">
              <Plus className="h-4 w-4" />
              Create Moodboard
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moodboards.map((mb, i) => (
            <motion.div
              key={mb.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/moodboards/${mb.id}`}>
                <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#141416] transition-all hover:border-white/10 hover:shadow-lg hover:shadow-violet-500/5">
                  {/* Canvas preview */}
                  <div className="relative aspect-[3/2] overflow-hidden bg-[#0a0a0b]">
                    <MoodboardPreview canvasData={mb.canvas_data} />
                    {mb.is_public && (
                      <div className="absolute right-2 top-2">
                        <span className="flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-medium text-teal-300">
                          <Globe className="h-2.5 w-2.5" /> Public
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm">{mb.name}</h3>
                    {mb.description && (
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{mb.description}</p>
                    )}
                    <p className="mt-1 text-[10px] text-zinc-600">
                      {mb.canvas_data.items.length} items · Updated {new Date(mb.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function MoodboardPreview({ canvasData }: { canvasData: Moodboard["canvas_data"] }) {
  if (!canvasData?.items?.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <LayoutDashboard className="h-8 w-8 text-zinc-800" />
      </div>
    );
  }

  const scale = 0.25;
  return (
    <div className="relative h-full w-full" style={{ background: canvasData.background }}>
      {canvasData.items.slice(0, 12).map((item) => (
        <div
          key={item.id}
          className="absolute overflow-hidden rounded-sm"
          style={{
            left: item.x * scale,
            top: item.y * scale,
            width: item.width * scale,
            height: item.height * scale,
            transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
            zIndex: item.zIndex,
          }}
        >
          {item.type === "image" && item.imageUrl && (
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          )}
          {item.type === "color" && (
            <div className="h-full w-full" style={{ backgroundColor: item.color }} />
          )}
          {item.type === "text" && (
            <div className="p-0.5 text-[6px] text-white/60">{item.text}</div>
          )}
        </div>
      ))}
    </div>
  );
}
