"use server";

// actions/vto.ts
// Server actions untuk Virtual Try-On calling Express backend

import { backendFetch } from "@/lib/backendClient";

export interface VtoStatus {
  usage: number;
  limit: number;
  base_limit?: number;
  bonus_limit?: number;
  completed_rentals?: number;
  days_inactive?: number;
  is_bonus_expired?: boolean;
  bonus_expiry_days?: number;
  remaining: number;
  next_reset: string;
  can_use: boolean;
}

// Reset VTO usage untuk user tertentu (dipanggil saat transaksi sewa selesai)
export async function resetVtoUsageForUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await backendFetch("/api/vto/reset", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal reset VTO usage." };
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
    const response = await backendFetch("/api/vto/status", {
      method: "GET",
    });

    const resJson = await response.json();
    if (!response.ok) {
      return { success: false, error: resJson.error || "Gagal mengambil status VTO." };
    }

    return {
      success: true,
      data: resJson,
    };
  } catch (err) {
    console.error("[getMyVtoStatus]", err);
    return { success: false, error: "Gagal mengambil status VTO." };
  }
}