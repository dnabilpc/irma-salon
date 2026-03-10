// lib/utils.ts

import type { BookingStatus, PaymentStatus, RentalStatus } from "@/types";

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
    pending:   { bg: "rgba(201,146,42,0.15)",  color: "#C9922A", label: "Pending"   },
    confirmed: { bg: "rgba(76,175,130,0.15)",  color: "#4CAF82", label: "Confirmed" },
    completed: { bg: "rgba(123,159,212,0.15)", color: "#7B9FD4", label: "Selesai"   },
    cancelled: { bg: "rgba(220,80,80,0.15)",   color: "#DC5050", label: "Batal"     },
  };
  return map[status];
}

export function getPaymentStyle(
  status: PaymentStatus
): { bg: string; color: string; label: string } {
  const map: Record<PaymentStatus, { bg: string; color: string; label: string }> = {
    paid:     { bg: "rgba(76,175,130,0.15)",  color: "#4CAF82", label: "Lunas"       },
    pending:  { bg: "rgba(201,146,42,0.15)",  color: "#C9922A", label: "Belum Bayar" },
    refunded: { bg: "rgba(123,159,212,0.15)", color: "#7B9FD4", label: "Refund"      },
  };
  return map[status];
}

export function getRentalStyle(
  status: RentalStatus
): { bg: string; color: string } {
  const map: Record<RentalStatus, { bg: string; color: string }> = {
    dipinjam:     { bg: "rgba(201,146,42,0.15)", color: "#C9922A" },
    dikembalikan: { bg: "rgba(76,175,130,0.15)", color: "#4CAF82" },
    terlambat:    { bg: "rgba(220,80,80,0.15)",  color: "#DC5050" },
  };
  return map[status];
}