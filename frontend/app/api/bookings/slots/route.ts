// app/api/bookings/slots/route.ts
// Delegating slots retrieval to Express backend

import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Format tanggal tidak valid (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const response = await backendFetch(`/api/bookings/slots?date=${encodeURIComponent(date)}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Internal Server Error" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/bookings/slots]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
