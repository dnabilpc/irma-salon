// app/api/rentals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET — Detail satu rental ────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    const { id } = await params;
    const rentalId = parseInt(id, 10);
    if (isNaN(rentalId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const result = await db.query(
      `SELECT
         r.id,
         r.user_id,
         u.name           AS customer_name,
         u.email          AS customer_email,
         r.outfit_catalogues_id,
         oc.outfit_name,
         oc.image_url     AS outfit_image,
         oc.size,
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
         t.total_amount,
         t.midtrans_status
       FROM rentals r
       JOIN "user" u          ON u.id  = r.user_id
       JOIN outfit_catalogues oc ON oc.id = r.outfit_catalogues_id
       JOIN outfit_categories cat ON cat.id = oc.outfit_category_id
       LEFT JOIN transactions t ON t.rental_id = r.id
       WHERE r.id = $1`,
      [rentalId]
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Data sewa tidak ditemukan" }, { status: 404 });
    }

    const rental = result.rows[0];

    // Customer hanya bisa lihat miliknya sendiri
    if (user.role !== "ADMIN" && rental.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(rental);
  } catch (err) {
    console.error("[GET /api/rentals/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── PATCH — Update status rental (Admin) ────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const rentalId = parseInt(id, 10);
    if (isNaN(rentalId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const body = await req.json();
    const { rental_status, deposit_refund } = body as {
      rental_status: string;
      deposit_refund?: number;
    };

    const VALID = ["pending", "ongoing", "only_deposit", "overdue", "done", "cancelled"];
    if (!VALID.includes(rental_status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    let query: string;
    let queryParams: (string | number)[];

    if (deposit_refund !== undefined) {
      query = `UPDATE rentals SET rental_status = $1, deposit_refund = $2 WHERE id = $3 RETURNING id`;
      queryParams = [rental_status, deposit_refund, rentalId];
    } else {
      query = `UPDATE rentals SET rental_status = $1 WHERE id = $2 RETURNING id`;
      queryParams = [rental_status, rentalId];
    }

    const result = await db.query(query, queryParams);
    if (!result.rows.length) {
      return NextResponse.json({ error: "Data sewa tidak ditemukan" }, { status: 404 });
    }

    revalidatePath("/admin/rentals");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/rentals/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE — Cancel rental (Customer, hanya jika pending) ───────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    const { id } = await params;
    const rentalId = parseInt(id, 10);

    const check = await db.query(
      `SELECT id, rental_status, user_id FROM rentals WHERE id = $1`,
      [rentalId]
    );
    if (!check.rows.length) {
      return NextResponse.json({ error: "Data sewa tidak ditemukan" }, { status: 404 });
    }

    const rental = check.rows[0];

    if (user.role !== "ADMIN" && rental.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (rental.rental_status !== "pending") {
      return NextResponse.json(
        { error: "Hanya sewa berstatus pending yang dapat dibatalkan" },
        { status: 409 }
      );
    }

    await db.query(
      `UPDATE rentals SET rental_status = 'cancelled' WHERE id = $1`,
      [rentalId]
    );

    revalidatePath("/sewa");
    revalidatePath("/admin/rentals");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/rentals/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}