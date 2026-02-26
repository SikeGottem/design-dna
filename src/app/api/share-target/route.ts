import { NextResponse } from "next/server";

// Share target is handled by the service worker.
// This route exists as a fallback if the SW doesn't intercept.
export async function POST() {
  return NextResponse.redirect(new URL("/library?shared=true", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), 303);
}

export async function GET() {
  return NextResponse.redirect(new URL("/library", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), 303);
}
