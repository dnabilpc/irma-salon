"use client";

import { useState, useEffect, useCallback } from "react";
// import { updateBookingStatus } from "@/actions/booking"; // uncomment saat DB tersambung
import type { BookingStatusDB, BookingRow } from "@/actions/booking";

// ── Mock data (diganti API real saat DB tersambung) ─────────────────────────

const MOCK_BOOKINGS: BookingRow[] = [
  {
    id: 1,
    customer_name: "Siti Rahayu",
    phone_number: "08123456789",
    booking_datetime: "2026-03-09T10:00:00",
    status: "diterima",
    services: "Hair Treatment",
    total_amount: 150000,
    payment_method: "cash",
    transaction_id: 101,
  },
  {
    id: 2,
    customer_name: "Dewi Kusuma",
    phone_number: "08234567890",
    booking_datetime: "2026-03-09T13:00:00",
    status: "pending",
    services: "Makeup & Rias",
    total_amount: 250000,
    payment_method: "payment_gateway",
    transaction_id: 102,
  },
  {
    id: 3,
    customer_name: "Rina Aprilia",
    phone_number: "08345678901",
    booking_datetime: "2026-03-09T14:30:00",
    status: "diterima",
    services: "Nail Care, Facial",
    total_amount: 200000,
    payment_method: "cash",
    transaction_id: 103,
  },
  {
    id: 4,
    customer_name: "Mega Putri",
    phone_number: "08456789012",
    booking_datetime: "2026-03-09T16:00:00",
    status: "ditolak",
    services: "Facial",
    total_amount: 120000,
    payment_method: "cash",
    transaction_id: 104,
  },
  {
    id: 5,
    customer_name: "Layla Hanum",
    phone_number: "08567890123",
    booking_datetime: "2026-03-10T09:00:00",
    status: "pending",
    services: "Hair Treatment",
    total_amount: 150000,
    payment_method: "cash",
    transaction_id: null,
  },
  {
    id: 6,
    customer_name: "Nurul Fadilah",
    phone_number: "08678901234",
    booking_datetime: "2026-03-10T11:00:00",
    status: "diterima",
    services: "Makeup & Rias, Hair Treatment",
    total_amount: 400000,
    payment_method: "payment_gateway",
    transaction_id: 106,
  },
  {
    id: 7,
    customer_name: "Fitri Handayani",
    phone_number: "08789012345",
    booking_datetime: "2026-03-11T09:30:00",
    status: "cancelled",
    services: "Rebonding",
    total_amount: 180000,
    payment_method: "cash",
    transaction_id: null,
  },
  {
    id: 8,
    customer_name: "Yuni Kartika",
    phone_number: "08890123456",
    booking_datetime: "2026-03-11T13:00:00",
    status: "pending",
    services: "Facial, Nail Care",
    total_amount: 200000,
    payment_method: "cash",
    transaction_id: null,
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

type StatusConfig = { label: string; bg: string; color: string; dot: string };

const STATUS_CONFIG: Record<BookingStatusDB | "cancelled", StatusConfig> = {
  pending:   { label: "Pending",   bg: "rgba(201,146,42,0.15)",  color: "#C9922A", dot: "#C9922A" },
  diterima:  { label: "Diterima",  bg: "rgba(76,175,130,0.15)",  color: "#4CAF82", dot: "#4CAF82" },
  ditolak:   { label: "Ditolak",   bg: "rgba(220,80,80,0.15)",   color: "#DC5050", dot: "#DC5050" },
  cancelled: { label: "Cancelled", bg: "rgba(100,100,120,0.15)", color: "#9090A0", dot: "#9090A0" },
};

const FILTER_TABS: { key: BookingStatusDB | "all"; label: string }[] = [
  { key: "all",      label: "Semua" },
  { key: "pending",  label: "Pending" },
  { key: "diterima", label: "Diterima" },
  { key: "ditolak",  label: "Ditolak" },
  { key: "cancelled",label: "Cancelled" },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatusDB | "cancelled" }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.cancelled;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: cfg.bg,
        color: cfg.color,
        fontSize: "0.68rem",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "2px",
        letterSpacing: "0.06em",
        fontFamily: "'DM Mono', monospace",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  booking: BookingRow;
  onClose: () => void;
  onStatusChange: (id: number, status: BookingStatusDB) => void;
  loading: boolean;
}

function DetailModal({ booking, onClose, onStatusChange, loading }: DetailModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#130900",
          border: "1px solid #2A1A0A",
          borderRadius: "4px",
          width: "100%",
          maxWidth: "520px",
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modal */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #2A1A0A",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.15rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                marginBottom: "4px",
              }}
            >
              Detail Booking #{booking.id}
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              fontSize: "1.2rem",
              lineHeight: 1,
              padding: "4px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            ✕
          </button>
        </div>

        {/* Body modal */}
        <div style={{ padding: "24px" }}>
          {/* Info pelanggan */}
          <div
            style={{
              background: "#1A0F05",
              border: "1px solid #2A1A0A",
              borderRadius: "3px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "0.62rem",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.2)",
                textTransform: "uppercase",
                fontFamily: "'DM Mono', monospace",
                marginBottom: "12px",
              }}
            >
              Info Pelanggan
            </div>
            <InfoRow label="Nama" value={booking.customer_name} />
            <InfoRow label="No. HP" value={booking.phone_number} />
            <InfoRow
              label="Jadwal"
              value={formatDateTime(booking.booking_datetime)}
              accent
            />
          </div>

          {/* Detail layanan */}
          <div
            style={{
              background: "#1A0F05",
              border: "1px solid #2A1A0A",
              borderRadius: "3px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "0.62rem",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.2)",
                textTransform: "uppercase",
                fontFamily: "'DM Mono', monospace",
                marginBottom: "12px",
              }}
            >
              Layanan & Pembayaran
            </div>
            <InfoRow label="Layanan" value={booking.services} />
            <InfoRow
              label="Total"
              value={formatRupiah(booking.total_amount)}
              accent
            />
            <InfoRow
              label="Metode"
              value={booking.payment_method === "cash" ? "Cash" : "Payment Gateway"}
            />
            {booking.transaction_id && (
              <InfoRow label="ID Transaksi" value={`#${booking.transaction_id}`} />
            )}
          </div>

          {/* Action buttons — hanya muncul jika status pending */}
          {booking.status === "pending" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={loading}
                onClick={() => onStatusChange(booking.id, "diterima")}
                style={{
                  flex: 1,
                  background: loading ? "rgba(76,175,130,0.3)" : "rgba(76,175,130,0.15)",
                  border: "1px solid rgba(76,175,130,0.4)",
                  color: "#4CAF82",
                  padding: "12px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  borderRadius: "2px",
                  transition: "all 0.2s",
                  letterSpacing: "0.04em",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "rgba(76,175,130,0.25)";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "rgba(76,175,130,0.15)";
                }}
              >
                ✓ Terima Booking
              </button>
              <button
                disabled={loading}
                onClick={() => onStatusChange(booking.id, "ditolak")}
                style={{
                  flex: 1,
                  background: loading ? "rgba(220,80,80,0.3)" : "rgba(220,80,80,0.12)",
                  border: "1px solid rgba(220,80,80,0.3)",
                  color: "#DC5050",
                  padding: "12px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  borderRadius: "2px",
                  transition: "all 0.2s",
                  letterSpacing: "0.04em",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "rgba(220,80,80,0.2)";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "rgba(220,80,80,0.12)";
                }}
              >
                ✕ Tolak Booking
              </button>
            </div>
          )}

          {/* Jika sudah diterima — tombol selesaikan */}
          {booking.status === "diterima" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={loading}
                onClick={() => onStatusChange(booking.id, "ditolak")}
                style={{
                  background: "rgba(100,100,120,0.1)",
                  border: "1px solid rgba(100,100,120,0.2)",
                  color: "rgba(255,255,255,0.35)",
                  padding: "10px 18px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.78rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  borderRadius: "2px",
                  letterSpacing: "0.04em",
                }}
              >
                Batalkan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "16px",
        marginBottom: "8px",
        fontSize: "0.8rem",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{label}</span>
      <span
        style={{
          color: accent ? "#C9922A" : "rgba(255,255,255,0.72)",
          fontWeight: accent ? 600 : 400,
          fontFamily: accent ? "'DM Mono', monospace" : "inherit",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Stat mini ────────────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#1A0F05",
        border: "1px solid #2A1A0A",
        padding: "14px 20px",
        flex: 1,
        minWidth: "120px",
      }}
    >
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.6rem",
          fontWeight: 700,
          color,
          lineHeight: 1,
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{label}</div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const COL = "60px 1fr 120px 150px 110px 100px 90px 48px";

export default function AdminBookingsClient() {
  const [bookings, setBookings] = useState<BookingRow[]>(MOCK_BOOKINGS);
  const [filter, setFilter] = useState<BookingStatusDB | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  // Filter + search (client-side atas mock data; ganti dengan server action untuk prod)
  const filtered = bookings.filter((b) => {
    const statusMatch = filter === "all" || b.status === filter;
    const searchMatch =
      !search ||
      b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      b.services.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const totalPages = Math.ceil(filtered.length / LIMIT);

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    diterima: bookings.filter((b) => b.status === "diterima").length,
    revenue: bookings
      .filter((b) => b.status === "diterima")
      .reduce((s, b) => s + b.total_amount, 0),
  };

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  async function handleStatusChange(id: number, status: BookingStatusDB) {
    setActionLoading(true);
    try {
      // Panggil server action (mock update lokal juga agar UI responsif)
      // await updateBookingStatus(id, status); // uncomment saat DB tersambung
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
      setSelectedBooking(null);
      showToast(
        status === "diterima"
          ? "Booking berhasil diterima!"
          : "Booking telah ditolak.",
        status === "diterima"
      );
    } catch {
      showToast("Gagal mengubah status.", false);
    } finally {
      setActionLoading(false);
    }
  }

  // Reset page saat filter berubah
  useEffect(() => setPage(1), [filter, search]);

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "72px",
            right: "24px",
            zIndex: 2000,
            background: toast.ok ? "rgba(76,175,130,0.15)" : "rgba(220,80,80,0.15)",
            border: `1px solid ${toast.ok ? "rgba(76,175,130,0.4)" : "rgba(220,80,80,0.4)"}`,
            color: toast.ok ? "#4CAF82" : "#DC5050",
            padding: "12px 20px",
            borderRadius: "3px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.82rem",
            fontWeight: 500,
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            animation: "slideDown 0.2s ease",
          }}
        >
          {toast.ok ? "✓ " : "✕ "}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              marginBottom: "4px",
            }}
          >
            Manajemen Booking
          </h1>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
            Kelola semua reservasi layanan salon
          </p>
        </div>

        {/* Export placeholder */}
        <button
          style={{
            background: "rgba(201,146,42,0.1)",
            border: "1px solid rgba(201,146,42,0.3)",
            color: "#C9922A",
            padding: "9px 18px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.78rem",
            fontWeight: 500,
            cursor: "pointer",
            borderRadius: "2px",
            letterSpacing: "0.04em",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(201,146,42,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(201,146,42,0.1)";
          }}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Mini stats */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <MiniStat label="Total Booking" value={stats.total} color="rgba(255,255,255,0.7)" />
        <MiniStat label="Menunggu Konfirmasi" value={stats.pending} color="#C9922A" />
        <MiniStat label="Booking Diterima" value={stats.diterima} color="#4CAF82" />
        <MiniStat label="Total Pendapatan" value={formatRupiah(stats.revenue)} color="#C9922A" />
      </div>

      {/* Filter + Search bar */}
      <div
        style={{
          background: "#1A0F05",
          border: "1px solid #2A1A0A",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.2)",
              fontSize: "0.9rem",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari nama pelanggan atau layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid #2A1A0A",
              borderRadius: "2px",
              padding: "9px 12px 9px 36px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.7)",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,146,42,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A1A0A")}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {FILTER_TABS.map(({ key, label }) => {
            const count =
              key === "all"
                ? bookings.length
                : bookings.filter((b) => b.status === key).length;
            return (
              <button
                key={key}
                className={`filter-btn${filter === key ? " active" : ""}`}
                onClick={() => setFilter(key as BookingStatusDB | "all")}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {label}
                <span
                  style={{
                    background: filter === key ? "rgba(201,146,42,0.25)" : "rgba(255,255,255,0.06)",
                    color: filter === key ? "#C9922A" : "rgba(255,255,255,0.3)",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: "10px",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#1A0F05", border: "1px solid #2A1A0A" }}>

        {/* Keterangan hasil */}
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid #2A1A0A",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>
            Menampilkan {paginated.length} dari {filtered.length} booking
          </span>
          {filter === "pending" && stats.pending > 0 && (
            <span
              style={{
                fontSize: "0.68rem",
                color: "#C9922A",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              ⚡ {stats.pending} booking menunggu konfirmasimu
            </span>
          )}
        </div>

        {/* Header kolom */}
        <div
          className="table-row"
          style={{
            gridTemplateColumns: COL,
            color: "rgba(255,255,255,0.22)",
            fontSize: "0.62rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          <span>#</span>
          <span>Pelanggan</span>
          <span>Jadwal</span>
          <span>Layanan</span>
          <span>Status</span>
          <span>Total</span>
          <span>Bayar</span>
          <span />
        </div>

        {/* Rows */}
        {paginated.length === 0 ? (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: "rgba(255,255,255,0.2)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.82rem",
            }}
          >
            Tidak ada data untuk filter ini
          </div>
        ) : (
          paginated.map((b) => (
            <div
              key={b.id}
              className="table-row"
              style={{
                gridTemplateColumns: COL,
                cursor: "pointer",
              }}
              onClick={() => setSelectedBooking(b)}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                {b.id}
              </span>

              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.75)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.customer_name}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.62rem",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  {b.phone_number}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {new Date(b.booking_datetime).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.68rem",
                    color: "#C9922A",
                    fontWeight: 500,
                  }}
                >
                  {new Date(b.booking_datetime).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <span
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.45)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {b.services}
              </span>

              <StatusBadge status={b.status} />

              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.72rem",
                  color: "#C9922A",
                  fontWeight: 500,
                }}
              >
                {formatRupiah(b.total_amount)}
              </span>

              <span
                style={{
                  fontSize: "0.68rem",
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {b.payment_method === "cash" ? "Cash" : "GW"}
              </span>

              {/* Quick action — konfirmasi pending langsung dari baris */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ display: "flex", justifyContent: "center" }}
              >
                {b.status === "pending" ? (
                  <button
                    title="Terima booking"
                    onClick={() => handleStatusChange(b.id, "diterima")}
                    style={{
                      background: "rgba(76,175,130,0.12)",
                      border: "1px solid rgba(76,175,130,0.3)",
                      color: "#4CAF82",
                      width: "28px",
                      height: "28px",
                      borderRadius: "2px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(76,175,130,0.22)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "rgba(76,175,130,0.12)")
                    }
                  >
                    ✓
                  </button>
                ) : (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.15)",
                      cursor: "default",
                    }}
                  >
                    —
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={{
              background: "transparent",
              border: "1px solid #2A1A0A",
              color: page === 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
              padding: "6px 14px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.78rem",
              cursor: page === 1 ? "not-allowed" : "pointer",
              borderRadius: "2px",
              transition: "all 0.2s",
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                background: p === page ? "rgba(201,146,42,0.15)" : "transparent",
                border: `1px solid ${p === page ? "#C9922A" : "#2A1A0A"}`,
                color: p === page ? "#C9922A" : "rgba(255,255,255,0.4)",
                width: "34px",
                height: "34px",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.75rem",
                fontWeight: p === page ? 600 : 400,
                cursor: "pointer",
                borderRadius: "2px",
                transition: "all 0.2s",
              }}
            >
              {p}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{
              background: "transparent",
              border: "1px solid #2A1A0A",
              color:
                page === totalPages
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.5)",
              padding: "6px 14px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.78rem",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              borderRadius: "2px",
              transition: "all 0.2s",
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <DetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={handleStatusChange}
          loading={actionLoading}
        />
      )}
    </div>
  );
}