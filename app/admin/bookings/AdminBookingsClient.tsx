// app/admin/bookings/AdminBookingsClient.tsx
// Client Component — semua interaksi UI booking ada di sini
// Filter, search, modal detail, approve/reject booking
"use client";

import { useState, useEffect, useCallback } from "react";
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

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  };
}

// ── Status config ──────────────────────────────────────────────────────────

type StatusKey = BookingStatusDB | "cancelled";

const STATUS_CONFIG: Record<StatusKey, { label: string; bg: string; color: string }> = {
  pending:   { label: "Pending",    bg: "rgba(201,146,42,0.12)",  color: "#A07010" },
  diterima:  { label: "Diterima",   bg: "rgba(42,140,90,0.12)",   color: "#1A7A4A" },
  ditolak:   { label: "Ditolak",    bg: "rgba(217,64,96,0.12)",   color: "#D94060" },
  cancelled: { label: "Dibatalkan", bg: "rgba(150,100,120,0.12)", color: "#806070" },
};

const FILTER_TABS: { key: StatusKey | "all"; label: string }[] = [
  { key: "all",      label: "Semua"     },
  { key: "pending",  label: "Pending"   },
  { key: "diterima", label: "Diterima"  },
  { key: "ditolak",  label: "Ditolak"   },
  { key: "cancelled",label: "Dibatalkan"},
];

const LIMIT = 10;
const COL   = "48px 1fr 110px 130px 90px 110px 100px 48px";

// ── Sub-komponen: StatusBadge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusKey }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.cancelled;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: cfg.bg,
        color: cfg.color,
        fontSize: "12px",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "20px",
        whiteSpace: "nowrap" as const,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: cfg.color,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

