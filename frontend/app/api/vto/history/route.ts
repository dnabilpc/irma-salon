// app/api/vto/history/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { backendFetch } from "@/lib/backendClient";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await backendFetch("/api/vto/tasks");
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Gagal mengambil riwayat Virtual Try-On." },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/vto/history]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
