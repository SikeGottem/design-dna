"use client";

import { useState, useRef } from "react";
import { Plus, Camera, ImageIcon, ClipboardPaste, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileFabProps {
  onFile: (file: File) => void;
}

export function MobileFab({ onFile }: MobileFabProps) {
  const [open, setOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      onFile(f);
      setOpen(false);
    }
    e.target.value = "";
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted-image.png", { type: imageType });
          onFile(file);
          setOpen(false);
          return;
        }
      }
    } catch {
      // Clipboard API not available or no image
    }
  };

  const actions = [
    {
      icon: Camera,
      label: "Camera",
      color: "bg-teal-500",
      onClick: () => cameraRef.current?.click(),
    },
    {
      icon: ImageIcon,
      label: "Photo Library",
      color: "bg-violet-500",
      onClick: () => galleryRef.current?.click(),
    },
    {
      icon: ClipboardPaste,
      label: "Paste",
      color: "bg-amber-500",
      onClick: handlePaste,
    },
  ];

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3 md:hidden">
        <AnimatePresence>
          {open &&
            actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                onClick={action.onClick}
                className="flex items-center gap-3"
              >
                <span className="rounded-full bg-[#1a1a1e] px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-lg">
                  {action.label}
                </span>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${action.color} shadow-lg`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
              </motion.button>
            ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(!open)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 shadow-xl shadow-violet-500/25"
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
            {open ? <X className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
