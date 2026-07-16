// app/api/admin/settings/route.ts
// GET  /api/admin/settings → ambil semua settings
// PATCH /api/admin/settings → update satu atau banyak key sekaligus

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

    const result = await db.query(`SELECT key, value FROM settings ORDER BY key`);

    // Konversi array rows ke object { key: value }
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error("[GET /api/admin/settings]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as Record<string, string>;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Body harus berupa object { key: value }" }, { status: 400 });
    }

    // Validate VTO settings if present in request body
    if (body.vto_limit_default !== undefined) {
      if (!/^\d+$/.test(body.vto_limit_default)) {
        return NextResponse.json({ error: "Batas VTO per User harus berupa angka bulat positif" }, { status: 400 });
      }
      const val = parseInt(body.vto_limit_default, 10);
      if (val < 1 || val > 10000) {
        return NextResponse.json({ error: "Batas VTO per User harus bernilai antara 1 dan 10000" }, { status: 400 });
      }
    }

    if (body.vto_reset_interval_days !== undefined) {
      if (!/^\d+$/.test(body.vto_reset_interval_days)) {
        return NextResponse.json({ error: "Periode Reset Kuota VTO harus berupa angka bulat positif" }, { status: 400 });
      }
      const val = parseInt(body.vto_reset_interval_days, 10);
      if (val < 1 || val > 30) {
        return NextResponse.json({ error: "Periode Reset Kuota VTO harus bernilai antara 1 dan 30" }, { status: 400 });
      }
    }

    if (body.vto_bonus_expiry_days !== undefined) {
      if (!/^\d+$/.test(body.vto_bonus_expiry_days)) {
        return NextResponse.json({ error: "Durasi reset inaktif bonus VTO harus berupa angka non-negatif" }, { status: 400 });
      }
      const val = parseInt(body.vto_bonus_expiry_days, 10);
      if (val < 0 || val > 365) {
        return NextResponse.json({ error: "Durasi reset inaktif bonus VTO harus bernilai antara 0 dan 365 hari" }, { status: 400 });
      }
    }

    if (body.vto_milestones_config !== undefined) {
      try {
        const parsed = JSON.parse(body.vto_milestones_config);
        if (!Array.isArray(parsed)) {
          return NextResponse.json({ error: "Konfigurasi Milestone Bonus VTO harus berupa array" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Format Konfigurasi Milestone Bonus VTO tidak valid" }, { status: 400 });
      }
    }

    const entries = Object.entries(body);
    if (entries.length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang dikirim" }, { status: 400 });
    }

    // Upsert semua key sekaligus
    for (const [key, value] of entries) {
      await db.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, String(value)]
      );
    }

    return NextResponse.json({ success: true, updated: entries.length });
  } catch (err) {
    console.error("[PATCH /api/admin/settings]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
