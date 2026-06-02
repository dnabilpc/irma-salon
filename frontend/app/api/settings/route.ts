// app/api/settings/route.ts
// GET /api/settings → ambil settings publik (vto_limit_default, info salon)
// Tidak memerlukan auth — dipakai di halaman publik & virtual try-on

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Keys yang boleh diakses publik
const PUBLIC_KEYS = [
  "vto_limit_default",
  "vto_reset_interval_days",
  "salon_name",
  "salon_whatsapp",
  "salon_instagram",
  "salon_facebook",
  "salon_tiktok",
  "salon_email",
  "salon_address",
  "salon_maps_url",
  "salon_open_description",
];

export async function GET() {
  try {
    const result = await db.query(
      `SELECT key, value FROM settings WHERE key = ANY($1)`,
      [PUBLIC_KEYS]
    );

    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}