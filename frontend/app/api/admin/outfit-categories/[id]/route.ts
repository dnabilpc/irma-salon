// app/api/admin/outfit-categories/[id]/route.ts
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

// ── PUT — Update kategori ───────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const catId = parseInt(id, 10);
    if (isNaN(catId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const body = await req.json();
    const { category_name, description } = body;

    if (!category_name?.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }
    if (category_name.trim().length > 50) {
      return NextResponse.json({ error: "Nama kategori tidak boleh lebih dari 50 karakter" }, { status: 400 });
    }
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!nameRegex.test(category_name.trim())) {
      return NextResponse.json({ error: "Nama kategori hanya boleh mengandung huruf, angka, spasi, tanda hubung (-), atau garis bawah (_)" }, { status: 400 });
    }
    if (description && description.length > 255) {
      return NextResponse.json({ error: "Deskripsi tidak boleh lebih dari 255 karakter" }, { status: 400 });
    }

    // Check for duplicate category_name (excluding current catId)
    const dupCheck = await db.query(
      `SELECT id FROM outfit_categories WHERE LOWER(category_name) = LOWER($1) AND id != $2`,
      [category_name.trim(), catId]
    );
    if (dupCheck.rows.length > 0) {
      return NextResponse.json({ error: "Kategori baju dengan nama tersebut sudah ada" }, { status: 400 });
    }

    const result = await db.query(
      `UPDATE outfit_categories
       SET category_name = $1, description = $2
       WHERE id = $3
       RETURNING *`,
      [category_name.trim(), description || null, catId]
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    revalidatePath("/admin/clothes-catalogue");
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("[PUT /api/admin/outfit-categories/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE — Hapus kategori ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const catId = parseInt(id, 10);
    if (isNaN(catId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    // Cek apakah kategori masih memiliki baju
    const inUse = await db.query(
      `SELECT COUNT(*) FROM outfit_catalogues WHERE outfit_category_id = $1`,
      [catId]
    );
    if (parseInt(inUse.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "Kategori tidak dapat dihapus karena masih memiliki baju terdaftar." },
        { status: 409 }
      );
    }

    await db.query(`DELETE FROM outfit_categories WHERE id = $1`, [catId]);

    revalidatePath("/admin/clothes-catalogue");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/outfit-categories/:id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
