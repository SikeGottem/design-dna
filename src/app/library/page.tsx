"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { SaveCard, SaveCardSkeleton } from "@/components/save-card";
import { UploadZone } from "@/components/upload-zone";
import { MobileFab } from "@/components/mobile-fab";
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

function LibraryContent() {
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DesignType>("all");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("upload") === "true" || searchParams.get("shared") === "true") {
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

  const handleFabFile = (file: File) => {
    setPendingFile(file);
    setUploadOpen(true);
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-4 md:mb-8">
        <h1 className="mb-1 text-xl font-bold md:text-2xl">Library</h1>
        <p className="text-xs text-zinc-500 md:text-sm">Your design inspiration collection</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 space-y-2 md:mb-6 md:space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search tags, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 border-white/10 bg-white/5 pl-10 text-sm md:h-9"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:flex-wrap md:px-0">
          {filterChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter(chip.value)}
              className={`min-h-[36px] shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors md:min-h-0 md:py-1 ${
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
        <div className="columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-3 xl:columns-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-3 break-inside-avoid md:mb-4">
              <SaveCardSkeleton />
            </div>
          ))}
        </div>
      ) : saves.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
          <div className="w-full max-w-sm rounded-xl border border-dashed border-white/10 p-8 text-center md:p-12">
            <Upload className="mx-auto mb-4 h-8 w-8 text-zinc-600 md:h-10 md:w-10" />
            <h3 className="mb-1 text-base font-semibold md:text-lg">Drop your first design</h3>
            <p className="mb-4 text-xs text-zinc-500 md:text-sm">
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
        <div className="columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-3 xl:columns-4">
          {saves.map((save, i) => (
            <div key={save.id} className="mb-3 break-inside-avoid md:mb-4">
              <SaveCard save={save} index={i} />
            </div>
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <MobileFab onFile={handleFabFile} />

      {/* Upload modal */}
      <UploadZone
        open={uploadOpen}
        onOpenChange={(v) => { setUploadOpen(v); if (!v) setPendingFile(null); }}
        onComplete={handleUploadComplete}
      />
    </AppShell>
  );
}

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryContent />
    </Suspense>
  );
}
