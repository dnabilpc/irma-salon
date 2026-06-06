// app/api/services/route.ts
// GET /api/services → semua layanan salon (public)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(
      `SELECT id, service_name, price, hour_duration, image_url
       FROM salon_services
       ORDER BY service_name`
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("[GET /api/services]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
