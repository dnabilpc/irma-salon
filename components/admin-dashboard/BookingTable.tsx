"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { RECENT_BOOKINGS } from "@/constants/data";
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

export default function BookingTable() {
  const [filter, setFilter] = useState<FilterOption>("all");

  const rows =
    filter === "all"
      ? RECENT_BOOKINGS
      : RECENT_BOOKINGS.filter((b) => b.status === filter);

  return (
    <div
      className="admin-card"
      style={{ overflow: "hidden" }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid #F0E0E6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap" as const,
          gap: "10px",
          background: "white",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#2C1A0E",
            }}
          >
            Booking Terbaru
          </h3>
          <p style={{ fontSize: "0.68rem", color: "#B09080", marginTop: "2px" }}>
            {rows.length} dari {RECENT_BOOKINGS.length} data
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

      {/* Column headers */}
      <div
        className="table-row"
        style={{
          gridTemplateColumns: COL,
          color: "#B09080",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          fontFamily: "'DM Mono', monospace",
          background: "#FDFAF7",
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
                fontSize: "0.68rem",
                color: "#B09080",
              }}
            >
              {booking.id}
            </span>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "#2C1A0E",
              }}
            >
              {booking.customer}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#7A5C50" }}>
              {booking.service}
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                color: "#7A5C50",
              }}
            >
              {booking.date}
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                color: "#7A5C50",
              }}
            >
              {booking.time}
            </span>
            <Badge label={bs.label} bg={bs.bg} color={bs.color} />
            <Badge label={ps.label} bg={ps.bg} color={ps.color} />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.72rem",
                color: "#C4788A",
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
            color: "#B09080",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
          }}
        >
          Tidak ada data untuk filter ini
        </div>
      )}
    </div>
  );
}