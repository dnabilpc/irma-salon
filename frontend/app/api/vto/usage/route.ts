// app/api/vto/usage/route.ts
// GET  /api/vto/usage → cek sisa limit VTO user yang sedang login
// POST /api/vto/usage → increment usage setelah VTO berhasil

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

async function getVtoLimit(): Promise<number> {
  const result = await db.query(
    `SELECT value FROM settings WHERE key = 'vto_limit_default'`
  );
  return result.rows.length ? parseInt(result.rows[0].value, 10) : 5;
}

async function getResetIntervalDays(): Promise<number> {
  const result = await db.query(
    `SELECT value FROM settings WHERE key = 'vto_reset_interval_days'`
  );
  return result.rows.length ? parseInt(result.rows[0].value, 10) : 14;
}

async function checkAndResetIfNeeded(userId: string, resetIntervalDays: number) {
  const userResult = await db.query(
    `SELECT vto_usage, vto_reset_at FROM "user" WHERE id = $1`,
    [userId]
  );

  if (!userResult.rows.length) return;

  const { vto_reset_at } = userResult.rows[0];
  const resetAt = new Date(vto_reset_at);
  const now = new Date();
  const diffDays = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays >= resetIntervalDays) {
    await db.query(
      `UPDATE "user" SET vto_usage = 0, vto_reset_at = NOW() WHERE id = $1`,
      [userId]
    );
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    const [limit, intervalDays] = await Promise.all([getVtoLimit(), getResetIntervalDays()]);

    await checkAndResetIfNeeded(user.id, intervalDays);

    const result = await db.query(
      `SELECT vto_usage, vto_reset_at FROM "user" WHERE id = $1`,
      [user.id]
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const { vto_usage, vto_reset_at } = result.rows[0];
    const remaining = Math.max(0, limit - (vto_usage ?? 0));

    // Hitung kapan reset berikutnya
    const resetAt = new Date(vto_reset_at);
    const nextReset = new Date(resetAt.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      usage: vto_usage ?? 0,
      limit,
      remaining,
      next_reset: nextReset.toISOString(),
      can_use: remaining > 0,
    });
  } catch (err) {
    console.error("[GET /api/vto/usage]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as unknown as AppUser;
    const [limit, intervalDays] = await Promise.all([getVtoLimit(), getResetIntervalDays()]);

    await checkAndResetIfNeeded(user.id, intervalDays);

    // Cek apakah masih bisa pakai
    const result = await db.query(
      `SELECT vto_usage FROM "user" WHERE id = $1`,
      [user.id]
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const currentUsage = result.rows[0].vto_usage ?? 0;
    if (currentUsage >= limit) {
      return NextResponse.json(
        { error: "Kuota Virtual Try-On habis", remaining: 0 },
        { status: 429 }
      );
    }

    // Increment usage
    const updated = await db.query(
      `UPDATE "user" SET vto_usage = vto_usage + 1 WHERE id = $1 RETURNING vto_usage`,
      [user.id]
    );

    const newUsage = updated.rows[0].vto_usage;
    const remaining = Math.max(0, limit - newUsage);

    return NextResponse.json({ success: true, usage: newUsage, limit, remaining });
  } catch (err) {
    console.error("[POST /api/vto/usage]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}