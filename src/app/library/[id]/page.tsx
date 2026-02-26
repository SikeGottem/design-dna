"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { ColorPalette } from "@/components/color-palette";
import { TagBadge } from "@/components/tag-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FolderPlus, Trash2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { Save, Board } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SaveDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [save, setSave] = useState<Save | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [boards, setBoards] = useState<Board[]>([]);
  const [showBoards, setShowBoards] = useState(false);
  const [adjacentIds, setAdjacentIds] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });

  useEffect(() => {
    const fetchSave = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("saves").select("*").eq("id", id).single();
      if (data) {
        setSave(data as Save);
        setNotes(data.user_notes || "");
      }
      setLoading(false);

      // Get adjacent saves for swipe navigation
      const { data: allSaves } = await supabase
        .from("saves")
        .select("id")
        .order("created_at", { ascending: false });
      if (allSaves) {
        const idx = allSaves.findIndex((s: any) => s.id === id);
        setAdjacentIds({
          prev: idx > 0 ? allSaves[idx - 1].id : null,
          next: idx < allSaves.length - 1 ? allSaves[idx + 1].id : null,
        });
      }
    };
    const fetchBoards = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("boards").select("*").order("created_at", { ascending: false });
      setBoards((data as Board[]) ?? []);
    };
    fetchSave();
    fetchBoards();
  }, [id]);

  // Swipe gesture support
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0 && adjacentIds.prev) router.push(`/library/${adjacentIds.prev}`);
        if (dx < 0 && adjacentIds.next) router.push(`/library/${adjacentIds.next}`);
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [adjacentIds, router]);

  const handleSaveNotes = async () => {
    const supabase = createClient();
    await supabase.from("saves").update({ user_notes: notes }).eq("id", id);
    toast.success("Notes saved");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this save?")) return;
    const supabase = createClient();
    await supabase.from("saves").delete().eq("id", id);
    router.push("/library");
  };

  const handleAddToBoard = async (boardId: string) => {
    const supabase = createClient();
    await supabase.from("board_saves").insert({ board_id: boardId, save_id: id as string });
    toast.success("Added to board");
    setShowBoards(false);
  };

  if (loading) {
    return (
      <AppShell>
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!save) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-zinc-500">Save not found</p>
        </div>
      </AppShell>
    );
  }

  const extraction = save.extraction_data;

  return (
    <AppShell>
      {/* Back + nav arrows */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-zinc-500 active:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden md:inline">Back to Library</span>
        </button>
        <div className="flex gap-2 md:hidden">
          <button
            disabled={!adjacentIds.prev}
            onClick={() => adjacentIds.prev && router.push(`/library/${adjacentIds.prev}`)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            disabled={!adjacentIds.next}
            onClick={() => adjacentIds.next && router.push(`/library/${adjacentIds.next}`)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile: stacked layout. Desktop: side by side */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full lg:flex-1"
        >
          <div className="overflow-hidden rounded-xl border border-white/5 bg-black">
            <img
              src={save.image_url}
              alt={save.description || "Design"}
              className="w-full"
            />
          </div>
          {/* Swipe hint on mobile */}
          <p className="mt-2 text-center text-[10px] text-zinc-600 md:hidden">Swipe to navigate between saves</p>
        </motion.div>

        {/* Extraction data */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full space-y-5 lg:w-96"
        >
          {/* Type & Description */}
          <div>
            {save.design_type && <TagBadge tag={save.design_type} variant="type" />}
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {save.description || "No description"}
            </p>
          </div>

          <Separator className="bg-white/5" />

          {/* Colors — horizontal scroll on mobile */}
          {extraction?.colors && extraction.colors.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Colors</h3>
              <ColorPalette colors={extraction.colors} />
            </div>
          )}

          <Separator className="bg-white/5" />

          {/* Fonts */}
          {extraction?.fonts && extraction.fonts.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Typography</h3>
              <div className="space-y-2">
                {extraction.fonts.map((font) => (
                  <div key={font.name} className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-200">{font.name}</span>
                      <span className="text-xs text-zinc-500">{font.category}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-500">
                      <span>{font.weight}</span>
                      <span>{font.usage}</span>
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-violet-500" style={{ width: `${font.confidence * 100}%` }} />
                        </div>
                        <span>{Math.round(font.confidence * 100)}%</span>
                      </div>
                    </div>
                    {font.alternatives && font.alternatives.length > 0 && (
                      <div className="mt-1.5 text-xs text-zinc-600">Alt: {font.alternatives.join(", ")}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="bg-white/5" />

          {/* Tags */}
          {extraction && (
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Mood & Style</h3>
              <div className="flex flex-wrap gap-1.5">
                {extraction.mood_tags?.map((tag) => <TagBadge key={tag} tag={tag} variant="mood" />)}
                {extraction.style_tags?.map((tag) => <TagBadge key={tag} tag={tag} variant="style" />)}
              </div>
            </div>
          )}

          <Separator className="bg-white/5" />

          {/* Notes */}
          <div>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this design..."
              className="min-h-[80px] border-white/10 bg-white/5 text-sm"
            />
            <Button size="sm" variant="outline" className="mt-2 min-h-[44px]" onClick={handleSaveNotes}>
              <Check className="mr-1.5 h-3 w-3" /> Save Notes
            </Button>
          </div>

          <Separator className="bg-white/5" />

          {/* Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full min-h-[44px] border-white/10"
                onClick={() => setShowBoards(!showBoards)}
              >
                <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
                Add to Board
              </Button>
              {showBoards && (
                <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-white/10 bg-[#141416] p-1 shadow-xl">
                  {boards.length === 0 ? (
                    <p className="p-3 text-xs text-zinc-500">No boards yet</p>
                  ) : (
                    boards.map((board) => (
                      <button
                        key={board.id}
                        onClick={() => handleAddToBoard(board.id)}
                        className="w-full min-h-[44px] rounded-md px-3 py-2 text-left text-sm text-zinc-300 active:bg-white/10 hover:bg-white/5"
                      >
                        {board.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] min-w-[44px] border-red-500/20 text-red-400 active:bg-red-500/10 hover:bg-red-500/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
