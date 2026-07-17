"use server";

import { revalidatePath } from "next/cache";
import { backendFetch } from "@/lib/backendClient";

// ── Types ──────────────────────────────────────────────────────────────────

export type RentalStatus =
  | "pending"
  | "ongoing"
  | "terlambat"
  | "done"
  | "cancelled";

export interface RentalRow {
  id: number;
  outfit_catalogues_id: number;
  customer_name: string;
  customer_phone: string | null;
  outfit_name: string;
  category_name: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  amount_to_be_paid: number;
  rental_status: RentalStatus;
  status: RentalStatus;
  transaction_id: number | null;
  payment_method: string;
  payment_proof_sent?: boolean;
  payment_proof_url?: string | null;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── GET RENTALS FOR ADMIN ──────────────────────────────────────────────────

export async function getRentalsForAdmin(filters?: {
  status?: RentalStatus | "ALL";
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{
  rows: RentalRow[];
  total: number;
  stats?: {
    total: number;
    ongoing: number;
    terlambat: number;
    revenue: number;
  };
}>> {
  try {
    const status = filters?.status ?? "ALL";
    const search = filters?.search ?? "";
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const queryParams = new URLSearchParams({
      status,
      search,
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await backendFetch(`/api/admin/rentals?${queryParams.toString()}`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal memuat data sewa." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[getRentalsForAdmin]", err);
    return { success: false, error: "Gagal memuat data sewa." };
  }
}

// ── UPDATE RENTAL STATUS (Admin) ───────────────────────────────────────────

export async function updateRentalStatus(
  rentalId: number,
  status: RentalStatus,
  confirmPayment?: boolean
): Promise<ActionResult<any>> {
  try {
    const response = await backendFetch(`/api/admin/rentals/${rentalId}/status`, {
      method: "PATCH",
      body: { status, confirm_payment: confirmPayment },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal mengubah status." };
    }

    revalidatePath("/admin/rentals");
    return { success: true, data: data.penalty };
  } catch (err) {
    console.error("[updateRentalStatus]", err);
    return { success: false, error: "Gagal mengubah status." };
  }
}

// ── SYNC LATE RENTALS ──────────────────────────────────────────────────────

export async function syncLateRentals(): Promise<ActionResult<{ updated: number }>> {
  try {
    const response = await backendFetch("/api/admin/rentals/sync-late", {
      method: "POST",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal sync status terlambat." };
    }

    revalidatePath("/admin/rentals");
    return { success: true, data: { updated: data.updated } };
  } catch (err) {
    console.error("[syncLateRentals]", err);
    return { success: false, error: "Gagal sync status terlambat." };
  }
}

// ── GET RENTALS FOR CUSTOMER ───────────────────────────────────────────────

export async function getRentalsForCustomer(): Promise<ActionResult<RentalRow[]>> {
  try {
    const response = await backendFetch("/api/rentals", {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal memuat riwayat sewa." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[getRentalsForCustomer]", err);
    return { success: false, error: "Gagal memuat riwayat sewa." };
  }
}

// ── CANCEL RENTAL (Customer) ───────────────────────────────────────────────

export async function cancelRental(rentalId: number): Promise<ActionResult> {
  try {
    const response = await backendFetch(`/api/rentals/${rentalId}/cancel`, {
      method: "POST",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal membatalkan sewa." };
    }

    revalidatePath("/rent");
    return { success: true };
  } catch (err) {
    console.error("[cancelRental]", err);
    return { success: false, error: "Gagal membatalkan sewa." };
  }
}

// ── CREATE RENTAL CART (Customer) ───────────────────────────────────────────

export interface RentalCartItemInput {
  outfit_catalogues_id: number;
  start_date: string;
  duration_days: number;
}

export interface CreateRentalCartInput {
  items: RentalCartItemInput[];
  payment_method: string;
  notes?: string;
}

export async function createRentalCart(
  input: CreateRentalCartInput
): Promise<ActionResult<{ rentalOrderId: number; rentalIds: number[]; transactionId: number }>> {
  try {
    const response = await backendFetch("/api/rentals/cart", {
      method: "POST",
      body: input,
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal membuat pesanan sewa." };
    }

    revalidatePath("/rent");
    return { success: true, data };
  } catch (err) {
    console.error("[createRentalCart]", err);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}