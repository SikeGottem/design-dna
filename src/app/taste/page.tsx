"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Sparkles, RefreshCw } from "lucide-react";
import type { TasteProfileData } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function TastePage() {
  const [profile, setProfile] = useState<TasteProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalSaves, setTotalSaves] = useState(0);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/taste-profile", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setProfile(data.profile);
      setTotalSaves(data.profile.total_saves || 0);
    } catch {
      toast.error("Failed to generate taste profile");
    }
    setLoading(false);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="mb-1 text-xl font-bold md:text-2xl">Your Taste Profile</h1>
        <p className="text-xs text-zinc-500 md:text-sm">Spotify Wrapped, but for your design taste</p>
      </div>

      {!profile && !loading && (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-teal-400/20 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold">Discover Your Design DNA</h2>
          <p className="max-w-sm text-center text-sm text-zinc-500">
            Analyze your entire library to uncover patterns in your design taste
          </p>
          <Button onClick={generate} className="gap-2 bg-violet-600 hover:bg-violet-500">
            <Sparkles className="h-4 w-4" /> Generate Taste Profile
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}

      {profile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Taste Summary */}
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-teal-500/5 p-6 md:p-8">
            <p className="text-[10px] uppercase tracking-wider text-violet-400 mb-3">Your Design Taste</p>
            <p className="text-base leading-relaxed text-zinc-200 md:text-lg">{profile.taste_summary}</p>
            <p className="mt-4 text-xs text-zinc-500">Based on {totalSaves} saves in your library</p>
          </div>

          {/* Style Distribution */}
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Style Distribution</h2>
            <div className="space-y-2">
              {profile.style_distribution.map((item, i) => (
                <motion.div
                  key={item.tag}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-24 text-xs text-zinc-400 truncate">{item.tag}</span>
                  <div className="flex-1 h-6 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(item.percentage, 100)}%` }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400"
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-medium text-zinc-300">{item.percentage}%</span>
                </motion.div>
              ))}
            </div>
          </section>

          <Separator className="bg-white/5" />

          {/* Color Tendencies */}
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Color Tendencies</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {profile.color_tendencies.filter(c => c.percentage > 0).map((c, i) => (
                <div key={c.category} className="rounded-xl border border-white/5 bg-[#141416] p-4 text-center">
                  <p className="text-2xl font-bold text-zinc-200">{c.percentage}%</p>
                  <p className="mt-1 text-xs text-zinc-500">{c.category}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator className="bg-white/5" />

          {/* Typography Preferences */}
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Typography Preferences</h2>
            <div className="flex flex-wrap gap-2">
              {profile.typography_preferences.map((t) => (
                <span key={t.classification} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                  {t.classification} <span className="text-zinc-500">({t.count})</span>
                </span>
              ))}
            </div>
          </section>

          <Separator className="bg-white/5" />

          {/* Design Type Mix */}
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Design Type Mix</h2>
            <div className="space-y-2">
              {profile.design_type_mix.map((item, i) => (
                <div key={item.type} className="flex items-center gap-3">
                  <span className="w-24 text-xs capitalize text-zinc-400">{item.type}</span>
                  <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500/60"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-zinc-500">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </section>

          {/* Taste Evolution */}
          {profile.taste_evolution.length > 1 && (
            <>
              <Separator className="bg-white/5" />
              <section>
                <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Taste Evolution</h2>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {profile.taste_evolution.map((e) => (
                    <div key={e.month} className="shrink-0 rounded-lg border border-white/5 bg-[#141416] px-4 py-3 text-center">
                      <p className="text-[10px] text-zinc-500">{e.month}</p>
                      <p className="mt-1 text-xs font-medium text-violet-300">{e.dominant_style}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Regenerate */}
          <div className="flex justify-center pt-4">
            <Button onClick={generate} variant="outline" size="sm" className="gap-2 border-white/10">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate Profile
            </Button>
          </div>
        </motion.div>
      )}
    </AppShell>
  );
}
