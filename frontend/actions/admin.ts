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
  type: 'booking' | 'sewa';
  description: string;
  method: 'cash' | 'qris' | 'midtrans' | 'payment_gateway';
  status: 'lunas' | 'pending' | 'gagal';
  amount: number;
  date: string;
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
