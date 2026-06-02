"use server";

// actions/vto.ts
// Server actions untuk Virtual Try-On

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";

export interface VtoStatus {
  usage: number;
  limit: number;
  remaining: number;
  next_reset: string;
  can_use: boolean;
}

// Reset VTO usage untuk user tertentu (dipanggil saat transaksi sewa selesai)
export async function resetVtoUsageForUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db.query(
      `UPDATE "user" SET vto_usage = 0, vto_reset_at = NOW() WHERE id = $1 RETURNING id`,
      [userId]
    );

    if (!result.rows.length) {
      return { success: false, error: "User tidak ditemukan." };
    }

    return { success: true };
  } catch (err) {
    console.error("[resetVtoUsageForUser]", err);
    return { success: false, error: "Gagal reset VTO usage." };
  }
}

// Ambil status VTO user yang sedang login
export async function getMyVtoStatus(): Promise<{ success: boolean; data?: VtoStatus; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Silakan login." };

    const user = session.user as unknown as AppUser;

    // Ambil settings
    const settingsResult = await db.query(
      `SELECT key, value FROM settings WHERE key IN ('vto_limit_default', 'vto_reset_interval_days')`
    );
    const settingsMap: Record<string, string> = {};
    for (const row of settingsResult.rows) settingsMap[row.key] = row.value;

    const limit = parseInt(settingsMap["vto_limit_default"] ?? "5", 10);
    const intervalDays = parseInt(settingsMap["vto_reset_interval_days"] ?? "14", 10);

    // Cek dan reset jika sudah waktunya
    const userResult = await db.query(
      `SELECT vto_usage, vto_reset_at FROM "user" WHERE id = $1`,
      [user.id]
    );

    if (!userResult.rows.length) return { success: false, error: "User tidak ditemukan." };

    let { vto_usage, vto_reset_at } = userResult.rows[0];
    const resetAt = new Date(vto_reset_at);
    const now = new Date();
    const diffDays = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays >= intervalDays) {
      await db.query(
        `UPDATE "user" SET vto_usage = 0, vto_reset_at = NOW() WHERE id = $1`,
        [user.id]
      );
      vto_usage = 0;
      vto_reset_at = now.toISOString();
    }

    const usage = vto_usage ?? 0;
    const remaining = Math.max(0, limit - usage);
    const nextReset = new Date(new Date(vto_reset_at).getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
      success: true,
      data: {
        usage,
        limit,
        remaining,
        next_reset: nextReset.toISOString(),
        can_use: remaining > 0,
      },
    };
  } catch (err) {
    console.error("[getMyVtoStatus]", err);
    return { success: false, error: "Gagal mengambil status VTO." };
  }
}