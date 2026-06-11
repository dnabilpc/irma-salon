import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

export async function GET() {
  try {
    const response = await backendFetch("/api/admin/opening-time");
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[GET /api/admin/opening-time]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await backendFetch("/api/admin/opening-time", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[PATCH /api/admin/opening-time]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
