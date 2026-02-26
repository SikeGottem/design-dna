"use client";

import { toast } from "sonner";
import type { ExtractionColor } from "@/lib/types";

interface ColorPaletteProps {
  colors: ExtractionColor[];
}

export function ColorPalette({ colors }: ColorPaletteProps) {
  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast.success(`Copied ${hex}`, { duration: 1500 });
  };

  return (
    <div className="space-y-1.5">
      {colors.map((color) => (
        <button
          key={color.hex}
          onClick={() => copyHex(color.hex)}
          className="flex w-full min-h-[48px] items-center gap-3 rounded-lg p-2 transition-colors active:bg-white/10 hover:bg-white/5"
        >
          <div
            className="h-9 w-9 shrink-0 rounded-lg border border-white/10 shadow-sm"
            style={{ backgroundColor: color.hex }}
          />
          <div className="flex-1 text-left">
            <div className="text-sm text-zinc-300">{color.name}</div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-600">
              <span className="font-mono">{color.hex}</span>
              <span className="capitalize">{color.role}</span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-600">tap to copy</span>
        </button>
      ))}
    </div>
  );
}
