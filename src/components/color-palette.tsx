"use client";

import { toast } from "sonner";
import type { ExtractionColor } from "@/lib/types";

interface ColorPaletteProps {
  colors: ExtractionColor[];
}

export function ColorPalette({ colors }: ColorPaletteProps) {
  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast.success(`Copied ${hex}`);
  };

  return (
    <div className="space-y-2">
      {colors.map((color) => (
        <button
          key={color.hex}
          onClick={() => copyHex(color.hex)}
          className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5"
        >
          <div
            className="h-8 w-8 shrink-0 rounded-md border border-white/10"
            style={{ backgroundColor: color.hex }}
          />
          <div className="flex-1 text-left">
            <div className="text-sm text-zinc-300">{color.name}</div>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="font-mono">{color.hex}</span>
              <span className="capitalize">{color.role}</span>
              <span>{Math.round(color.prominence * 100)}%</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
