"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { ColorPalette } from "@/components/color-palette";
import { TagBadge } from "@/components/tag-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FolderPlus, Trash2, Check } from "lucide-react";
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

  useEffect(() => {
    const fetchSave = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("saves").select("*").eq("id", id).single();
      if (data) {
        setSave(data as Save);
        setNotes(data.user_notes || "");
      }
      setLoading(false);
    };
    const fetchBoards = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("boards").select("*").order("created_at", { ascending: false });
      setBoards((data as Board[]) ?? []);
    };
    fetchSave();
    fetchBoards();
  }, [id]);

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
        <div className="flex gap-8">
          <Skeleton className="aspect-[4/3] flex-1 rounded-xl" />
          <div className="w-80 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
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
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Library
      </button>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1"
        >
          <div className="overflow-hidden rounded-xl border border-white/5">
            <img
              src={save.image_url}
              alt={save.description || "Design"}
              className="w-full"
            />
          </div>
        </motion.div>

        {/* Extraction data */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full space-y-6 lg:w-96"
        >
          {/* Type & Description */}
          <div>
            {save.design_type && (
              <TagBadge tag={save.design_type} variant="type" />
            )}
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {save.description || "No description"}
            </p>
          </div>

          <Separator className="bg-white/5" />

          {/* Colors */}
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
              <div className="space-y-3">
                {extraction.fonts.map((font) => (
                  <div key={font.name} className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-200">{font.name}</span>
                      <span className="text-xs text-zinc-500">{font.category}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                      <span>{font.weight}</span>
                      <span>{font.usage}</span>
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${font.confidence * 100}%` }}
                          />
                        </div>
                        <span>{Math.round(font.confidence * 100)}%</span>
                      </div>
                    </div>
                    {font.alternatives && font.alternatives.length > 0 && (
                      <div className="mt-1.5 text-xs text-zinc-600">
                        Alt: {font.alternatives.join(", ")}
                      </div>
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
                {extraction.mood_tags?.map((tag) => (
                  <TagBadge key={tag} tag={tag} variant="mood" />
                ))}
                {extraction.style_tags?.map((tag) => (
                  <TagBadge key={tag} tag={tag} variant="style" />
                ))}
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
            <Button size="sm" variant="outline" className="mt-2" onClick={handleSaveNotes}>
              <Check className="mr-1.5 h-3 w-3" />
              Save Notes
            </Button>
          </div>

          <Separator className="bg-white/5" />

          {/* Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-white/10"
                onClick={() => setShowBoards(!showBoards)}
              >
                <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
                Add to Board
              </Button>
              {showBoards && (
                <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-lg border border-white/10 bg-[#141416] p-1">
                  {boards.length === 0 ? (
                    <p className="p-2 text-xs text-zinc-500">No boards yet</p>
                  ) : (
                    boards.map((board) => (
                      <button
                        key={board.id}
                        onClick={() => handleAddToBoard(board.id)}
                        className="w-full rounded-md px-3 py-1.5 text-left text-sm text-zinc-300 hover:bg-white/5"
                      >
                        {board.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="border-red-500/20 text-red-400 hover:bg-red-500/10" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
