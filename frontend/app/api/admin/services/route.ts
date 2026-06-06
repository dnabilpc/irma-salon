// app/api/admin/services/route.ts
// GET  /api/admin/services → list semua layanan
// POST /api/admin/services → tambah layanan baru

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
      `SELECT id, service_name, price, hour_duration, image_url
       FROM salon_services
       ORDER BY service_name ASC`
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("[GET /api/admin/services]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { service_name, price, hour_duration, image_url } = body;

    if (!service_name || !price || !hour_duration) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO salon_services (service_name, price, hour_duration, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [service_name.trim(), price, hour_duration, image_url || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/services]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
