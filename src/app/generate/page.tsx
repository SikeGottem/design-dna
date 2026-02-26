"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Wand2, Check } from "lucide-react";
import type { Save } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function GeneratePage() {
  const router = useRouter();
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("saves")
        .select("*")
        .eq("extraction_status", "complete")
        .order("created_at", { ascending: false });
      setSaves((data as Save[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else if (next.size < 10) next.add(id);
    else toast.error("Max 10 saves");
    setSelected(next);
  };

  const handleGenerate = async () => {
    if (selected.size < 3) return toast.error("Select at least 3 saves");
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-style-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveIds: [...selected], name: name || "Untitled Style Guide" }),
      });
      if (!res.ok) throw new Error("Failed");
      const { guide } = await res.json();
      toast.success("Style guide generated!");
      router.push(`/style-guides/${guide.id}`);
    } catch {
      toast.error("Generation failed");
    }
    setGenerating(false);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="mb-1 text-xl font-bold md:text-2xl">Generate Style Guide</h1>
        <p className="text-xs text-zinc-500 md:text-sm">Select 3-10 saves to synthesize into a unified design system</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs text-zinc-500">Style Guide Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Style Guide"
            className="border-white/10 bg-white/5 text-sm"
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={selected.size < 3 || generating}
          className="gap-2 bg-violet-600 hover:bg-violet-500 min-h-[40px]"
        >
          <Wand2 className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating..." : `Generate (${selected.size}/3-10)`}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {saves.map((save, i) => (
            <motion.button
              key={save.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => toggle(save.id)}
              className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                selected.has(save.id)
                  ? "border-violet-500 ring-2 ring-violet-500/20"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-zinc-900">
                <img
                  src={save.image_url}
                  alt={save.description || "Design"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              {selected.has(save.id) && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div className="p-2">
                <p className="truncate text-[11px] text-zinc-400">{save.description || "Untitled"}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
