// middleware.ts
// Proteksi route /admin/* menggunakan Better Auth session cookie
// PENTING: File ini berjalan di Edge Runtime — JANGAN import lib/auth.ts
// karena lib/auth.ts mengimport 'pg' yang tidak kompatibel dengan Edge Runtime

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute  = pathname === "/login" || pathname === "/register";

  // Cek session dari cookie — ringan, tidak perlu hit database
  const sessionCookie = getSessionCookie(req);

  // ── Proteksi /admin/* ───────────────────────────────────────────────────
  if (isAdminRoute && !sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Jika sudah login, jangan tampilkan /login atau /register ────────────
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/register",
  ],
};