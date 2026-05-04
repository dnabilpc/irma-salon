// app/api/rentals/route.ts
// GET  /api/rentals  → list sewa (admin semua, customer miliknya)
// POST /api/rentals  → buat sewa baru (customer)

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "ALL";
    const page   = parseInt(searchParams.get("page")  ?? "1", 10);
    const limit  = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (user.role !== "ADMIN") {
      params.push(user.id);
      conditions.push(`r.user_id = $${params.length}`);
    }
    if (status !== "ALL") {
      params.push(status);
      conditions.push(`r.rental_status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await db.query(
      `SELECT COUNT(*) FROM rentals r ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await db.query(
      `SELECT
         r.id,
         r.user_id,
         u.name           AS customer_name,
         u.email          AS customer_email,
         r.outfit_catalogues_id,
         oc.outfit_name,
         oc.image_url     AS outfit_image,
         cat.category_name,
         r.start_date,
         r.duration_days,
         (r.start_date + r.duration_days * INTERVAL '1 day')::date AS end_date,
         r.amount_to_be_paid,
         r.deposit_paid,
         r.deposit_refund,
         r.rental_status,
         t.id             AS transaction_id,
         t.payment_method,
         t.total_amount
       FROM rentals r
       JOIN "user" u          ON u.id  = r.user_id
       JOIN outfit_catalogues oc ON oc.id = r.outfit_catalogues_id
       JOIN outfit_categories cat ON cat.id = oc.outfit_category_id
       LEFT JOIN transactions t ON t.rental_id = r.id
       ${where}
       ORDER BY r.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({ rows: result.rows, total, page, limit });
  } catch (err) {
    console.error("[GET /api/rentals]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;

    const body = await req.json();
    const { outfit_catalogues_id, start_date, duration_days, deposit_paid } = body as {
      outfit_catalogues_id: number;
      start_date: string;
      duration_days: number;
      deposit_paid: number;
    };

    if (!outfit_catalogues_id || !start_date || !duration_days) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Validasi tanggal tidak boleh di masa lalu
    if (new Date(start_date) < new Date(new Date().toDateString())) {
      return NextResponse.json({ error: "Tanggal mulai tidak boleh di masa lalu" }, { status: 400 });
    }

    // Ambil data baju
    const outfitResult = await db.query(
      `SELECT id, outfit_name, price FROM outfit_catalogues WHERE id = $1`,
      [outfit_catalogues_id]
    );
    if (!outfitResult.rows.length) {
      return NextResponse.json({ error: "Baju tidak ditemukan" }, { status: 404 });
    }

    const outfit = outfitResult.rows[0];
    const pricePerDay = parseFloat(outfit.price);
    const amount_to_be_paid = pricePerDay * duration_days;
    const actualDeposit = deposit_paid ?? 0;

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // Insert rental
      const rentalResult = await client.query(
        `INSERT INTO rentals
           (user_id, outfit_catalogues_id, start_date, duration_days,
            amount_to_be_paid, deposit_paid, rental_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING id`,
        [user.id, outfit_catalogues_id, start_date, duration_days, amount_to_be_paid, actualDeposit]
      );
      const rentalId: number = rentalResult.rows[0].id;

      // Insert transaksi
      await client.query(
        `INSERT INTO transactions
           (user_id, rental_id, subtotal, total_amount, payment_method)
         VALUES ($1, $2, $3, $3, 'cash')`,
        [user.id, rentalId, amount_to_be_paid]
      );

      await client.query("COMMIT");
      return NextResponse.json({ rentalId }, { status: 201 });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[POST /api/rentals]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}