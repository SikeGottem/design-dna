"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = "/library";
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
      <div className="w-full max-w-sm px-6">
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-violet-500 to-teal-400" />
            <span className="text-lg font-semibold">Design DNA</span>
          </div>
          <h1 className="mb-2 text-2xl font-bold">{isSignUp ? "Create account" : "Welcome back"}</h1>
          <p className="text-sm text-zinc-500">
            {isSignUp ? "Sign up to start your design library" : "Sign in to access your design library"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-zinc-400">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-violet-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-zinc-400">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-violet-500/20"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {message && (
            <p className="text-sm text-emerald-400">{message}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-teal-500 py-5 text-sm font-medium hover:from-violet-500 hover:to-teal-400"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
          className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-300"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>

        <p className="mt-6 text-center text-xs text-zinc-600">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
