// app/api/admin/transactions/offline/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { backendFetch } from "@/lib/backendClient";
import type { AppUser } from "@/types";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = session.user as unknown as AppUser;
  if (user.role !== "admin") return null;
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
    }

    const body = await req.json();

    const response = await backendFetch("/api/admin/payments/offline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Gagal mencatat transaksi offline" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/transactions/offline]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
