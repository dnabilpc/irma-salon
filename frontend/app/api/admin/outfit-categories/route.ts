// app/api/admin/outfit-categories/route.ts
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

    const result = await db.query(
      `SELECT id, category_name, description,
              (SELECT COUNT(*) FROM outfit_catalogues WHERE outfit_category_id = outfit_categories.id) AS outfit_count
       FROM outfit_categories
       ORDER BY category_name ASC`
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("[GET /api/admin/outfit-categories]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { category_name, description } = body;

    if (!category_name) {
      return NextResponse.json({ error: "Nama kategori tidak boleh kosong" }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO outfit_categories (category_name, description)
       VALUES ($1, $2) RETURNING *`,
      [category_name.trim(), description || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/outfit-categories]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
