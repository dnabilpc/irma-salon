// app/api/admin/outfits/route.ts
// GET  /api/admin/outfits → list semua katalog baju + kategori
// POST /api/admin/outfits → tambah baju baru

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = session.user as unknown as AppUser;
  if (user.role !== "admin") return null;
  return user;
}

export async function GET() {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [outfits, categories] = await Promise.all([
      db.query(
        `SELECT oc.id, oc.outfit_name, oc.description, oc.price, oc.size,
                oc.image_url, oc.additional_image_urls, oc.model_2d_file_link,
                oc.outfit_category_id,
                cat.category_name
         FROM outfit_catalogues oc
         JOIN outfit_categories cat ON cat.id = oc.outfit_category_id
         ORDER BY cat.category_name, oc.outfit_name ASC`
      ),
      db.query(
        `SELECT id, category_name, description
         FROM outfit_categories
         ORDER BY category_name ASC`
      ),
    ]);

    return NextResponse.json({
      outfits: outfits.rows,
      categories: categories.rows,
    });
  } catch (err) {
    console.error("[GET /api/admin/outfits]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { outfit_category_id, outfit_name, description, price, size, image_url, additional_image_urls, model_2d_file_link } = body;

    if (!outfit_category_id || !outfit_name || !price) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO outfit_catalogues
         (outfit_category_id, outfit_name, description, price, size, image_url, additional_image_urls, model_2d_file_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/outfits]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
