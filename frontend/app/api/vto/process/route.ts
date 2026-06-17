// app/api/vto/process/route.ts
// Proxy VTO processing request to Express backend to prevent Mixed Content / CORS errors in browser
import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const personFile = formData.get("person");
    const clothesUrl = formData.get("clothesUrl") as string;
    const outfitName = (formData.get("outfitName") as string) ?? "";

    if (!personFile || !clothesUrl) {
      return NextResponse.json(
        { error: "Parameter tidak lengkap: person atau clothesUrl tidak ditemukan." },
        { status: 400 }
      );
    }

    // Fetch the clothing image server-side where CORS is bypassed
    const clothesResponse = await fetch(clothesUrl);
    if (!clothesResponse.ok) {
      return NextResponse.json(
        { error: `Gagal mengunduh gambar baju: ${clothesResponse.statusText}` },
        { status: 400 }
      );
    }
    const clothesBlob = await clothesResponse.blob();

    // Create a new FormData to send to the backend
    const backendFormData = new FormData();
    backendFormData.append("person", personFile as Blob, (personFile as File).name || "person.jpg");
    backendFormData.append("clothes", clothesBlob, "clothes.jpg");
    // Always include outfitName so multer populates req.body.outfitName in the backend
    backendFormData.append("outfitName", outfitName);


    const response = await backendFetch("/api/virtual-tryon", {
      method: "POST",
      body: backendFormData,
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
