"use client";

import { Button } from "@/components/ui/button";
import { Upload, Palette, Search, ArrowRight, Sparkles, Layers, Eye } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Upload,
    title: "Upload",
    description: "Drop a screenshot, paste from clipboard, or snap a photo",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Sparkles,
    title: "Extract",
    description: "AI analyzes colors, fonts, mood, and style in seconds",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    icon: Layers,
    title: "Library",
    description: "Search and organize your growing design inspiration library",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

const features = [
  {
    icon: Palette,
    title: "Color DNA",
    description: "Extract dominant palettes with roles — primary, accent, background. Click to copy any hex.",
  },
  {
    icon: Eye,
    title: "Font Detection",
    description: "AI identifies typefaces with confidence scores and suggests alternatives.",
  },
  {
    icon: Search,
    title: "Search by Vibe",
    description: 'Find designs by mood: "minimal", "warm", "brutalist". Search your library by feel.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-teal-400" />
            <span className="text-sm font-semibold tracking-tight">Design DNA</span>
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm text-zinc-400 hover:text-white">
              Sign in
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 pt-14">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-teal-500/15 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-400">
            <Sparkles className="h-3 w-3 text-violet-400" />
            AI-Powered Design Analysis
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
            <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
              Shazam for
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-teal-400 bg-clip-text text-transparent">
              Design
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-zinc-400 leading-relaxed">
            Screenshot any design. AI instantly extracts colors, fonts, and mood.
            Build a searchable library of everything that inspires you.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-violet-600 px-8 text-white hover:bg-violet-500">
                Try it free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="border-white/10 text-zinc-300 hover:bg-white/5">
                See how it works
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Demo preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 mt-16 w-full max-w-4xl"
        >
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#141416] p-1">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </div>
            <div className="relative aspect-[16/9] rounded-lg bg-[#0a0a0b] p-8">
              <div className="flex h-full items-center justify-center gap-8">
                {/* Mock extraction preview */}
                <div className="flex-1 rounded-lg border border-white/5 bg-gradient-to-br from-indigo-950/50 to-violet-950/50 p-6">
                  <div className="mb-4 h-32 rounded-md bg-gradient-to-br from-violet-600/30 to-teal-500/30" />
                  <div className="h-3 w-3/4 rounded bg-white/10" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-zinc-500">COLORS</div>
                    <div className="flex gap-2">
                      {["#6366f1", "#8b5cf6", "#14b8a6", "#0a0a0b", "#fafafa"].map((c) => (
                        <div key={c} className="h-8 w-8 rounded-md" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-zinc-500">FONTS</div>
                    <div className="text-sm text-zinc-300">Inter · Semi Bold</div>
                    <div className="text-xs text-zinc-500">Confidence: 92%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-zinc-500">MOOD</div>
                    <div className="flex flex-wrap gap-1.5">
                      {["minimal", "dark", "modern", "tech"].map((tag) => (
                        <span key={tag} className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative py-32">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Three steps. Zero effort.</h2>
            <p className="text-zinc-500">From screenshot to searchable library in seconds.</p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group rounded-xl border border-white/5 bg-[#141416] p-6 transition-colors hover:border-white/10"
              >
                <div className={`mb-4 inline-flex rounded-lg ${step.bg} p-2.5`}>
                  <step.icon className={`h-5 w-5 ${step.color}`} />
                </div>
                <div className="mb-1 text-sm font-medium text-zinc-400">Step {i + 1}</div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Design intelligence, automated</h2>
            <p className="text-zinc-500">Stop eyedroppering. Start building your taste library.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-[#141416] p-6"
              >
                <feature.icon className="mb-4 h-5 w-5 text-violet-400" />
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">Start your design library</h2>
          <p className="mb-8 text-zinc-500">Free to start. No credit card required.</p>
          <Link href="/login">
            <Button size="lg" className="bg-violet-600 px-8 text-white hover:bg-violet-500">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <div className="h-4 w-4 rounded bg-gradient-to-br from-violet-500 to-teal-400" />
            Design DNA
          </div>
          <div className="text-xs text-zinc-700">Built by Ethan Wu</div>
        </div>
      </footer>
    </div>
  );
}
