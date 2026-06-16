// lib/utils.ts

import type { BookingStatus, PaymentStatus } from "@/types";

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getBookingStatusStyle(
  status: BookingStatus
): { bg: string; color: string; label: string } {
  const map: Record<BookingStatus, { bg: string; color: string; label: string }> = {
    pending:   { bg: "rgba(201,146,42,0.12)",  color: "#A07010", label: "Pending"   },
    confirmed: { bg: "rgba(90,158,122,0.12)",   color: "#3D7A5A", label: "Confirmed" },
    completed: { bg: "rgba(196,120,138,0.12)",  color: "#9A4060", label: "Selesai"   },
    cancelled: { bg: "rgba(150,120,110,0.12)",  color: "#7A5C50", label: "Batal"     },
    rejected:  { bg: "rgba(192,80,96,0.12)",    color: "#C05060", label: "Ditolak"   },
  };
  return map[status] || { bg: "rgba(100,100,100,0.1)", color: "#666", label: status || "Unknown" };
}

export function getPaymentStyle(
  status: PaymentStatus
): { bg: string; color: string; label: string } {
  const map: Record<PaymentStatus, { bg: string; color: string; label: string }> = {
    paid:     { bg: "rgba(90,158,122,0.12)",  color: "#3D7A5A", label: "Lunas"       },
    pending:  { bg: "rgba(201,146,42,0.12)", color: "#A07010",  label: "Belum Bayar" },
    refunded: { bg: "rgba(196,120,138,0.12)", color: "#9A4060", label: "Refund"      },
  };
  return map[status] || { bg: "rgba(100,100,100,0.1)", color: "#666", label: status || "Unknown" };
}

export function getRentalStyle(
  status: string
): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    dipinjam:     { bg: "rgba(201,146,42,0.12)",  color: "#A07010" },
    dikembalikan: { bg: "rgba(90,158,122,0.12)",   color: "#3D7A5A" },
    terlambat:    { bg: "rgba(192,80,96,0.12)",    color: "#C05060" },
    pending:      { bg: "rgba(201,146,42,0.12)",  color: "#A07010" },
    cancelled:    { bg: "rgba(150,100,120,0.12)", color: "#806070" },
  };
  return map[status] || { bg: "rgba(100,100,100,0.1)", color: "#666" };
}