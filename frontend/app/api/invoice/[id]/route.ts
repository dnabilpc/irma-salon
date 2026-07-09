import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const transactionId = parseInt(id, 10);
  if (isNaN(transactionId)) {
    return NextResponse.json({ error: "ID Transaksi tidak valid" }, { status: 400 });
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as unknown as AppUser;

    // 1. Fetch transaction details
    const trxQuery = await db.query(
      `SELECT 
        t.id, 
        t.booking_id, 
        t.rental_id, 
        t.total_amount, 
        t.subtotal,
        t.payment_method,
        t.created_at,
        t.status,
        t.user_id,
        t.payment_proof_sent,
        u.name AS customer_name,
        u.phone_number AS customer_phone,
        u.email AS customer_email,
        b.booking_datetime,
        r.start_date,
        r.duration_days,
        oc.outfit_name
       FROM transactions t
       JOIN "user" u ON t.user_id = u.id
       LEFT JOIN bookings b ON t.booking_id = b.id
       LEFT JOIN rentals r ON t.rental_id = r.id
       LEFT JOIN outfit_catalogues oc ON r.outfit_catalogues_id = oc.id
       WHERE t.id = $1`,
      [transactionId]
    );

    if (trxQuery.rows.length === 0) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const transaction = trxQuery.rows[0];

    // Check authorization: admin or transaction owner only
    if (user.role !== "admin" && transaction.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: Akses ditolak" }, { status: 403 });
    }

    // 2. Fetch items details
    let items = [];
    if (transaction.booking_id) {
      const servicesRes = await db.query(
        `SELECT ss.service_name AS name, bd.price_at_booking::numeric AS price
         FROM booking_details bd
         JOIN salon_services ss ON bd.salon_service_id = ss.id
         WHERE bd.booking_id = $1`,
        [transaction.booking_id]
      );
      items = servicesRes.rows;
    } else if (transaction.rental_id) {
      items = [
        {
          name: `Sewa Baju: ${transaction.outfit_name} (${transaction.duration_days} hari)`,
          price: transaction.subtotal,
        },
      ];
    }

    return NextResponse.json({
      transaction,
      items,
    });
  } catch (err) {
    console.error(`[GET /api/invoice/${transactionId}]`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
