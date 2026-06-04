// app/api/vto/process/route.ts
// Proxy VTO processing request to Express backend to prevent Mixed Content / CORS errors in browser
import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const response = await backendFetch("/api/virtual-tryon", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Gagal memproses virtual try-on." },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[POST /api/vto/process] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
