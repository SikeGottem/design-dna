"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { ExtractionData } from "@/lib/types";

interface UploadZoneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (saveId: string) => void;
}

export function UploadZone({ open, onOpenChange, onComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "extracting" | "done" | "error">("idle");
  const [extraction, setExtraction] = useState<ExtractionData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setExtraction(null);
  };

  const handleFile = useCallback(async (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10MB.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      alert("Unsupported format. Use PNG, JPG, or WEBP.");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("uploading");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const saveId = crypto.randomUUID();
      const ext = f.name.split(".").pop() || "png";
      const path = `${user.id}/${saveId}/original.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("saves")
        .upload(path, f, { contentType: f.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("saves").getPublicUrl(path);

      // Create save record
      const { error: saveError } = await supabase.from("saves").insert({
        id: saveId,
        user_id: user.id,
        image_url: publicUrl,
        original_filename: f.name,
        extraction_status: "processing",
      });

      if (saveError) throw saveError;

      setStatus("extracting");

      // Trigger extraction
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveId, imageUrl: publicUrl }),
      });

      if (!res.ok) throw new Error("Extraction failed");

      const data = await res.json();
      setExtraction(data.extraction);
      setStatus("done");
      onComplete?.(saveId);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }, [onComplete]);

  // Clipboard paste
  useEffect(() => {
    if (!open) return;
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) handleFile(f);
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [open, handleFile]);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl border-white/10 bg-[#141416]">
        <DialogHeader>
          <DialogTitle>Upload Design</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isDragging ? "border-violet-500 bg-violet-500/5" : "border-white/10 hover:border-white/20"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Upload className="mb-4 h-8 w-8 text-zinc-500" />
              <p className="mb-1 text-sm font-medium">Drop an image here, or click to browse</p>
              <p className="text-xs text-zinc-500">PNG, JPG, WEBP up to 10MB · Or paste from clipboard (⌘V)</p>
            </motion.div>
          )}

          {(status === "uploading" || status === "extracting") && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[300px] flex-col items-center justify-center gap-6 md:flex-row"
            >
              {preview && (
                <div className="w-full md:w-1/2">
                  <img src={preview} alt="Preview" className="rounded-lg border border-white/10" />
                </div>
              )}
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                <p className="text-sm font-medium">
                  {status === "uploading" ? "Uploading..." : "Extracting design DNA..."}
                </p>
                <p className="text-xs text-zinc-500">AI is analyzing colors, fonts, and mood</p>
              </div>
            </motion.div>
          )}

          {status === "done" && extraction && (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-[300px] flex-col gap-6 md:flex-row"
            >
              {preview && (
                <div className="w-full md:w-1/2">
                  <img src={preview} alt="Preview" className="rounded-lg border border-white/10" />
                </div>
              )}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="mb-1.5 text-xs font-medium uppercase text-zinc-500">Colors</div>
                  <div className="flex gap-2">
                    {extraction.colors.map((c, i) => (
                      <motion.div
                        key={c.hex}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="h-8 w-8 rounded-md border border-white/10"
                        style={{ backgroundColor: c.hex }}
                        title={`${c.name} (${c.hex})`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-xs font-medium uppercase text-zinc-500">Fonts</div>
                  {extraction.fonts.map((f) => (
                    <div key={f.name} className="text-sm text-zinc-300">
                      {f.name} · <span className="text-zinc-500">{Math.round(f.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mb-1.5 text-xs font-medium uppercase text-zinc-500">Mood</div>
                  <div className="flex flex-wrap gap-1.5">
                    {extraction.mood_tags.map((tag, i) => (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-300"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="mt-2 bg-violet-600 hover:bg-violet-500"
                  onClick={() => { onOpenChange(false); reset(); }}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-[200px] flex-col items-center justify-center gap-3"
            >
              <X className="h-6 w-6 text-red-400" />
              <p className="text-sm font-medium">Something went wrong</p>
              <Button size="sm" variant="outline" onClick={reset}>Try again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
