"use client";

import { useState, useEffect, useCallback } from "react";
import { updateBookingStatus, getBookingsForAdmin } from "@/actions/booking";
import type { BookingStatusDB, BookingRow } from "@/actions/booking";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

// ── Status config — sesuai enum DB (uppercase) ────────────────────────────────

type StatusConfig = { label: string; bg: string; color: string; dot: string };

const STATUS_CONFIG: Record<BookingStatusDB, StatusConfig> = {
  PENDING:   { label: "Pending",   bg: "rgba(201,146,42,0.12)",  color: "#A07010", dot: "#C9922A" },
  DITERIMA:  { label: "Diterima",  bg: "rgba(90,158,122,0.12)",  color: "#3D7A5A", dot: "#5A9E7A" },
  DITOLAK:   { label: "Ditolak",   bg: "rgba(192,80,96,0.12)",   color: "#C05060", dot: "#C05060" },
  CANCELLED: { label: "Cancelled", bg: "rgba(150,120,110,0.12)", color: "#7A5C50", dot: "#B09080" },
};

const FILTER_TABS: { key: BookingStatusDB | "ALL"; label: string }[] = [
  { key: "ALL",      label: "Semua"    },
  { key: "PENDING",  label: "Pending"  },
  { key: "DITERIMA", label: "Diterima" },
  { key: "DITOLAK",  label: "Ditolak"  },
  { key: "CANCELLED",label: "Cancelled"},
];

const LIMIT = 10;
const COL   = "56px 1fr 110px 160px 100px 90px 80px 44px";

// ── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatusDB }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.CANCELLED;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      background: cfg.bg,
      color: cfg.color,
      fontSize: "0.68rem",
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: "6px",
      letterSpacing: "0.04em",
      fontFamily: "'DM Sans', sans-serif",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px", marginBottom: "8px", fontSize: "0.82rem" }}>
      <span style={{ color: "#B09080", flexShrink: 0 }}>{label}</span>
      <span style={{
        color: accent ? "#C4788A" : "#2C1A0E",
        fontWeight: accent ? 600 : 500,
        fontFamily: accent ? "'DM Mono', monospace" : "inherit",
        textAlign: "right",
      }}>{value}</span>
    </div>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  booking, onClose, onStatusChange, loading,
}: {
  booking: BookingRow;
  onClose: () => void;
  onStatusChange: (id: number, status: BookingStatusDB) => void;
  loading: boolean;
}) {
  const dt = new Date(booking.booking_datetime);
  const jadwal = dt.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    + " · " + dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,0.35)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "16px", width: "100%", maxWidth: "500px", overflow: "hidden", boxShadow: "0 24px 64px rgba(196,120,138,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0E0E6", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "linear-gradient(135deg, #FDF8F3, #FDF0F4)" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>
              Detail Booking #{booking.id}
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(196,120,138,0.08)", border: "1px solid #F0E0E6", color: "#C4788A", cursor: "pointer", width: "32px", height: "32px", borderRadius: "8px", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(196,120,138,0.16)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(196,120,138,0.08)")}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Info pelanggan */}
          <div style={{ background: "#FDFAF7", border: "1px solid #F0E0E6", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.18em", color: "#C4788A", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: "10px", fontWeight: 600 }}>
              ✦ Info Pelanggan
            </div>
            <InfoRow label="Nama"   value={booking.customer_name} />
            <InfoRow label="Email"  value={booking.phone_number} />
            <InfoRow label="Jadwal" value={jadwal} accent />
          </div>

          {/* Detail layanan */}
          <div style={{ background: "#FDFAF7", border: "1px solid #F0E0E6", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.18em", color: "#C4788A", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: "10px", fontWeight: 600 }}>
              ✦ Layanan & Pembayaran
            </div>
            <InfoRow label="Layanan"    value={booking.services} />
            <InfoRow label="Total"      value={formatRupiah(booking.total_amount)} accent />
            <InfoRow label="Metode"     value={booking.payment_method === "cash" ? "Bayar di Tempat" : "Payment Gateway"} />
            {booking.transaction_id && (
              <InfoRow label="ID Transaksi" value={`#${booking.transaction_id}`} />
            )}
          </div>

          {/* Action — PENDING */}
          {booking.status === "PENDING" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={loading}
                onClick={() => onStatusChange(booking.id, "DITERIMA")}
                style={{ flex: 1, background: "rgba(90,158,122,0.1)", border: "1.5px solid rgba(90,158,122,0.4)", color: "#3D7A5A", padding: "11px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", borderRadius: "10px", transition: "all 0.2s" }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "rgba(90,158,122,0.18)"; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "rgba(90,158,122,0.1)"; }}
              >✓ Terima Booking</button>
              <button
                disabled={loading}
                onClick={() => onStatusChange(booking.id, "DITOLAK")}
                style={{ flex: 1, background: "rgba(192,80,96,0.08)", border: "1.5px solid rgba(192,80,96,0.3)", color: "#C05060", padding: "11px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", borderRadius: "10px", transition: "all 0.2s" }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "rgba(192,80,96,0.15)"; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "rgba(192,80,96,0.08)"; }}
              >✕ Tolak Booking</button>
            </div>
          )}

          {/* Action — DITERIMA: bisa batalkan */}
          {booking.status === "DITERIMA" && (
            <button
              disabled={loading}
              onClick={() => onStatusChange(booking.id, "CANCELLED")}
              style={{ background: "rgba(150,120,110,0.08)", border: "1px solid #F0E0E6", color: "#7A5C50", padding: "10px 18px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", borderRadius: "8px", transition: "all 0.2s" }}
            >Batalkan Booking</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MiniStat ─────────────────────────────────────────────────────────────────

function MiniStat({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: string }) {
  return (
    <div style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "12px", padding: "16px 20px", flex: 1, minWidth: "130px", boxShadow: "0 1px 4px rgba(196,120,138,0.06)", display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color, lineHeight: 1, marginBottom: "3px" }}>{value}</div>
        <div style={{ fontSize: "0.68rem", color: "#B09080", fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AdminBookingsClient() {
  const [bookings, setBookings]           = useState<BookingRow[]>([]);
  const [total, setTotal]                 = useState(0);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState<BookingStatusDB | "ALL">("ALL");
  const [search, setSearch]               = useState("");
  const [page, setPage]                   = useState(1);
  const [selectedBooking, setSelected]    = useState<BookingRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null);

  const totalPages = Math.ceil(total / LIMIT);

  // Stats dihitung dari data yang sudah di-fetch
  const stats = {
    total:    total,
    pending:  bookings.filter((b) => b.status === "PENDING").length,
    diterima: bookings.filter((b) => b.status === "DITERIMA").length,
    revenue:  bookings.filter((b) => b.status === "DITERIMA").reduce((s, b) => s + b.total_amount, 0),
  };

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch data dari server action
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBookingsForAdmin({
        status: filter,
        search: search || undefined,
        page,
        limit: LIMIT,
      });
      if (result.success && result.data) {
        setBookings(result.data.rows);
        setTotal(result.data.total);
      }
    } catch {
      showToast("Gagal memuat data.", false);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [filter, search]);

  async function handleStatusChange(id: number, status: BookingStatusDB) {
    setActionLoading(true);
    try {
      const result = await updateBookingStatus(id, status);
      if (result.success) {
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
        setSelected(null);
        showToast(
          status === "DITERIMA" ? "Booking berhasil diterima!" : "Status booking diperbarui.",
          status === "DITERIMA"
        );
      } else {
        showToast(result.error ?? "Gagal mengubah status.", false);
      }
    } catch {
      showToast("Terjadi kesalahan.", false);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "72px", right: "24px", zIndex: 2000,
          background: "white",
          border: `1.5px solid ${toast.ok ? "rgba(90,158,122,0.5)" : "rgba(192,80,96,0.5)"}`,
          color: toast.ok ? "#3D7A5A" : "#C05060",
          padding: "12px 20px", borderRadius: "10px",
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600,
          boxShadow: "0 8px 24px rgba(196,120,138,0.15)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
            Manajemen Booking
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#B09080" }}>Kelola semua reservasi layanan salon</p>
        </div>
        <button
          onClick={fetchData}
          style={{ background: "rgba(196,120,138,0.08)", border: "1.5px solid rgba(196,120,138,0.3)", color: "#C4788A", padding: "9px 18px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", borderRadius: "10px", transition: "all 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(196,120,138,0.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(196,120,138,0.08)")}
        >
          ↺ Refresh
        </button>
      </div>

      {/* Mini stats */}
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <MiniStat label="Total Booking"       value={stats.total}               color="#2C1A0E" icon="📋" />
        <MiniStat label="Menunggu Konfirmasi" value={stats.pending}             color="#C9922A" icon="⏳" />
        <MiniStat label="Booking Diterima"    value={stats.diterima}            color="#5A9E7A" icon="✅" />
        <MiniStat label="Total Pendapatan"    value={formatRupiah(stats.revenue)} color="#C4788A" icon="💰" />
      </div>

      {/* Filter + Search */}
      <div style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "12px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 1px 4px rgba(196,120,138,0.06)" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#C4788A", fontSize: "0.9rem", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Cari nama pelanggan atau layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", background: "#FDFAF7", border: "1px solid #F0E0E6", borderRadius: "8px", padding: "9px 12px 9px 38px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "#2C1A0E", outline: "none", transition: "border-color 0.2s" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")}
          />
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`filter-btn${filter === key ? " active" : ""}`}
              onClick={() => setFilter(key as BookingStatusDB | "ALL")}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(196,120,138,0.06)" }}>

        {/* Info bar */}
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #F0E0E6", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FDFAF7" }}>
          <span style={{ fontSize: "0.72rem", color: "#B09080", fontFamily: "'DM Mono', monospace" }}>
            {loading ? "Memuat..." : `Menampilkan ${bookings.length} dari ${total} booking`}
          </span>
          {filter === "ALL" && stats.pending > 0 && (
            <span style={{ fontSize: "0.72rem", color: "#C9922A", fontWeight: 600 }}>
              ⚡ {stats.pending} booking menunggu konfirmasimu
            </span>
          )}
        </div>

        {/* Column headers */}
        <div className="table-row" style={{ gridTemplateColumns: COL, color: "#B09080", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 600, background: "white", borderBottom: "1px solid #F5EBF0" }}>
          <span>#</span>
          <span>Pelanggan</span>
          <span>Jadwal</span>
          <span>Layanan</span>
          <span>Status</span>
          <span>Total</span>
          <span>Bayar</span>
          <span />
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ padding: "48px", textAlign: "center", color: "#C4788A", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem" }}>
            Memuat data booking...
          </div>
        )}

        {/* Empty state */}
        {!loading && bookings.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "#B09080", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem" }}>
            Tidak ada data untuk filter ini 🌸
          </div>
        )}

        {/* Rows */}
        {!loading && bookings.map((b) => (
          <div
            key={b.id}
            className="table-row"
            style={{ gridTemplateColumns: COL, cursor: "pointer" }}
            onClick={() => setSelected(b)}
          >
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#B09080" }}>{b.id}</span>

            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2C1A0E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {b.customer_name}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "#B09080" }}>
                {b.phone_number}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#7A5C50" }}>
                {new Date(b.booking_datetime).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "#C4788A", fontWeight: 600 }}>
                {new Date(b.booking_datetime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            <span style={{ fontSize: "0.75rem", color: "#7A5C50", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {b.services}
            </span>

            <StatusBadge status={b.status} />

            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#C4788A", fontWeight: 600 }}>
              {formatRupiah(b.total_amount)}
            </span>

            <span style={{ fontSize: "0.68rem", color: "#B09080", fontFamily: "'DM Mono', monospace" }}>
              {b.payment_method === "cash" ? "Cash" : "GW"}
            </span>

            {/* Quick approve */}
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", justifyContent: "center" }}>
              {b.status === "PENDING" ? (
                <button
                  title="Terima booking"
                  onClick={() => handleStatusChange(b.id, "DITERIMA")}
                  style={{ background: "rgba(90,158,122,0.1)", border: "1px solid rgba(90,158,122,0.3)", color: "#3D7A5A", width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, transition: "all 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(90,158,122,0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(90,158,122,0.1)")}
                >✓</button>
              ) : (
                <span style={{ fontSize: "0.75rem", color: "#F0E0E6" }}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ background: "white", border: "1px solid #F0E0E6", color: page === 1 ? "#D4C4B8" : "#7A5C50", padding: "6px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 500, cursor: page === 1 ? "not-allowed" : "pointer", borderRadius: "8px" }}
          >← Prev</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{ background: p === page ? "#C4788A" : "white", border: `1px solid ${p === page ? "#C4788A" : "#F0E0E6"}`, color: p === page ? "white" : "#7A5C50", width: "34px", height: "34px", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", fontWeight: p === page ? 700 : 400, cursor: "pointer", borderRadius: "8px" }}
            >{p}</button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ background: "white", border: "1px solid #F0E0E6", color: page === totalPages ? "#D4C4B8" : "#7A5C50", padding: "6px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 500, cursor: page === totalPages ? "not-allowed" : "pointer", borderRadius: "8px" }}
          >Next →</button>
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