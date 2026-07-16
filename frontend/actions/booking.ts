"use server";

import { backendFetch } from "@/lib/backendClient";
import { revalidatePath } from "next/cache";

// ── Types ──────────────────────────────────────────────────────────────────

export type BookingStatusDB = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";

export interface BookingRow {
  id: number;
  customer_name: string;
  phone_number: string;
  booking_datetime: string;
  status: BookingStatusDB;
  services: string;
  total_amount: number;
  payment_method: string;
  transaction_id: number | null;
}

export interface ServiceScheduleInput {
  service_id: number;
  booking_datetime: string;
}

export interface CreateBookingInput {
  booking_datetime?: string;
  service_ids?: number[];
  service_schedules?: ServiceScheduleInput[];
  payment_method?: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SalonService {
  id: number;
  service_name: string;
  price: number;
  hour_duration: number;
  image_url: string | null;
  is_price_variable?: boolean;
}

// ── GET SERVICES ───────────────────────────────────────────────────────────

export async function getSalonServices(): Promise<ActionResult<SalonService[]>> {
  try {
    const response = await backendFetch("/api/bookings/services", {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal memuat layanan." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[getSalonServices]", err);
    return { success: false, error: "Gagal memuat layanan." };
  }
}

// ── GET AVAILABLE SLOTS ────────────────────────────────────────────────────

export async function getAvailableSlots(
  date: string,
): Promise<ActionResult<{ available: string[]; booked: string[] }>> {
  try {
    const response = await backendFetch(`/api/bookings/slots?date=${encodeURIComponent(date)}`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal memuat slot." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[getAvailableSlots]", err);
    return { success: false, error: "Gagal memuat slot." };
  }
}

// ── CREATE BOOKING (Customer) ──────────────────────────────────────────────

export async function createBooking(
  input: CreateBookingInput,
): Promise<ActionResult<{ bookingId: number; transactionId?: number; token?: string | null; redirect_url?: string | null }>> {
  try {
    const response = await backendFetch("/api/bookings", {
      method: "POST",
      body: input,
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal membuat booking." };
    }

    revalidatePath("/bookings");
    revalidatePath("/admin/bookings");

    return { success: true, data };
  } catch (err) {
    console.error("[createBooking]", err);
    return { success: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

// ── UPDATE STATUS (Admin) ──────────────────────────────────────────────────

export async function updateBookingStatus(
  bookingId: number,
  status: BookingStatusDB,
  reason?: string,
): Promise<ActionResult> {
  try {
    const response = await backendFetch(`/api/admin/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: { status, reason },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal mengubah status." };
    }

    revalidatePath("/admin/bookings");
    return { success: true };
  } catch (err) {
    console.error("[updateBookingStatus]", err);
    return { success: false, error: "Gagal mengubah status." };
  }
}

// ── CANCEL BOOKING (Customer) ──────────────────────────────────────────────

export async function cancelBooking(bookingId: number): Promise<ActionResult> {
  try {
    const response = await backendFetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal membatalkan booking." };
    }

    revalidatePath("/bookings");
    return { success: true };
  } catch (err) {
    console.error("[cancelBooking]", err);
    return { success: false, error: "Gagal membatalkan booking." };
  }
}

// ── GET BOOKINGS FOR ADMIN ─────────────────────────────────────────────────

export async function getBookingsForAdmin(filters?: {
  status?: BookingStatusDB | "ALL";
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{
  rows: BookingRow[];
  total: number;
  stats?: {
    total: number;
    pending: number;
    diterima: number;
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

    const response = await backendFetch(`/api/admin/bookings?${queryParams.toString()}`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal memuat data booking." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[getBookingsForAdmin]", err);
    return { success: false, error: "Gagal memuat data booking." };
  }
}

// ── GET BOOKINGS FOR CUSTOMER ──────────────────────────────────────────────

export async function getBookingsForCustomer(): Promise<ActionResult<BookingRow[]>> {
  try {
    const response = await backendFetch("/api/bookings", {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal memuat riwayat booking." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[getBookingsForCustomer]", err);
    return { success: false, error: "Gagal memuat riwayat booking." };
  }
}
