// app/api/admin/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = session.user as unknown as AppUser;
  if (user.role !== "admin") return null;
  return user;
}

// ── PUT — Update layanan ────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const serviceId = parseInt(id, 10);
    if (isNaN(serviceId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const body = await req.json();
    const { service_name, price, hour_duration, image_url, is_price_variable } = body;

    if (!service_name || !price || !hour_duration) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const result = await db.query(
      `UPDATE salon_services
       SET service_name = $1, price = $2, hour_duration = $3, image_url = $4, is_price_variable = $5
       WHERE id = $6
       RETURNING *`,
      [service_name.trim(), price, hour_duration, image_url || null, !!is_price_variable, serviceId]
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    revalidatePath("/admin/services-catalogue");
    revalidatePath("/booking");
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("[PUT /api/admin/services/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE — Hapus layanan ──────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const serviceId = parseInt(id, 10);
    if (isNaN(serviceId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    // Cek apakah layanan sedang dipakai di booking aktif
    const inUse = await db.query(
      `SELECT COUNT(*) FROM booking_details WHERE salon_service_id = $1`,
      [serviceId]
    );
    if (parseInt(inUse.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "Layanan tidak dapat dihapus karena sudah memiliki riwayat booking." },
        { status: 409 }
      );
    }

    await db.query(`DELETE FROM salon_services WHERE id = $1`, [serviceId]);

    revalidatePath("/admin/services-catalogue");
    revalidatePath("/booking");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/services/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
