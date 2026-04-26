// app/api/bookings/route.ts
// REST API endpoint untuk operasi booking
// GET  /api/bookings  → list booking (admin)
// POST /api/bookings  → buat booking baru (customer)

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

// ── GET — List booking ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as unknown as AppUser;
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") ?? "all";
    const search = searchParams.get("search") ?? "";
    const page   = parseInt(searchParams.get("page")  ?? "1", 10);
    const limit  = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Admin bisa lihat semua; customer hanya punyanya sendiri
    if (user.role !== "ADMIN") {
      params.push(user.id);
      conditions.push(`b.user_id = $${params.length}`);
    }
    if (status !== "all") {
      params.push(status);
      conditions.push(`b.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`u.full_name ILIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await db.query(
      `SELECT COUNT(DISTINCT b.id) FROM bookings b JOIN users u ON b.user_id = u.id ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await db.query(
      `SELECT
         b.id,
         u.full_name          AS customer_name,
         u.phone_number,
         b.booking_datetime,
         b.status,
         STRING_AGG(ss.service_name, ', ' ORDER BY ss.service_name) AS services,
         COALESCE(t.total_amount, 0)  AS total_amount,
         COALESCE(t.payment_method, 'cash') AS payment_method,
         t.id                 AS transaction_id
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN booking_details bd ON bd.booking_id = b.id
       LEFT JOIN salon_services ss  ON ss.id = bd.salon_service_id
       LEFT JOIN transactions t     ON t.booking_id = b.id
       ${where}
       GROUP BY b.id, u.full_name, u.phone_number, b.booking_datetime, b.status,
                t.total_amount, t.payment_method, t.id
       ORDER BY b.booking_datetime DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({ rows: result.rows, total, page, limit });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── POST — Buat booking baru ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as unknown as AppUser;

    const body = await req.json();
    const { booking_datetime, service_ids } = body as {
      booking_datetime: string;
      service_ids: number[];
    };

    if (!booking_datetime || !Array.isArray(service_ids) || service_ids.length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Validasi tanggal
    if (new Date(booking_datetime) < new Date()) {
      return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
    }

    // Cek konflik jadwal
    const conflict = await db.query(
      `SELECT id FROM bookings
       WHERE status NOT IN ('ditolak','cancelled')
         AND booking_datetime BETWEEN $1::timestamptz - INTERVAL '30 minutes'
                                  AND $1::timestamptz + INTERVAL '30 minutes'`,
      [booking_datetime]
    );
    if (conflict.rows.length > 0) {
      return NextResponse.json({ error: "Slot waktu sudah terisi" }, { status: 409 });
    }

    // Ambil layanan
    const services = await db.query(
      `SELECT id, price, hour_duration FROM salon_services WHERE id = ANY($1)`,
      [service_ids]
    );
    if (services.rows.length !== service_ids.length) {
      return NextResponse.json({ error: "Layanan tidak valid" }, { status: 400 });
    }

    const subtotal = services.rows.reduce(
      (s: number, r: { price: string }) => s + parseFloat(r.price),
      0
    );

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const bookingRes = await client.query(
        `INSERT INTO bookings (user_id, booking_datetime, status)
         VALUES ($1, $2, 'pending') RETURNING id`,
        [user.id, booking_datetime]
      );
      const bookingId: number = bookingRes.rows[0].id;

      for (const svc of services.rows) {
        await client.query(
          `INSERT INTO booking_details (booking_id, salon_service_id, price_at_booking, duration_at_booking)
           VALUES ($1, $2, $3, $4)`,
          [bookingId, svc.id, svc.price, svc.hour_duration]
        );
      }

      await client.query(
        `INSERT INTO transactions (user_id, booking_id, subtotal, total_amount, payment_method)
         VALUES ($1, $2, $3, $3, 'cash')`,
        [user.id, bookingId, subtotal]
      );

      await client.query("COMMIT");
      return NextResponse.json({ bookingId }, { status: 201 });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}