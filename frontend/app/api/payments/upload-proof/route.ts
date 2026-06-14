import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Proxy the request to the backend Express server
    const response = await backendFetch("/api/payments/upload-proof", {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[POST /api/payments/upload-proof]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
