"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Moodboard, MoodboardItem, CanvasData, Save } from "@/lib/types";
import {
  Save as SaveIcon, Share2, Download, ArrowLeft, Plus, Type, Palette,
  ImageIcon, Search, X, ZoomIn, ZoomOut, Undo2, ChevronLeft, ChevronRight,
  Sparkles, Globe, GlobeLock, Trash2, RotateCw, Copy, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function MoodboardEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [moodboard, setMoodboard] = useState<Moodboard | null>(null);
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [background, setBackground] = useState("#0a0a0b");
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"library" | "properties">("library");
  const [librarySaves, setLibrarySaves] = useState<Save[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [dragState, setDragState] = useState<{ itemId: string; startX: number; startY: number; itemStartX: number; itemStartY: number } | null>(null);
  const [resizeState, setResizeState] = useState<{ itemId: string; startX: number; startY: number; startW: number; startH: number; corner: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Load moodboard
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("moodboards").select("*").eq("id", id).single();
      if (!data) { router.push("/moodboards"); return; }
      const mb = data as Moodboard;
      setMoodboard(mb);
      setItems(mb.canvas_data.items || []);
      setCanvasSize({ width: mb.canvas_data.width, height: mb.canvas_data.height });
      setBackground(mb.canvas_data.background);
      setName(mb.name);
      setIsPublic(mb.is_public);
    })();
  }, [id, router]);

  // Load library saves
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      let query = supabase.from("saves").select("*").eq("extraction_status", "complete").order("created_at", { ascending: false });
      if (librarySearch) query = query.or(`description.ilike.%${librarySearch}%,design_type.ilike.%${librarySearch}%`);
      const { data } = await query;
      setLibrarySaves((data as Save[]) ?? []);
    })();
  }, [librarySearch]);

  // Auto-save (debounced)
  const triggerAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const supabase = createClient();
      const canvas_data: CanvasData = { items, width: canvasSize.width, height: canvasSize.height, background };
      await supabase.from("moodboards").update({ canvas_data, name, is_public: isPublic, updated_at: new Date().toISOString() }).eq("id", id);
    }, 1500);
  }, [items, canvasSize, background, name, isPublic, id]);

  useEffect(() => { triggerAutoSave(); }, [items, name, isPublic, triggerAutoSave]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const canvas_data: CanvasData = { items, width: canvasSize.width, height: canvasSize.height, background };
    await supabase.from("moodboards").update({ canvas_data, name, is_public: isPublic, updated_at: new Date().toISOString() }).eq("id", id);
    setSaving(false);
  };

  const handleExport = async () => {
    const { default: html2canvas } = await import("html2canvas-pro");
    const el = canvasRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: background, scale: 2, useCORS: true });
    const link = document.createElement("a");
    link.download = `${name || "moodboard"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Add items
  const addImageFromSave = (save: Save) => {
    const newItem: MoodboardItem = {
      id: generateId(),
      type: "image",
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 300,
      height: 225,
      zIndex: items.length + 1,
      saveId: save.id,
      imageUrl: save.image_url,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const addTextNote = () => {
    const newItem: MoodboardItem = {
      id: generateId(),
      type: "text",
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      width: 200,
      height: 100,
      zIndex: items.length + 1,
      text: "Add your note...",
      fontSize: 14,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  const addColorSwatch = (color?: string) => {
    const newItem: MoodboardItem = {
      id: generateId(),
      type: "color",
      x: 150 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      width: 80,
      height: 80,
      zIndex: items.length + 1,
      color: color || "#6d28d9",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (itemId: string, updates: Partial<MoodboardItem>) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...updates } : it)));
  };

  const deleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    if (selectedId === itemId) setSelectedId(null);
  };

  const duplicateItem = (itemId: string) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    const dup = { ...item, id: generateId(), x: item.x + 20, y: item.y + 20, zIndex: items.length + 1 };
    setItems((prev) => [...prev, dup]);
    setSelectedId(dup.id);
  };

  const bringToFront = (itemId: string) => {
    const maxZ = Math.max(...items.map((it) => it.zIndex), 0);
    updateItem(itemId, { zIndex: maxZ + 1 });
  };

  const selectedItem = items.find((it) => it.id === selectedId);

  // Extracted palette from all images on board
  const allColors = items
    .filter((it) => it.type === "image" && it.saveId)
    .flatMap((it) => {
      const save = librarySaves.find((s) => s.id === it.saveId);
      return save?.extraction_data?.colors?.map((c) => c.hex) ?? [];
    })
    .filter((hex, i, arr) => arr.indexOf(hex) === i)
    .slice(0, 12);

  // Mood tags
  const allMoodTags = items
    .filter((it) => it.type === "image" && it.saveId)
    .flatMap((it) => {
      const save = librarySaves.find((s) => s.id === it.saveId);
      return save?.extraction_data?.mood_tags ?? [];
    })
    .filter((tag, i, arr) => arr.indexOf(tag) === i)
    .slice(0, 8);

  // Canvas mouse handlers for dragging items
  const handleCanvasMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setSelectedId(itemId);
    bringToFront(itemId);
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    setDragState({ itemId, startX: e.clientX, startY: e.clientY, itemStartX: item.x, itemStartY: item.y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, itemId: string, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    setResizeState({ itemId, startX: e.clientX, startY: e.clientY, startW: item.width, startH: item.height, corner });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState) {
        const dx = (e.clientX - dragState.startX) / zoom;
        const dy = (e.clientY - dragState.startY) / zoom;
        updateItem(dragState.itemId, { x: Math.round(dragState.itemStartX + dx), y: Math.round(dragState.itemStartY + dy) });
      }
      if (resizeState) {
        const dx = (e.clientX - resizeState.startX) / zoom;
        const dy = (e.clientY - resizeState.startY) / zoom;
        const newW = Math.max(40, resizeState.startW + dx);
        const newH = Math.max(40, resizeState.startH + dy);
        updateItem(resizeState.itemId, { width: Math.round(newW), height: Math.round(newH) });
      }
    };
    const handleMouseUp = () => {
      setDragState(null);
      setResizeState(null);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  // Zoom
  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => Math.min(2, Math.max(0.1, z - e.deltaY * 0.002)));
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  if (!moodboard) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0b] text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex h-12 items-center justify-between border-b border-white/5 bg-[#0d0d0e] px-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/moodboards">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent text-sm font-semibold outline-none border-none w-48 focus:ring-1 focus:ring-violet-500/50 rounded px-1"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom */}
          <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1">
            <button onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))} className="text-zinc-400 hover:text-white">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] text-zinc-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="text-zinc-400 hover:text-white">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPublic(!isPublic)}
            className={`gap-1.5 text-xs ${isPublic ? "text-teal-400" : "text-zinc-500"}`}
          >
            {isPublic ? <Globe className="h-3.5 w-3.5" /> : <GlobeLock className="h-3.5 w-3.5" />}
            {isPublic ? "Public" : "Private"}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5 text-xs text-zinc-400">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>

          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-xs">
            <SaveIcon className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex flex-col border-r border-white/5 bg-[#0d0d0e] overflow-hidden shrink-0"
            >
              {/* Sidebar tabs */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setSidebarTab("library")}
                  className={`flex-1 py-2 text-xs font-medium ${sidebarTab === "library" ? "text-violet-400 border-b border-violet-400" : "text-zinc-500"}`}
                >
                  Library
                </button>
                <button
                  onClick={() => setSidebarTab("properties")}
                  className={`flex-1 py-2 text-xs font-medium ${sidebarTab === "properties" ? "text-violet-400 border-b border-violet-400" : "text-zinc-500"}`}
                >
                  Properties
                </button>
              </div>

              {sidebarTab === "library" ? (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* Add buttons */}
                  <div className="flex gap-2">
                    <button onClick={addTextNote} className="flex-1 flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
                      <Type className="h-3.5 w-3.5" /> Text
                    </button>
                    <button onClick={() => addColorSwatch()} className="flex-1 flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
                      <Palette className="h-3.5 w-3.5" /> Color
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
                    <Input
                      placeholder="Search library..."
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      className="h-8 border-white/5 bg-white/5 pl-8 text-xs"
                    />
                  </div>

                  {/* Library images */}
                  <div className="grid grid-cols-2 gap-2">
                    {librarySaves.map((save) => (
                      <button
                        key={save.id}
                        onClick={() => addImageFromSave(save)}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-white/5 bg-zinc-900 hover:border-violet-500/50 transition-colors"
                      >
                        <img src={save.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Plus className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-3">
                  {selectedItem ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-zinc-600">Type</label>
                        <p className="text-xs text-zinc-300 capitalize mt-0.5">{selectedItem.type}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-zinc-600">X</label>
                          <Input type="number" value={selectedItem.x} onChange={(e) => updateItem(selectedItem.id, { x: +e.target.value })} className="h-7 text-xs border-white/5 bg-white/5 mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-zinc-600">Y</label>
                          <Input type="number" value={selectedItem.y} onChange={(e) => updateItem(selectedItem.id, { y: +e.target.value })} className="h-7 text-xs border-white/5 bg-white/5 mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-zinc-600">Width</label>
                          <Input type="number" value={selectedItem.width} onChange={(e) => updateItem(selectedItem.id, { width: +e.target.value })} className="h-7 text-xs border-white/5 bg-white/5 mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-zinc-600">Height</label>
                          <Input type="number" value={selectedItem.height} onChange={(e) => updateItem(selectedItem.id, { height: +e.target.value })} className="h-7 text-xs border-white/5 bg-white/5 mt-0.5" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-zinc-600">Rotation</label>
                        <Input type="number" value={selectedItem.rotation ?? 0} onChange={(e) => updateItem(selectedItem.id, { rotation: +e.target.value })} className="h-7 text-xs border-white/5 bg-white/5 mt-0.5" />
                      </div>
                      {selectedItem.type === "text" && (
                        <>
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-zinc-600">Text</label>
                            <textarea
                              value={selectedItem.text ?? ""}
                              onChange={(e) => updateItem(selectedItem.id, { text: e.target.value })}
                              className="mt-0.5 w-full rounded-md border border-white/5 bg-white/5 p-2 text-xs text-white outline-none resize-none h-20"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-zinc-600">Font Size</label>
                            <Input type="number" value={selectedItem.fontSize ?? 14} onChange={(e) => updateItem(selectedItem.id, { fontSize: +e.target.value })} className="h-7 text-xs border-white/5 bg-white/5 mt-0.5" />
                          </div>
                        </>
                      )}
                      {selectedItem.type === "color" && (
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-zinc-600">Color</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input type="color" value={selectedItem.color ?? "#6d28d9"} onChange={(e) => updateItem(selectedItem.id, { color: e.target.value })} className="h-7 w-7 rounded cursor-pointer border-none bg-transparent" />
                            <Input value={selectedItem.color ?? ""} onChange={(e) => updateItem(selectedItem.id, { color: e.target.value })} className="h-7 text-xs border-white/5 bg-white/5 flex-1" />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => duplicateItem(selectedItem.id)} className="flex-1 gap-1 text-xs text-zinc-400">
                          <Copy className="h-3 w-3" /> Duplicate
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteItem(selectedItem.id)} className="flex-1 gap-1 text-xs text-red-400 hover:text-red-300">
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Layers className="mb-2 h-6 w-6 text-zinc-700" />
                      <p className="text-xs text-zinc-600">Select an item to edit properties</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-r-lg bg-white/5 px-0.5 py-3 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          style={{ left: sidebarOpen ? 280 : 0 }}
        >
          {sidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        {/* Canvas Area */}
        <div
          className="flex-1 overflow-auto relative"
          style={{ background: "#080809" }}
          onClick={() => setSelectedId(null)}
        >
          <div className="flex items-center justify-center min-h-full min-w-full p-12">
            <div
              ref={canvasRef}
              className="relative shadow-2xl shadow-black/50 rounded-lg"
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
                background: background,
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
              onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
            >
              {/* Canvas items */}
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`absolute group cursor-move ${selectedId === item.id ? "ring-2 ring-violet-500 ring-offset-1 ring-offset-transparent" : "hover:ring-1 hover:ring-white/20"}`}
                  style={{
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    height: item.height,
                    zIndex: item.zIndex,
                    transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                  }}
                  onMouseDown={(e) => handleCanvasMouseDown(e, item.id)}
                >
                  {/* Content */}
                  {item.type === "image" && item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full rounded-md object-cover pointer-events-none"
                      draggable={false}
                    />
                  )}
                  {item.type === "text" && (
                    <div
                      className="h-full w-full rounded-md bg-white/5 backdrop-blur-sm border border-white/10 p-3 overflow-hidden"
                      style={{ fontSize: item.fontSize ?? 14 }}
                    >
                      {selectedId === item.id ? (
                        <textarea
                          value={item.text ?? ""}
                          onChange={(e) => updateItem(item.id, { text: e.target.value })}
                          className="h-full w-full bg-transparent text-white outline-none resize-none"
                          style={{ fontSize: item.fontSize ?? 14 }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <p className="text-white/80 whitespace-pre-wrap">{item.text}</p>
                      )}
                    </div>
                  )}
                  {item.type === "color" && (
                    <div className="h-full w-full rounded-lg shadow-lg" style={{ backgroundColor: item.color }}>
                      <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/40 px-2 py-1 text-center">
                        <span className="text-[10px] font-mono text-white/70">{item.color}</span>
                      </div>
                    </div>
                  )}

                  {/* Resize handle */}
                  {selectedId === item.id && (
                    <div
                      className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-violet-500 cursor-se-resize border-2 border-[#0a0a0b] hover:bg-violet-400"
                      onMouseDown={(e) => handleResizeMouseDown(e, item.id, "se")}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar — unified palette + mood tags */}
      {(allColors.length > 0 || allMoodTags.length > 0) && (
        <div className="flex items-center gap-4 border-t border-white/5 bg-[#0d0d0e] px-4 py-2 shrink-0">
          {allColors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600 mr-1">Palette</span>
              {allColors.map((hex) => (
                <button
                  key={hex}
                  onClick={() => addColorSwatch(hex)}
                  className="h-5 w-5 rounded-full border border-white/10 hover:scale-125 transition-transform"
                  style={{ backgroundColor: hex }}
                  title={`Add ${hex} swatch`}
                />
              ))}
            </div>
          )}
          {allMoodTags.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600 mr-1">Mood</span>
              {allMoodTags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
