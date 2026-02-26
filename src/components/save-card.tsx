"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Save } from "@/lib/types";
import Link from "next/link";
import { motion } from "framer-motion";

interface SaveCardProps {
  save: Save;
  index?: number;
}

export function SaveCard({ save, index = 0 }: SaveCardProps) {
  const colors = save.extraction_data?.colors?.slice(0, 5) ?? [];
  const moodTag = save.extraction_data?.mood_tags?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link href={`/library/${save.id}`}>
        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#141416] transition-all active:scale-[0.98] hover:border-white/10 hover:shadow-lg hover:shadow-violet-500/5">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
            {save.image_url ? (
              <img
                src={save.image_url}
                alt={save.description || "Design"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <Skeleton className="h-full w-full" />
            )}

            {/* Status badge */}
            {save.extraction_status !== "complete" && (
              <div className="absolute right-2 top-2">
                <Badge variant="secondary" className="text-[10px]">
                  {save.extraction_status === "processing" ? "Extracting..." : save.extraction_status}
                </Badge>
              </div>
            )}

            {/* Mood tag */}
            {moodTag && save.extraction_status === "complete" && (
              <div className="absolute right-1.5 top-1.5">
                <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-sm">
                  {moodTag}
                </span>
              </div>
            )}

            {/* Color swatches */}
            {colors.length > 0 && (
              <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                {colors.map((c) => (
                  <div
                    key={c.hex}
                    className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm md:h-4 md:w-4"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-2.5 md:p-3">
            <p className="truncate text-[11px] text-zinc-400 md:text-xs">
              {save.description || save.original_filename || "Untitled"}
            </p>
            {save.design_type && (
              <p className="mt-0.5 text-[10px] capitalize text-zinc-600">{save.design_type}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function SaveCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#141416]">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-2.5 md:p-3">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="mt-1.5 h-2.5 w-1/3" />
      </div>
    </div>
  );
}
