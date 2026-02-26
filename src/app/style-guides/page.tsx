"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Palette } from "lucide-react";
import type { StyleGuide } from "@/lib/types";
import { motion } from "framer-motion";

export default function StyleGuidesPage() {
  const [guides, setGuides] = useState<StyleGuide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("style_guides")
        .select("*")
        .order("created_at", { ascending: false });
      setGuides((data as StyleGuide[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-bold md:text-2xl">Style Guides</h1>
          <p className="text-xs text-zinc-500 md:text-sm">Design systems generated from your inspirations</p>
        </div>
        <Link href="/generate">
          <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-500">
            <Plus className="h-3.5 w-3.5" />
            New Guide
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : guides.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <Palette className="h-10 w-10 text-zinc-600" />
          <p className="text-sm text-zinc-500">No style guides yet</p>
          <Link href="/generate">
            <Button className="gap-2 bg-violet-600 hover:bg-violet-500">
              <Plus className="h-4 w-4" />
              Generate Your First
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/style-guides/${guide.id}`}>
                <div className="group rounded-xl border border-white/5 bg-[#141416] p-5 transition-all hover:border-white/10 hover:shadow-lg hover:shadow-violet-500/5">
                  {/* Color swatches preview */}
                  <div className="mb-4 flex gap-1.5">
                    {(guide.guide_data?.color_palette || []).slice(0, 6).map((c: any, j: number) => (
                      <div
                        key={j}
                        className="h-8 flex-1 first:rounded-l-lg last:rounded-r-lg"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200">{guide.name}</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {guide.save_ids.length} sources · {new Date(guide.created_at).toLocaleDateString()}
                  </p>
                  {guide.guide_data?.design_principles && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {guide.guide_data.design_principles.slice(0, 3).map((p: string, j: number) => (
                        <span key={j} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
