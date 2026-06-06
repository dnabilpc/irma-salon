"use client";

import { useState } from "react";
import type { DashboardStats } from "@/actions/admin";
import Badge from "@/components/ui/Badge";
import { formatRupiah, getBookingStatusStyle, getPaymentStyle } from "@/lib/utils";
import type { BookingStatus } from "@/types";

type FilterOption = BookingStatus | "all";

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: "all",       label: "Semua"     },
  { key: "pending",   label: "Pending"   },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Selesai"   },
  { key: "cancelled", label: "Batal"     },
];

const COL = "76px 1fr 130px 72px 72px 96px 96px 88px";

interface BookingTableProps {
  items: DashboardStats["recentBookings"];
}

export default function BookingTable({ items }: BookingTableProps) {
  const [filter, setFilter] = useState<FilterOption>("all");

  const rows = !items ? [] :
    filter === "all"
      ? items
      : items.filter((b) => b.status === filter);

  const totalCount = items ? items.length : 0;

  return (
    <div className="admin-card" style={{ overflow: "hidden" }}>

      {/* Header */}
      <div
        style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid #F0D9E0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap" as const,
          gap: "10px",
          background: "#FDF8F5",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#3A1A28",
            }}
          >
            Booking Terbaru
          </h3>
          <p style={{ fontSize: "12px", color: "#B08090", marginTop: "2px" }}>
            {rows.length} dari {totalCount} data
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              className={`filter-btn${filter === key ? " active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Header kolom */}
      <div
        className="table-row"
        style={{
          gridTemplateColumns: COL,
          background: "#FDF8F5",
          fontSize: "12px",
          color: "#B08090",
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          fontWeight: 600,
        }}
      >
        <span>ID</span>
        <span>Pelanggan</span>
        <span>Layanan</span>
        <span>Tgl</span>
        <span>Jam</span>
        <span>Status</span>
        <span>Bayar</span>
        <span>Total</span>
      </div>

      {/* Data rows */}
      {rows.map((booking) => {
        const bs = getBookingStatusStyle(booking.status);
        const ps = getPaymentStyle(booking.payment);
        return (
          <div
            key={booking.id}
            className="table-row"
            style={{ gridTemplateColumns: COL }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                color: "#B08090",
              }}
            >
              {booking.id}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#3A1A28" }}>
              {booking.customer}
            </span>
            <span style={{ fontSize: "13px", color: "#8A4060" }}>
              {booking.service}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#8A4060" }}>
              {booking.date}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#C4728E", fontWeight: 600 }}>
              {booking.time}
            </span>
            <Badge label={bs.label} bg={bs.bg} color={bs.color} />
            <Badge label={ps.label} bg={ps.bg} color={ps.color} />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "13px",
                color: "#C9922A",
                fontWeight: 600,
              }}
            >
              {formatRupiah(booking.amount)}
            </span>
          </div>
        );
      })}

      {/* Empty state */}
      {rows.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center" as const,
            color: "#B08090",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "14px",
          }}
        >
          Tidak ada data untuk filter ini
        </div>
      )}
    </div>
  );
}