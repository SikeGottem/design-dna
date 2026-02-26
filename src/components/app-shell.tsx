"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Library, Plus, LogOut, FolderOpen, User } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";

const navItems = [
  { href: "/library", label: "Library", icon: Library },
  { href: "/boards", label: "Boards", icon: FolderOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SupaUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Desktop top nav */}
      <nav className="fixed top-0 z-50 hidden w-full border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl md:block">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/library" className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-teal-400" />
              <span className="text-sm font-semibold tracking-tight">Design DNA</span>
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 text-sm ${
                      pathname.startsWith(item.href)
                        ? "text-white bg-white/5"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/library?upload=true">
              <Button size="sm" className="gap-2 bg-violet-600 text-sm hover:bg-violet-500">
                <Plus className="h-3.5 w-3.5" />
                New Save
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-violet-600 text-xs">
                      {user?.email?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs text-zinc-500">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/5 bg-[#0a0a0b]/80 px-4 backdrop-blur-xl md:hidden" style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3rem + env(safe-area-inset-top))" }}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-500 to-teal-400" />
          <span className="text-sm font-semibold tracking-tight">Design DNA</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-violet-600 text-[10px]">
                  {user?.email?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-xs text-zinc-500">{user?.email}</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-3.5 w-3.5" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content — padded for mobile top bar + bottom nav */}
      <main
        className="mx-auto max-w-7xl px-4 pb-24 md:px-6 md:pb-12"
        style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="pt-4 md:pt-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 z-50 flex w-full items-center justify-around border-t border-white/5 bg-[#0a0a0b]/90 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", height: "calc(3.5rem + env(safe-area-inset-bottom))" }}
      >
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-4 ${
                active ? "text-violet-400" : "text-zinc-500"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/library?upload=true"
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-4 text-zinc-500"
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
