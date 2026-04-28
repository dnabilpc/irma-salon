// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET — Detail satu booking ───────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    const { id } = await params;
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const result = await db.query(
      `SELECT
         b.id,
         b.booking_datetime,
         b.status,
         b.user_id,
         u.name              AS customer_name,
         u.email,
         JSON_AGG(
           JSON_BUILD_OBJECT(
             'service_name',  ss.service_name,
             'price',         bd.price_at_booking,
             'duration',      bd.duration_at_booking
           )
         ) FILTER (WHERE ss.id IS NOT NULL) AS details,
         COALESCE(t.total_amount, 0)        AS total_amount,
         COALESCE(t.payment_method, 'cash') AS payment_method,
         t.midtrans_status,
         t.id AS transaction_id
       FROM bookings b
       JOIN "user" u ON b.user_id = u.id
       LEFT JOIN booking_details bd ON bd.booking_id = b.id
       LEFT JOIN salon_services ss  ON ss.id = bd.salon_service_id
       LEFT JOIN transactions t     ON t.booking_id = b.id
       WHERE b.id = $1
       GROUP BY b.id, b.booking_datetime, b.status, b.user_id,
                u.name, u.email,
                t.total_amount, t.payment_method, t.midtrans_status, t.id`,
      [bookingId]
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }

    const booking = result.rows[0];

    // Customer hanya boleh akses booking milik sendiri
    if (user.role !== "ADMIN" && booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (err) {
    console.error("[GET /api/bookings/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── PATCH — Update status (Admin only) ─────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body as { status: string };

    const VALID = ["PENDING", "DITERIMA", "DITOLAK", "CANCELLED"];
    if (!VALID.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const result = await db.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING id`,
      [status, bookingId]
    );
    if (!result.rows.length) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }

    revalidatePath("/admin/bookings");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/bookings/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE — Cancel booking (Customer sendiri) ──────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    const { id } = await params;
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const check = await db.query(
      `SELECT id, status, user_id FROM bookings WHERE id = $1`,
      [bookingId]
    );
    if (!check.rows.length) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }

    const booking = check.rows[0];

    // Customer hanya boleh cancel miliknya sendiri
    if (user.role !== "ADMIN" && booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Hanya PENDING yang bisa dibatalkan
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Hanya booking berstatus PENDING yang dapat dibatalkan" },
        { status: 409 }
      );
    }

    await db.query(
      `UPDATE bookings SET status = 'CANCELLED' WHERE id = $1`,
      [bookingId]
    );

    revalidatePath("/bookings");
    revalidatePath("/admin/bookings");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/bookings/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}