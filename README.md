# Design DNA

**Shazam for Design** — Screenshot any design, AI extracts colors, fonts, and mood. Build your personal design inspiration library.

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/SikeGottem/design-dna.git
cd design-dna
npm install
```

### 2. Environment Variables
```bash
cp .env.local.example .env.local
# Fill in your Supabase and OpenAI keys
```

### 3. Database Setup
Run the migration in `supabase/migrations/001_initial.sql` via:
- Supabase Dashboard → SQL Editor → paste & run
- Or `supabase db push` if using Supabase CLI

Also create a **Storage bucket** called `saves` (public) in Supabase Dashboard.

### 4. Run Dev Server
```bash
npm run dev
```

## Tech Stack
- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** + shadcn/ui
- **Supabase** (Auth, Postgres, Storage)
- **OpenAI GPT-4o** (Vision API for extraction)
- **Framer Motion** (animations)

## Features
- 🎨 AI color palette extraction
- 🔤 Font detection with confidence scores
- 🏷️ Mood & style tag generation
- 📚 Searchable design library
- 📋 Boards/collections
- 🖱️ Drag & drop, paste from clipboard
- 🌑 Dark mode default

## Architecture
```
src/
├── app/           — Pages & API routes
├── components/    — UI components
└── lib/           — Supabase, OpenAI, types
```
