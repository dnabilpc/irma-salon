// app/api/vto/usage/route.ts
// Delegating VTO usage check and increment to Express backend

import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

export async function GET() {
  try {
    const response = await backendFetch("/api/vto/status");
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Internal Server Error" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/vto/usage]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const response = await backendFetch("/api/vto/usage", {
      method: "POST",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Internal Server Error" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[POST /api/vto/usage]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
