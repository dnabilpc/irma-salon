"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AppUser } from "@/types";
import { resetVtoUsageForUser } from "@/actions/vto";

// ── Types ──────────────────────────────────────────────────────────────────

export type RentalStatus =
  | "pending"
  | "only_deposit"
  | "ongoing"
  | "terlambat"
  | "done"
  | "cancelled";

export interface RentalRow {
  id: number;
  customer_name: string;
  customer_phone: string | null;
  outfit_name: string;
  category_name: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  amount_to_be_paid: number;
  deposit_paid: number;
  deposit_refund: number | null;
  rental_status: RentalStatus;
  status: RentalStatus;
  transaction_id: number | null;
  payment_method: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Helper ─────────────────────────────────────────────────────────────────

async function getAuthUser(): Promise<AppUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session.user as unknown as AppUser;
}

// ── GET RENTALS FOR ADMIN ──────────────────────────────────────────────────

export async function getRentalsForAdmin(filters?: {
  status?: RentalStatus | "ALL";
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ rows: RentalRow[]; total: number }>> {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Akses ditolak." };
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.status && filters.status !== "ALL") {
      params.push(filters.status);
      conditions.push(`r.rental_status = $${params.length}`);
    }
    if (filters?.search) {
      params.push(`%${filters.search}%`);
      conditions.push(
        `(u.name ILIKE $${params.length} OR oc.outfit_name ILIKE $${params.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await db.query(
      `SELECT COUNT(*)
       FROM rentals r
       JOIN "user" u            ON u.id  = r.user_id
       JOIN outfit_catalogues oc ON oc.id = r.outfit_catalogues_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await db.query(
      `SELECT
         r.id,
         u.name                                                          AS customer_name,
         u.phone_number                                                  AS customer_phone,
         oc.outfit_name,
         cat.category_name,
         r.start_date::text                                              AS start_date,
         (r.start_date + r.duration_days * INTERVAL '1 day')::date::text AS end_date,
         r.duration_days,
         r.amount_to_be_paid,
         r.deposit_paid,
         r.deposit_refund,
         r.rental_status,
         r.rental_status                                                 AS status,
         t.id                                                            AS transaction_id,
         COALESCE(t.payment_method, 'cash')                             AS payment_method
       FROM rentals r
       JOIN "user" u              ON u.id   = r.user_id
       JOIN outfit_catalogues oc  ON oc.id  = r.outfit_catalogues_id
       JOIN outfit_categories cat ON cat.id = oc.outfit_category_id
       LEFT JOIN transactions t   ON t.rental_id = r.id
       ${where}
       ORDER BY r.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return { success: true, data: { rows: result.rows, total } };
  } catch (err) {
    console.error("[getRentalsForAdmin]", err);
    return { success: false, error: "Gagal memuat data sewa." };
  }
}

// ── UPDATE RENTAL STATUS (Admin) ───────────────────────────────────────────

export async function updateRentalStatus(
  rentalId: number,
  status: RentalStatus,
  deposit_refund?: number
): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Akses ditolak." };
    }

    const valid: RentalStatus[] = [
      "pending", "only_deposit", "ongoing", "terlambat", "done", "cancelled",
    ];
    if (!valid.includes(status)) {
      return { success: false, error: "Status tidak valid." };
    }

    let query: string;
    let queryParams: (string | number | null)[];

    if (status === "done" && deposit_refund !== undefined) {
      query = `UPDATE rentals SET rental_status = $1, deposit_refund = $2 WHERE id = $3 RETURNING id, user_id`;
      queryParams = [status, deposit_refund, rentalId];
    } else {
      query = `UPDATE rentals SET rental_status = $1 WHERE id = $2 RETURNING id, user_id`;
      queryParams = [status, rentalId];
    }

    const result = await db.query(query, queryParams);
    if (!result.rows.length) {
      return { success: false, error: "Data sewa tidak ditemukan." };
    }

    // ── Reset VTO saat transaksi selesai ──
    if (status === "done") {
      const userId = result.rows[0].user_id;
      // Reset VTO secara background — tidak block response
      resetVtoUsageForUser(userId).catch((err) =>
        console.error("[updateRentalStatus] VTO reset failed:", err)
      );
    }

    revalidatePath("/admin/rentals");
    return { success: true };
  } catch (err) {
    console.error("[updateRentalStatus]", err);
    return { success: false, error: "Gagal mengubah status." };
  }
}

// ── SYNC LATE RENTALS ──────────────────────────────────────────────────────

export async function syncLateRentals(): Promise<ActionResult<{ updated: number }>> {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Akses ditolak." };
    }

    const result = await db.query(
      `UPDATE rentals
       SET rental_status = 'terlambat'
       WHERE rental_status = 'ongoing'
         AND (start_date + duration_days * INTERVAL '1 day')::date < CURRENT_DATE
       RETURNING id`
    );

    if (result.rows.length > 0) {
      revalidatePath("/admin/rentals");
    }

    return { success: true, data: { updated: result.rows.length } };
  } catch (err) {
    console.error("[syncLateRentals]", err);
    return { success: false, error: "Gagal sync status terlambat." };
  }
}

// ── GET RENTALS FOR CUSTOMER ───────────────────────────────────────────────

export async function getRentalsForCustomer(): Promise<ActionResult<RentalRow[]>> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Silakan login." };

    const result = await db.query(
      `SELECT
         r.id,
         u.name                                                          AS customer_name,
         u.phone_number                                                  AS customer_phone,
         oc.outfit_name,
         cat.category_name,
         r.start_date::text                                              AS start_date,
         (r.start_date + r.duration_days * INTERVAL '1 day')::date::text AS end_date,
         r.duration_days,
         r.amount_to_be_paid,
         r.deposit_paid,
         r.deposit_refund,
         r.rental_status,
         r.rental_status                                                 AS status,
         t.id                                                            AS transaction_id,
         COALESCE(t.payment_method, 'cash')                             AS payment_method
       FROM rentals r
       JOIN "user" u              ON u.id   = r.user_id
       JOIN outfit_catalogues oc  ON oc.id  = r.outfit_catalogues_id
       JOIN outfit_categories cat ON cat.id = oc.outfit_category_id
       LEFT JOIN transactions t   ON t.rental_id = r.id
       WHERE r.user_id = $1
       ORDER BY r.id DESC`,
      [user.id]
    );

    return { success: true, data: result.rows };
  } catch (err) {
    console.error("[getRentalsForCustomer]", err);
    return { success: false, error: "Gagal memuat riwayat sewa." };
  }
}

// ── CANCEL RENTAL (Customer) ───────────────────────────────────────────────

export async function cancelRental(rentalId: number): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Silakan login." };

    const check = await db.query(
      `SELECT id, rental_status FROM rentals WHERE id = $1 AND user_id = $2`,
      [rentalId, user.id]
    );
    if (!check.rows.length) {
      return { success: false, error: "Data sewa tidak ditemukan." };
    }
    if (check.rows[0].rental_status !== "pending") {
      return { success: false, error: "Hanya sewa berstatus pending yang dapat dibatalkan." };
    }

    await db.query(
      `UPDATE rentals SET rental_status = 'cancelled' WHERE id = $1`,
      [rentalId]
    );

    revalidatePath("/sewa");
    return { success: true };
  } catch (err) {
    console.error("[cancelRental]", err);
    return { success: false, error: "Gagal membatalkan sewa." };
  }
}