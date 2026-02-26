"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Copy, Check } from "lucide-react";
import type { StyleGuide, StyleGuideData } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function StyleGuideDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [guide, setGuide] = useState<StyleGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("style_guides").select("*").eq("id", id).single();
      if (data) setGuide(data as StyleGuide);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  if (loading) return <AppShell><Skeleton className="h-96 rounded-xl" /></AppShell>;
  if (!guide) return <AppShell><p className="text-zinc-500 text-center mt-20">Style guide not found</p></AppShell>;

  const data = guide.guide_data as StyleGuideData;

  return (
    <AppShell>
      <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{guide.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{guide.save_ids.length} inspirations · {new Date(guide.created_at).toLocaleDateString()}</p>
        </div>

        {/* Color Palette */}
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Color Palette</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {data.color_palette?.map((color, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => copyColor(color.hex)}
                className="group rounded-xl border border-white/5 bg-[#141416] overflow-hidden transition-all hover:border-white/10"
              >
                <div className="h-24 sm:h-28" style={{ backgroundColor: color.hex }} />
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">{color.name}</span>
                    {copiedColor === color.hex ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-zinc-500">{color.hex}</p>
                  <p className="mt-1 text-[10px] text-zinc-600">{color.usage}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        <Separator className="bg-white/5" />

        {/* Font Pairings */}
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Font Pairings</h2>
          <div className="space-y-4">
            {data.font_pairings?.map((pair, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-[#141416] p-6">
                {pair.heading_url && <link rel="stylesheet" href={pair.heading_url} />}
                {pair.body_url && <link rel="stylesheet" href={pair.body_url} />}
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-violet-400 mb-2">Heading</p>
                    <p className="text-3xl font-bold text-zinc-100" style={{ fontFamily: `'${pair.heading}', sans-serif` }}>
                      The quick brown fox
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{pair.heading}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-teal-400 mb-2">Body</p>
                    <p className="text-base leading-relaxed text-zinc-300" style={{ fontFamily: `'${pair.body}', sans-serif` }}>
                      The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{pair.body}</p>
                  </div>
                  <p className="text-xs text-zinc-500 italic">{pair.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-white/5" />

        {/* Spacing Scale */}
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Spacing Scale</h2>
          <div className="flex items-end gap-2 flex-wrap">
            {(data.spacing_scale || [4, 8, 16, 24, 32, 48, 64]).map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <div
                  className="rounded-md bg-violet-500/30 border border-violet-500/20"
                  style={{ width: size, height: size, minWidth: 4, minHeight: 4 }}
                />
                <span className="text-[10px] font-mono text-zinc-500">{size}</span>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-white/5" />

        {/* Design Principles */}
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Design Principles</h2>
          <div className="flex flex-wrap gap-2">
            {data.design_principles?.map((p, i) => (
              <span key={i} className="rounded-full bg-gradient-to-r from-violet-500/20 to-teal-500/20 border border-violet-500/10 px-4 py-2 text-sm text-zinc-200">
                {p}
              </span>
            ))}
          </div>
        </section>

        <Separator className="bg-white/5" />

        {/* Do's and Don'ts */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-green-500/10 bg-green-500/5 p-5">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-green-400">Do&apos;s</h3>
            <ul className="space-y-2">
              {data.dos?.map((d, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-300">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-5">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-red-400">Don&apos;ts</h3>
            <ul className="space-y-2">
              {data.donts?.map((d, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-300">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-white/5" />

        {/* Sample Components */}
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Sample Components</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.sample_components?.map((comp, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-[#141416] p-5">
                <h3 className="mb-2 text-sm font-semibold text-violet-400">{comp.name}</h3>
                <p className="text-xs leading-relaxed text-zinc-400">{comp.description}</p>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    </AppShell>
  );
}
