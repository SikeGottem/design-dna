"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Camera, ImageIcon, ClipboardPaste, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setExtraction(null);
  };

  const processFile = useCallback(async (f: File) => {
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

      const { error: saveError } = await supabase.from("saves").insert({
        id: saveId,
        user_id: user.id,
        image_url: publicUrl,
        original_filename: f.name,
        extraction_status: "processing",
      });

      if (saveError) throw saveError;

      setStatus("extracting");

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

  // Clipboard paste listener
  useEffect(() => {
    if (!open) return;
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) processFile(f);
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [open, processFile]);

  // Check for shared image from PWA share target
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const cache = await caches.open("share-target");
        const response = await cache.match("/shared-image");
        if (response) {
          const blob = await response.blob();
          const file = new File([blob], "shared-image.png", { type: blob.type || "image/png" });
          processFile(file);
          await cache.delete("/shared-image");
        }
      } catch {}
    })();
  }, [open, processFile]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={() => { onOpenChange(false); reset(); }}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-2xl border-t border-white/10 bg-[#141416] md:rounded-2xl md:border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center py-2 md:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-lg font-semibold">
            {status === "idle" ? "Upload Design" : status === "done" ? "Extraction Complete" : "Processing..."}
          </h2>
          <button onClick={() => { onOpenChange(false); reset(); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
            <X className="h-4 w-4 text-zinc-400" />
          </button>
        </div>

        <div className="px-5 pb-5">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Mobile: prominent action buttons */}
                <div className="grid grid-cols-3 gap-3 md:hidden">
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl bg-teal-500/10 p-4 active:bg-teal-500/20"
                  >
                    <Camera className="h-6 w-6 text-teal-400" />
                    <span className="text-xs font-medium text-teal-300">Camera</span>
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl bg-violet-500/10 p-4 active:bg-violet-500/20"
                  >
                    <ImageIcon className="h-6 w-6 text-violet-400" />
                    <span className="text-xs font-medium text-violet-300">Photos</span>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const items = await navigator.clipboard.read();
                        for (const item of items) {
                          const t = item.types.find((t) => t.startsWith("image/"));
                          if (t) { const b = await item.getType(t); processFile(new File([b], "paste.png", { type: t })); return; }
                        }
                      } catch {}
                    }}
                    className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl bg-amber-500/10 p-4 active:bg-amber-500/20"
                  >
                    <ClipboardPaste className="h-6 w-6 text-amber-400" />
                    <span className="text-xs font-medium text-amber-300">Paste</span>
                  </button>
                </div>

                {/* Desktop: drag & drop zone */}
                <div
                  className={`mt-3 hidden min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors md:flex ${
                    isDragging ? "border-violet-500 bg-violet-500/5" : "border-white/10 hover:border-white/20"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) processFile(f);
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="mb-3 h-7 w-7 text-zinc-500" />
                  <p className="text-sm font-medium">Drop an image here, or click to browse</p>
                  <p className="mt-1 text-xs text-zinc-500">PNG, JPG, WEBP up to 10MB · ⌘V to paste</p>
                </div>

                {/* Hidden inputs */}
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />
              </motion.div>
            )}

            {(status === "uploading" || status === "extracting") && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {preview && (
                  <div className="overflow-hidden rounded-xl border border-white/5">
                    <img src={preview} alt="Preview" className="w-full max-h-[40vh] object-contain bg-black" />
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  <div>
                    <p className="text-sm font-medium">{status === "uploading" ? "Uploading..." : "Extracting design DNA..."}</p>
                    <p className="text-xs text-zinc-500">AI is analyzing colors, fonts & mood</p>
                  </div>
                </div>
              </motion.div>
            )}

            {status === "done" && extraction && (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {preview && (
                  <div className="overflow-hidden rounded-xl border border-white/5">
                    <img src={preview} alt="Preview" className="w-full max-h-[30vh] object-contain bg-black" />
                  </div>
                )}

                {/* Colors */}
                <div>
                  <div className="mb-2 text-xs font-medium uppercase text-zinc-500">Colors</div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {extraction.colors.map((c, i) => (
                      <motion.div
                        key={c.hex}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex shrink-0 flex-col items-center gap-1"
                      >
                        <div className="h-10 w-10 rounded-lg border border-white/10" style={{ backgroundColor: c.hex }} />
                        <span className="font-mono text-[9px] text-zinc-500">{c.hex}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Fonts */}
                <div>
                  <div className="mb-2 text-xs font-medium uppercase text-zinc-500">Fonts</div>
                  {extraction.fonts.map((f) => (
                    <div key={f.name} className="text-sm text-zinc-300">
                      {f.name} <span className="text-zinc-600">· {Math.round(f.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div>
                  <div className="mb-2 text-xs font-medium uppercase text-zinc-500">Mood</div>
                  <div className="flex flex-wrap gap-1.5">
                    {extraction.mood_tags.map((tag, i) => (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-violet-600 hover:bg-violet-500"
                  onClick={() => { onOpenChange(false); reset(); }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Done
                </Button>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-8">
                <X className="h-6 w-6 text-red-400" />
                <p className="text-sm font-medium">Something went wrong</p>
                <Button size="sm" variant="outline" onClick={reset}>Try again</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
