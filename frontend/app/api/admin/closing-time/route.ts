import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

export async function GET() {
  try {
    const response = await backendFetch("/api/admin/closing-time");
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[GET /api/admin/closing-time]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await backendFetch("/api/admin/closing-time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[POST /api/admin/closing-time]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
