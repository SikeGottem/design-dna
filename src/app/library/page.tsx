"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { SaveCard, SaveCardSkeleton } from "@/components/save-card";
import { UploadZone } from "@/components/upload-zone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, Plus } from "lucide-react";
import type { Save, DesignType } from "@/lib/types";

const filterChips: { label: string; value: DesignType }[] = [
  { label: "All", value: "all" },
  { label: "Website", value: "website" },
  { label: "Poster", value: "poster" },
  { label: "Packaging", value: "packaging" },
  { label: "Logo", value: "logo" },
  { label: "UI", value: "ui" },
  { label: "Other", value: "other" },
];

export default function LibraryPage() {
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DesignType>("all");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("upload") === "true") {
      setUploadOpen(true);
      router.replace("/library");
    }
  }, [searchParams, router]);

  const fetchSaves = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("saves")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("design_type", filter);
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,design_type.ilike.%${search}%`);
    }

    const { data } = await query;
    setSaves((data as Save[]) ?? []);
    setLoading(false);
  }, [filter, search]);

  useEffect(() => {
    fetchSaves();
  }, [fetchSaves]);

  const handleUploadComplete = () => {
    fetchSaves();
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold">Library</h1>
        <p className="text-sm text-zinc-500">Your design inspiration collection</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search by tag, description, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter(chip.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === chip.value
                  ? "bg-violet-500/20 text-violet-300"
                  : "bg-white/5 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <SaveCardSkeleton />
            </div>
          ))}
        </div>
      ) : saves.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
            <Upload className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
            <h3 className="mb-1 text-lg font-semibold">Drop your first design</h3>
            <p className="mb-4 text-sm text-zinc-500">
              Upload a screenshot and AI will extract its design DNA
            </p>
            <Button
              onClick={() => setUploadOpen(true)}
              className="gap-2 bg-violet-600 hover:bg-violet-500"
            >
              <Plus className="h-4 w-4" />
              Upload Design
            </Button>
          </div>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {saves.map((save, i) => (
            <div key={save.id} className="mb-4 break-inside-avoid">
              <SaveCard save={save} index={i} />
            </div>
          ))}
        </div>
      )}

      <UploadZone
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onComplete={handleUploadComplete}
      />
    </AppShell>
  );
}
