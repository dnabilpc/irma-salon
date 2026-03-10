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
    <div style={{ background: "#1A0F05", border: "1px solid #2A1A0A" }}>

      {/* Header */}
      <div
        style={{
          padding: "18px 18px 14px",
          borderBottom: "1px solid #2A1A0A",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap" as const,
          gap: "10px",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            Booking Terbaru
          </h3>
          <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>
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
          color: "rgba(255,255,255,0.22)",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          fontFamily: "'DM Mono', monospace",
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
                color: "rgba(255,255,255,0.25)",
              }}
            >
              {booking.id}
            </span>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {booking.customer}
            </span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              {booking.service}
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              {booking.date}
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                color: "rgba(255,255,255,0.3)",
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
                color: "#C9922A",
                fontWeight: 500,
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
            padding: "32px",
            textAlign: "center" as const,
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.82rem",
          }}
        >
          Tidak ada data untuk filter ini
        </div>
      )}
    </div>
  );
}