// app/api/admin/outfits/[id]/route.ts
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
  if (user.role !== "ADMIN") return null;
  return user;
}

// ── PUT — Update baju ───────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const outfitId = parseInt(id, 10);
    if (isNaN(outfitId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const body = await req.json();
    const { outfit_category_id, outfit_name, description, price, size, image_url, model_3d_file_link } = body;

    if (!outfit_category_id || !outfit_name || !price) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const result = await db.query(
      `UPDATE outfit_catalogues
       SET outfit_category_id = $1,
           outfit_name        = $2,
           description        = $3,
           price              = $4,
           size               = $5,
           image_url          = $6,
           model_3d_file_link = $7
       WHERE id = $8
       RETURNING *`,
      [
        outfit_category_id,
        outfit_name.trim(),
        description || null,
        price,
        size || null,
        image_url || null,
        model_3d_file_link || null,
        outfitId,
      ]
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Baju tidak ditemukan" }, { status: 404 });
    }

    revalidatePath("/admin/clothes-catalogue");
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("[PUT /api/admin/outfits/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE — Hapus baju ─────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const outfitId = parseInt(id, 10);
    if (isNaN(outfitId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    // Cek apakah baju sedang/pernah disewa
    const inUse = await db.query(
      `SELECT COUNT(*) FROM rentals WHERE outfit_catalogues_id = $1`,
      [outfitId]
    );
    if (parseInt(inUse.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "Baju tidak dapat dihapus karena sudah memiliki riwayat sewa." },
        { status: 409 }
      );
    }

    await db.query(`DELETE FROM outfit_catalogues WHERE id = $1`, [outfitId]);

    revalidatePath("/admin/clothes-catalogue");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/outfits/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}