// ── Sub-komponen: InfoRow (untuk modal) ────────────────────────────────────

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "16px",
        padding: "11px 0",
        borderBottom: "1px solid #F0D9E0",
      }}
    >
      <span style={{ fontSize: "13px", color: "#B08090", fontWeight: 500, flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: "14px",
          color: accent ? "#C4728E" : "#3A1A28",
          fontWeight: accent ? 700 : 500,
          textAlign: "right" as const,
          fontFamily: accent ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Sub-komponen: Detail Modal ─────────────────────────────────────────────

interface DetailModalProps {
  booking: BookingRow;
  onClose: () => void;
  onStatusChange: (id: number, status: BookingStatusDB) => void;
  loading: boolean;
}

function DetailModal({ booking, onClose, onStatusChange, loading }: DetailModalProps) {
  const { date, time } = formatDateTime(booking.booking_datetime);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(90,20,40,0.3)",
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
          background: "white",
          border: "1px solid #E8C0D0",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "500px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(196,114,142,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modal */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F0D9E0",
            background: "#FAEAF0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#7A2848",
                marginBottom: "6px",
              }}
            >
              Detail Booking #{booking.id}
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.6)",
              border: "1px solid #E8C0D0",
              color: "#B08090",
              cursor: "pointer",
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "white")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.6)")}
          >
            ✕
          </button>
        </div>

        {/* Body modal */}
        <div style={{ padding: "20px 24px" }}>
          {/* Info pelanggan */}
          <div
            style={{
              background: "#FDF8F5",
              border: "1px solid #F0D9E0",
              borderRadius: "8px",
              padding: "0 16px",
              marginBottom: "14px",
            }}
          >
            <InfoRow label="Nama"     value={booking.customer_name} />
            <InfoRow label="WhatsApp" value={booking.phone_number}  />
            <InfoRow label="Jadwal"   value={`${date} · ${time} WIB`} accent />
          </div>

          {/* Info layanan */}
          <div
            style={{
              background: "#FDF8F5",
              border: "1px solid #F0D9E0",
              borderRadius: "8px",
              padding: "0 16px",
              marginBottom: "14px",
            }}
          >
            <InfoRow label="Layanan" value={booking.services} />
            <InfoRow label="Total"   value={formatRupiah(booking.total_amount)} accent />
            <InfoRow
              label="Pembayaran"
              value={booking.payment_method === "cash" ? "💵 Cash" : "💳 Payment Gateway"}
            />
            {booking.transaction_id && (
              <InfoRow label="ID Transaksi" value={`#${booking.transaction_id}`} />
            )}
          </div>

          {/* Action buttons */}
          {booking.status === "pending" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={loading}
                onClick={() => onStatusChange(booking.id, "diterima")}
                style={{
                  flex: 1,
                  background: loading ? "rgba(42,140,90,0.06)" : "rgba(42,140,90,0.1)",
                  border: "1px solid rgba(42,140,90,0.3)",
                  color: "#1A7A4A",
                  padding: "12px",
                  borderRadius: "8px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "rgba(42,140,90,0.18)";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "rgba(42,140,90,0.1)";
                }}
              >
                ✓ Terima Booking
              </button>
              <button
                disabled={loading}
                onClick={() => onStatusChange(booking.id, "ditolak")}
                style={{
                  flex: 1,
                  background: loading ? "rgba(217,64,96,0.05)" : "rgba(217,64,96,0.08)",
                  border: "1px solid rgba(217,64,96,0.25)",
                  color: "#D94060",
                  padding: "12px",
                  borderRadius: "8px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "rgba(217,64,96,0.15)";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "rgba(217,64,96,0.08)";
                }}
              >
                ✕ Tolak Booking
              </button>
            </div>
          )}

          {booking.status === "diterima" && (
            <button
              disabled={loading}
              onClick={() => onStatusChange(booking.id, "ditolak")}
              style={{
                background: "rgba(150,100,120,0.08)",
                border: "1px solid rgba(150,100,120,0.2)",
                color: "#806070",
                padding: "10px 18px",
                borderRadius: "8px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              Batalkan Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-komponen: MiniStat ─────────────────────────────────────────────────

function MiniStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="admin-card" style={{ padding: "16px 20px" }}>
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.6rem",
          fontWeight: 700,
          color,
          lineHeight: 1,
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "#B08090" }}>{label}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminBookingsClient() {
  const [bookings, setBookings]         = useState<BookingRow[]>(MOCK_BOOKINGS);
  const [filter, setFilter]             = useState<StatusKey | "all">("all");
  const [search, setSearch]             = useState("");
  const [selectedBooking, setSelected]  = useState<BookingRow | null>(null);
  const [actionLoading, setLoading]     = useState(false);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [page, setPage]                 = useState(1);

  // Filter + search
  const filtered = bookings.filter((b) => {
    const statusMatch = filter === "all" || b.status === filter;
    const searchMatch =
      !search ||
      b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      b.services.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const paginated  = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const totalPages = Math.ceil(filtered.length / LIMIT);

  // Stats
  const stats = {
    total:    bookings.length,
    pending:  bookings.filter((b) => b.status === "pending").length,
    diterima: bookings.filter((b) => b.status === "diterima").length,
    revenue:  bookings.filter((b) => b.status === "diterima").reduce((s, b) => s + b.total_amount, 0),
  };

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  async function handleStatusChange(id: number, status: BookingStatusDB) {
    setLoading(true);
    try {
      // TODO: await updateBookingStatus(id, status);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      setSelected(null);
      showToast(
        status === "diterima" ? "Booking berhasil diterima!" : "Status booking diperbarui.",
        status === "diterima"
      );
    } catch {
      showToast("Gagal mengubah status.", false);
    } finally {
      setLoading(false);
    }
  }

  // Reset page saat filter/search berubah
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
            background: toast.ok ? "rgba(42,140,90,0.1)" : "rgba(217,64,96,0.1)",
            border: `1px solid ${toast.ok ? "rgba(42,140,90,0.3)" : "rgba(217,64,96,0.3)"}`,
            color: toast.ok ? "#1A7A4A" : "#D94060",
            padding: "12px 20px",
            borderRadius: "8px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(196,114,142,0.15)",
            animation: "slideDown 0.2s ease",
          }}
        >
          {toast.ok ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#7A2848",
              marginBottom: "4px",
            }}
          >
            Manajemen Booking
          </h1>
          <p style={{ fontSize: "14px", color: "#B06080" }}>
            Kelola semua reservasi layanan salon
          </p>
        </div>
        <button className="btn-action-gold">↓ Export CSV</button>
      </div>

      {/* Mini stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <MiniStat label="Total Booking"         value={stats.total}              color="#7A2848" />
        <MiniStat label="Menunggu Konfirmasi"    value={stats.pending}            color="#A07010" />
        <MiniStat label="Booking Diterima"       value={stats.diterima}           color="#1A7A4A" />
        <MiniStat label="Total Pendapatan"       value={formatRupiah(stats.revenue)} color="#C4728E" />
      </div>

      {/* Filter + Search */}
      <div className="admin-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#B08090", pointerEvents: "none" }}>
            🔍
          </span>
          <input
            className="search-input"
            placeholder="Cari nama pelanggan atau layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
          {FILTER_TABS.map(({ key, label }) => {
            const count = key === "all"
              ? bookings.length
              : bookings.filter((b) => b.status === key).length;
            return (
              <button
                key={key}
                className={`filter-btn${filter === key ? " active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span
                  style={{
                    marginLeft: "5px",
                    background: filter === key ? "rgba(255,255,255,0.25)" : "#F0D9E0",
                    color: filter === key ? "white" : "#B08090",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "0 5px",
                    borderRadius: "10px",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabel */}
      <div className="admin-card" style={{ overflow: "hidden" }}>

        {/* Info hasil */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #F0D9E0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#FDF8F5",
          }}
        >
          <span style={{ fontSize: "13px", color: "#B08090" }}>
            Menampilkan {paginated.length} dari {filtered.length} booking
          </span>
          {filter === "pending" && stats.pending > 0 && (
            <span style={{ fontSize: "13px", color: "#A07010", fontWeight: 500 }}>
              ⚡ {stats.pending} menunggu konfirmasimu
            </span>
          )}
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
          <span>#</span>
          <span>Pelanggan</span>
          <span>Jadwal</span>
          <span>Layanan</span>
          <span>Status</span>
          <span>Total</span>
          <span>Bayar</span>
          <span />
        </div>

        {/* Data rows */}
        {paginated.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" as const, color: "#B08090", fontSize: "14px" }}>
            Tidak ada data untuk filter ini
          </div>
        ) : (
          paginated.map((b) => {
            const { date, time } = formatDateTime(b.booking_datetime);
            return (
              <div
                key={b.id}
                className="table-row"
                style={{ gridTemplateColumns: COL, cursor: "pointer" }}
                onClick={() => setSelected(b)}
              >
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#B08090" }}>
                  {b.id}
                </span>

                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#3A1A28", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.customer_name}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#B08090" }}>
                    {b.phone_number}
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#8A4060" }}>
                    {date}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#C4728E", fontWeight: 600 }}>
                    {time}
                  </div>
                </div>

                <span style={{ fontSize: "13px", color: "#8A4060", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {b.services}
                </span>

                <StatusBadge status={b.status as StatusKey} />

                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#C9922A", fontWeight: 600 }}>
                  {formatRupiah(b.total_amount)}
                </span>

                <span style={{ fontSize: "12px", color: "#B08090" }}>
                  {b.payment_method === "cash" ? "Cash" : "GW"}
                </span>

                {/* Quick approve button */}
                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", justifyContent: "center" }}>
                  {b.status === "pending" ? (
                    <button
                      title="Terima booking"
                      onClick={() => handleStatusChange(b.id, "diterima")}
                      style={{
                        background: "rgba(42,140,90,0.1)",
                        border: "1px solid rgba(42,140,90,0.3)",
                        color: "#1A7A4A",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,140,90,0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(42,140,90,0.1)")}
                    >
                      ✓
                    </button>
                  ) : (
                    <span style={{ fontSize: "14px", color: "#D4B8C0" }}>—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={{
              background: "white",
              border: "1px solid #E8C0D0",
              color: page === 1 ? "#D4B8C0" : "#8A4060",
              padding: "7px 16px",
              borderRadius: "8px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              cursor: page === 1 ? "not-allowed" : "pointer",
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
                background: p === page ? "#C4728E" : "white",
                border: `1px solid ${p === page ? "#C4728E" : "#E8C0D0"}`,
                color: p === page ? "white" : "#8A4060",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                fontWeight: p === page ? 600 : 400,
                cursor: "pointer",
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
              background: "white",
              border: "1px solid #E8C0D0",
              color: page === totalPages ? "#D4B8C0" : "#8A4060",
              padding: "7px 16px",
              borderRadius: "8px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              cursor: page === totalPages ? "not-allowed" : "pointer",
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
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          loading={actionLoading}
        />
      )}
    </div>
  );
}