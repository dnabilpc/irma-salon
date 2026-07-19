"use server";

import { backendFetch } from "@/lib/backendClient";

export interface SidebarCounts {
  bookings: number;
  rentals: number;
  customers: number;
  payments: number;
}

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaymentRow {
  id: number;
  customer: string;
  phone: string;
  type: string;
  description: string;
  method: string;
  status: 'lunas' | 'pending' | 'gagal';
  amount: number;
  date: string;
  payment_time?: string;
  payment_proof_sent?: boolean;
  transaction_uuid?: string | null;
  created_at?: string | null;
}

export async function fetchSidebarCounts(): Promise<ActionResult<SidebarCounts>> {
  try {
    const response = await backendFetch("/api/admin/dashboard/sidebar-counts", {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Gagal mengambil data antrean." };
    }

    const data = await response.json() as SidebarCounts;
    return { success: true, data };
  } catch (err) {
    console.error("[fetchSidebarCounts] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}

export async function fetchAdminPayments(): Promise<ActionResult<{ payments: PaymentRow[] }>> {
  try {
    const response = await backendFetch("/api/admin/payments", {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Gagal mengambil data transaksi." };
    }

    const data = await response.json() as { payments: PaymentRow[] };
    return { success: true, data };
  } catch (err) {
    console.error("[fetchAdminPayments] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}

export async function confirmAdminPayment(id: number): Promise<ActionResult> {
  try {
    const response = await backendFetch(`/api/admin/payments/${id}/confirm`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Gagal memverifikasi transaksi." };
    }

    return { success: true };
  } catch (err) {
    console.error("[confirmAdminPayment] Error:", err);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}

export interface DashboardStats {
  stats: {
    label: string;
    value: string;
    change: string;
    positive: boolean;
    icon: string;
    accent: string;
  }[];
  weeklyChart: {
    day: string;
    bookings: number;
    rentals: number;
  }[];
  todaySchedule: {
    time: string;
    name: string;
    service: string;
    status: "upcoming" | "ongoing" | "completed" | "cancelled";
  }[];
  topServices: {
    name: string;
    count: number;
    pct: number;
  }[];
  recentBookings: {
    id: string;
    customer: string;
    service: string;
    date: string;
    time: string;
    status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
    payment: "paid" | "pending" | "refunded";
    amount: number;
  }[];
  recentRentals: {
    id: string;
    customer: string;
    item: string;
    rent_date: string;
    return_date: string;
    status: "dipinjam" | "dikembalikan" | "overdue" | "cancelled";
    amount: number;
  }[];
}

export async function getAdminDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const response = await backendFetch("/api/admin/dashboard", {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal memuat data dashboard." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[getAdminDashboardStats]", err);
    return { success: false, error: "Gagal menghubungkan ke server." };
  }
}

export async function uploadAdminImage(
  image: string,
  folder: string,
  filenamePrefix: string
): Promise<ActionResult<{ imageUrl: string }>> {
  try {
    const response = await backendFetch("/api/admin/upload-image", {
      method: "POST",
      body: { image, folder, filenamePrefix },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Gagal mengunggah gambar." };
    }

    return { success: true, data: { imageUrl: data.imageUrl } };
  } catch (err) {
    console.error("[uploadAdminImage]", err);
    return { success: false, error: "Gagal mengunggah gambar." };
  }
}
