// app/api/outfits/route.ts
// GET /api/outfits → list semua baju untuk halaman publik (tidak perlu auth)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
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
        `SELECT id, category_name
         FROM outfit_categories
         ORDER BY category_name ASC`
      ),
    ]);

    return NextResponse.json({
      outfits: outfits.rows,
      categories: categories.rows,
    });
  } catch (err) {
    console.error("[GET /api/outfits]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
