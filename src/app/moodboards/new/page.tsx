"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export default function NewMoodboardPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("moodboards")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        canvas_data: { items: [], width: 1920, height: 1080, background: "#0a0a0b" },
      })
      .select("id")
      .single();

    if (data) {
      router.push(`/moodboards/${data.id}`);
    } else {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-lg pt-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-teal-400/20 border border-white/5">
            <LayoutDashboard className="h-7 w-7 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold">New Moodboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Set the visual direction for your next project</p>
        </div>

        <div className="space-y-5 rounded-xl border border-white/5 bg-[#141416] p-6">
          <div>
            <Label className="text-xs text-zinc-500">Project Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bristlecone Rebrand, Coffee Shop Website"
              className="mt-1.5 border-white/10 bg-white/5"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-500">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the vibe? What are you exploring?"
              className="mt-1.5 border-white/10 bg-white/5"
              rows={3}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="w-full gap-2 bg-violet-600 hover:bg-violet-500"
          >
            {creating ? "Creating..." : "Open Canvas"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
