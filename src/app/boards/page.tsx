"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, FolderOpen } from "lucide-react";
import type { Board } from "@/lib/types";
import Link from "next/link";
import { motion } from "framer-motion";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchBoards = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("boards")
      .select("*, board_saves(count)")
      .order("created_at", { ascending: false });
    setBoards((data as Board[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchBoards(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("boards").insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
    });

    setName("");
    setDescription("");
    setCreateOpen(false);
    fetchBoards();
  };

  return (
    <AppShell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Boards</h1>
          <p className="text-sm text-zinc-500">Organize saves into themed collections</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-500">
              <Plus className="h-3.5 w-3.5" />
              New Board
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-[#141416]">
            <DialogHeader>
              <DialogTitle>Create Board</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-zinc-500">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dark Mode Inspiration"
                  className="mt-1.5 border-white/10 bg-white/5"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this board for?"
                  className="mt-1.5 border-white/10 bg-white/5"
                />
              </div>
              <Button onClick={handleCreate} className="w-full bg-violet-600 hover:bg-violet-500">
                Create Board
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-white/5 bg-[#141416]" />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
            <FolderOpen className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
            <h3 className="mb-1 text-lg font-semibold">No boards yet</h3>
            <p className="mb-4 text-sm text-zinc-500">Create a board to organize your design saves</p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-500">
              <Plus className="h-4 w-4" />
              Create Board
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board, i) => (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/boards/${board.id}`}>
                <div className="group rounded-xl border border-white/5 bg-[#141416] p-5 transition-all hover:border-white/10">
                  <FolderOpen className="mb-3 h-5 w-5 text-violet-400" />
                  <h3 className="mb-1 font-semibold">{board.name}</h3>
                  {board.description && (
                    <p className="mb-2 text-xs text-zinc-500 line-clamp-2">{board.description}</p>
                  )}
                  <p className="text-xs text-zinc-600">
                    {(board as any).board_saves?.[0]?.count ?? 0} saves
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
