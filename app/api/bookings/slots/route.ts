// app/api/bookings/slots/route.ts
// GET /api/bookings/slots?date=YYYY-MM-DD
// Mengembalikan daftar slot jam yang masih tersedia

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Format tanggal tidak valid (YYYY-MM-DD)" }, { status: 400 });
    }

    // Jam operasional 08:00–16:30, slot tiap 30 menit
    const ALL_SLOTS: string[] = [];
    for (let h = 8; h < 17; h++) {
      ALL_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
      if (h < 16) ALL_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
    }

    // Slot yang sudah dipakai
    const booked = await db.query(
      `SELECT TO_CHAR(booking_datetime AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS slot
       FROM bookings
       WHERE DATE(booking_datetime AT TIME ZONE 'Asia/Jakarta') = $1
         AND status NOT IN ('ditolak', 'cancelled')`,
      [date]
    );

    const bookedSet = new Set(booked.rows.map((r: { slot: string }) => r.slot));
    const available = ALL_SLOTS.filter((s) => !bookedSet.has(s));

    return NextResponse.json({ date, available, booked: Array.from(bookedSet) });
  } catch (err) {
    console.error("[GET /api/bookings/slots]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}