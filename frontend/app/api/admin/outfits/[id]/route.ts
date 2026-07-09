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
  if (user.role !== "admin") return null;
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
    const { outfit_category_id, outfit_name, description, price, size, image_url, additional_image_urls, model_2d_file_link, is_active } = body;

    if (!outfit_category_id || !outfit_name || !price) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    if (outfit_name.trim().length > 50) {
      return NextResponse.json({ error: "Nama baju tidak boleh lebih dari 50 karakter" }, { status: 400 });
    }
    if (description && description.length > 255) {
      return NextResponse.json({ error: "Deskripsi tidak boleh lebih dari 255 karakter" }, { status: 400 });
    }
    if (size && size.length > 10) {
      return NextResponse.json({ error: "Ukuran tidak boleh lebih dari 10 karakter" }, { status: 400 });
    }
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: "Harga harus berupa angka positif" }, { status: 400 });
    }
    if (image_url && image_url.length > 2048) {
      return NextResponse.json({ error: "Tautan gambar terlalu panjang" }, { status: 400 });
    }
    if (model_2d_file_link && model_2d_file_link.length > 2048) {
      return NextResponse.json({ error: "Tautan model VTO terlalu panjang" }, { status: 400 });
    }

    const result = await db.query(
      `UPDATE outfit_catalogues
       SET outfit_category_id = $1,
           outfit_name        = $2,
           description        = $3,
           price              = $4,
           size               = $5,
           image_url          = $6,
           additional_image_urls = $7,
           model_2d_file_link = $8,
           is_active          = COALESCE($9, is_active)
       WHERE id = $10
       RETURNING *`,
      [
        outfit_category_id,
        outfit_name.trim(),
        description || null,
        price,
        size || null,
        image_url || null,
        additional_image_urls || [],
        model_2d_file_link || null,
        is_active === undefined ? null : !!is_active,
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
      await db.query(`UPDATE outfit_catalogues SET is_active = false WHERE id = $1`, [outfitId]);
      revalidatePath("/admin/clothes-catalogue");
      return NextResponse.json({
        success: true,
        deactivated: true,
        message: "Baju dinonaktifkan karena sudah memiliki riwayat sewa."
      });
    }

    await db.query(`DELETE FROM outfit_catalogues WHERE id = $1`, [outfitId]);

    revalidatePath("/admin/clothes-catalogue");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/outfits/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
