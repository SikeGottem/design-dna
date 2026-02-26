"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { SaveCard, SaveCardSkeleton } from "@/components/save-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { Board, Save } from "@/lib/types";

export default function BoardDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: boardData } = await supabase.from("boards").select("*").eq("id", id).single();
      if (boardData) setBoard(boardData as Board);

      const { data: boardSaves } = await supabase
        .from("board_saves")
        .select("save_id, saves(*)")
        .eq("board_id", id)
        .order("position");

      if (boardSaves) {
        setSaves(boardSaves.map((bs: any) => bs.saves).filter(Boolean) as Save[]);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this board? Saves won't be deleted.")) return;
    const supabase = createClient();
    await supabase.from("boards").delete().eq("id", id);
    router.push("/boards");
  };

  return (
    <AppShell>
      <button
        onClick={() => router.push("/boards")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Boards
      </button>

      {board && (
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold">{board.name}</h1>
            {board.description && <p className="text-sm text-zinc-500">{board.description}</p>}
          </div>
          <Button variant="outline" size="sm" className="border-red-500/20 text-red-400 hover:bg-red-500/10" onClick={handleDelete}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      )}

      {loading ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid"><SaveCardSkeleton /></div>
          ))}
        </div>
      ) : saves.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="text-sm text-zinc-500">No saves in this board yet. Add saves from the library.</p>
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
    </AppShell>
  );
}
