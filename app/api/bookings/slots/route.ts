// app/api/bookings/slots/route.ts
// GET /api/bookings/slots?date=YYYY-MM-DD
// Mengembalikan slot jam yang tersedia pada tanggal tertentu
// Mempertimbangkan opening_time dan closing_time dari DB

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Format tanggal tidak valid (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Nama hari sesuai enum day_of_week di DB
    const DAY_NAMES = [
      "SUNDAY","MONDAY","TUESDAY","WEDNESDAY",
      "THURSDAY","FRIDAY","SATURDAY",
    ];
    const dayOfWeek = DAY_NAMES[new Date(date).getDay()];

    // Cek jam buka salon untuk hari ini
    const openCheck = await db.query(
      `SELECT open_time, close_time FROM opening_time WHERE day_of_week = $1`,
      [dayOfWeek]
    );

    // Cek apakah ada hari tutup (closing_time) yang mencakup tanggal ini
    const closingCheck = await db.query(
      `SELECT id FROM closing_time
       WHERE start_date <= $1::date AND end_date >= $1::date`,
      [date]
    );

    // Salon tutup → kembalikan array kosong
    if (!openCheck.rows.length || closingCheck.rows.length > 0) {
      return NextResponse.json({
        date,
        available: [],
        booked: [],
        closed: true,
        message: closingCheck.rows.length > 0
          ? "Salon tutup pada tanggal ini"
          : "Salon tidak beroperasi pada hari ini",
      });
    }

    // Generate semua slot dari jam buka sampai tutup, interval 30 menit
    const openTime: string  = openCheck.rows[0].open_time;   // e.g. "08:00:00"
    const closeTime: string = openCheck.rows[0].close_time;  // e.g. "16:00:00"

    const [openH, openM]   = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);

    const ALL_SLOTS: string[] = [];
    let h = openH, m = openM;

    while (h < closeH || (h === closeH && m < closeM)) {
      ALL_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += 30;
      if (m >= 60) { m -= 60; h++; }
    }

    // Ambil slot yang sudah terpakai
    const booked = await db.query(
      `SELECT TO_CHAR(booking_datetime AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS slot
       FROM bookings
       WHERE DATE(booking_datetime AT TIME ZONE 'Asia/Jakarta') = $1
         AND status NOT IN ('DITOLAK', 'CANCELLED')`,
      [date]
    );

    const bookedSet = new Set(booked.rows.map((r: { slot: string }) => r.slot));
    const available = ALL_SLOTS.filter((s) => !bookedSet.has(s));

    return NextResponse.json({
      date,
      available,
      booked: Array.from(bookedSet),
      closed: false,
      open_time: openTime,
      close_time: closeTime,
    });
  } catch (err) {
    console.error("[GET /api/bookings/slots]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}