"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/ui/DataTable";
import { updateBookingStatus, getBookingsForAdmin } from "@/actions/booking";
import type { BookingStatusDB, BookingRow } from "@/actions/booking";
import { useAdminCache } from "@/context/AdminCacheContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

type StatusConfig = { label: string; bg: string; color: string; dot: string };

const STATUS_CONFIG: Record<BookingStatusDB, StatusConfig> = {
  pending: {
    label: "Pending",
    bg: "rgba(201,146,42,0.12)",
    color: "#A07010",
    dot: "#C9922A",
  },
  confirmed: {
    label: "Diterima",
    bg: "rgba(90,158,122,0.12)",
    color: "#3D7A5A",
    dot: "#5A9E7A",
  },
  rejected: {
    label: "Ditolak",
    bg: "rgba(192,80,96,0.12)",
    color: "#C05060",
    dot: "#C05060",
  },
  cancelled: {
    label: "Cancelled",
    bg: "rgba(150,120,110,0.12)",
    color: "#7A5C50",
    dot: "#B09080",
  },
  completed: {
    label: "Completed",
    bg: "rgba(79,70,229,0.12)",
    color: "#4F46E5",
    dot: "#6366F1",
  },
};

const FILTER_TABS: { key: BookingStatusDB | "ALL"; label: string }[] = [
  { key: "ALL", label: "Semua" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Diterima" },
  { key: "rejected", label: "Ditolak" },
  { key: "cancelled", label: "Cancelled" },
  { key: "completed", label: "Completed" },
];

// ── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatusDB }) {
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
        borderRadius: "6px",
        letterSpacing: "0.04em",
        fontFamily: "'DM Sans', sans-serif",
        whiteSpace: "nowrap",
      }}>
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

// ── InfoRow ──────────────────────────────────────────────────────────────────

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
        fontSize: "0.82rem",
      }}>
      <span style={{ color: "#B09080", flexShrink: 0 }}>{label}</span>
      <span
        style={{
          color: accent ? "#C4788A" : "#2C1A0E",
          fontWeight: accent ? 600 : 500,
          fontFamily: accent ? "'DM Mono', monospace" : "inherit",
          textAlign: "right",
        }}>
        {value}
      </span>
    </div>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  booking,
  onClose,
  onStatusChange,
  loading,
  rejectReason,
  setRejectReason,
  rejectError,
  setRejectError,
  onEdit,
}: {
  booking: BookingRow;
  onClose: () => void;
  onStatusChange: (
    id: number,
    status: BookingStatusDB,
    reason?: string,
    confirmPayment?: boolean,
  ) => void;
  loading: boolean;
  rejectReason: string;
  setRejectReason: (val: string) => void;
  rejectError: string;
  setRejectError: (val: string) => void;
  onEdit: (booking: BookingRow) => void;
}) {
  const dt = new Date(booking.booking_datetime);
  const jadwal =
    dt.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) +
    " · " +
    dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
    " WIB";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(44,26,14,0.35)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        overflowY: "auto",
      }}
      onClick={onClose}>
      <div
        style={{
          background: "white",
          border: "1px solid #F0E0E6",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "500px",
          overflowY: "auto",
          maxHeight: "90vh",
          boxShadow: "0 24px 64px rgba(196,120,138,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F0E0E6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background: "linear-gradient(135deg, #FDF8F3, #FDF0F4)",
          }}>
          <div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#2C1A0E",
                marginBottom: "6px",
              }}>
              Detail Booking #{booking.id}
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(196,120,138,0.08)",
              border: "1px solid #F0E0E6",
              color: "#C4788A",
              cursor: "pointer",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(196,120,138,0.16)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(196,120,138,0.08)")
            }>
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}>
          {/* Info pelanggan */}
          <div
            style={{
              background: "#FDFAF7",
              border: "1px solid #F0E0E6",
              borderRadius: "10px",
              padding: "14px 16px",
            }}>
            <div
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                color: "#C4788A",
                textTransform: "uppercase",
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: "10px",
                fontWeight: 600,
              }}>
              ✦ Info Pelanggan
            </div>
            <InfoRow label="Nama" value={booking.customer_name} />
            <InfoRow label="Email" value={booking.phone_number} />
            <InfoRow label="Jadwal" value={jadwal} accent />
          </div>

          {/* Detail layanan */}
          <div
            style={{
              background: "#FDFAF7",
              border: "1px solid #F0E0E6",
              borderRadius: "10px",
              padding: "14px 16px",
            }}>
            <div
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                color: "#C4788A",
                textTransform: "uppercase",
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: "10px",
                fontWeight: 600,
              }}>
              ✦ Layanan & Pembayaran
            </div>
            <InfoRow label="Layanan" value={booking.services} />
            <InfoRow
              label="Total"
              value={formatRupiah(booking.total_amount)}
              accent
            />
            {booking.transaction_id && (
              <InfoRow
                label="ID Transaksi"
                value={`#${booking.transaction_id}`}
              />
            )}
            {booking.payment_proof_sent && booking.payment_proof_url && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "0.82rem" }}>
                <span style={{ color: "#B09080" }}>Bukti Transfer:</span>
                <a
                  href={`${backendUrl}${booking.payment_proof_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#C9922A",
                    fontWeight: 600,
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  👁️ Lihat Bukti Pembayaran
                </a>
              </div>
            )}
          </div>

          {/* Action — PENDING */}
          {booking.status === "pending" && (
            <>
              <div style={{ background: "rgba(201,146,42,0.06)", border: "1px solid rgba(201,146,42,0.2)", borderRadius: "8px", padding: "10px 12px", fontSize: "0.78rem", color: "#8B6A5A" }}>
                Metode Bayar: <strong style={{ color: "#2C1A0E" }}>{booking.payment_method?.toUpperCase()}</strong>
              </div>

              <textarea
                placeholder="Masukkan alasan penolakan (opsional jika menolak)..."
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                style={{
                  width: "100%",
                  marginTop: "6px",
                  padding: "10px",
                  border: `1px solid ${rejectError ? "#C05060" : "#F0E0E6"}`,
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                }}
              />
              {rejectError && (
                <div style={{ color: "#C05060", fontSize: "0.7rem", marginTop: "4px", fontWeight: 500 }}>
                  {rejectError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  disabled={loading}
                  onClick={() => onStatusChange(booking.id, "confirmed", undefined, true)}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #1A7A4A, #3D7A5A)",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: "8px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(26,122,74,0.25)",
                    transition: "all 0.2s",
                  }}
                >
                  🟢 Terima & Konfirmasi Pembayaran (Lunas)
                </button>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    disabled={loading}
                    onClick={() => onStatusChange(booking.id, "confirmed", undefined, false)}
                    style={{
                      flex: 1,
                      background: "rgba(201,146,42,0.1)",
                      border: "1.5px solid rgba(201,146,42,0.4)",
                      color: "#A07010",
                      padding: "10px",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                      borderRadius: "8px",
                    }}
                  >
                    🟡 Terima Saja (Bayar di Salon)
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => {
                      if (!rejectReason.trim()) {
                        setRejectError("Alasan penolakan wajib diisi.");
                        return;
                      }
                      onStatusChange(booking.id, "rejected", rejectReason);
                    }}
                    style={{
                      flex: 1,
                      background: "rgba(192,80,96,0.08)",
                      border: "1.5px solid rgba(192,80,96,0.3)",
                      color: "#C05060",
                      padding: "10px",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                      borderRadius: "8px",
                    }}
                  >
                    🔴 Tolak Booking
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Action — DITERIMA: bisa batalkan atau tandai selesai */}
          {booking.status === "confirmed" && (
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button
                disabled={loading}
                onClick={() => onStatusChange(booking.id, "completed")}
                style={{
                  flex: 1,
                  background: "rgba(42,140,90,0.08)",
                  border: "1px solid rgba(42,140,90,0.2)",
                  color: "#1A7A4A",
                  padding: "10px 18px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading)
                    e.currentTarget.style.background = "rgba(42,140,90,0.15)";
                }}
                onMouseLeave={(e) => {
                  if (!loading)
                    e.currentTarget.style.background = "rgba(42,140,90,0.08)";
                }}
              >
                ✓ Selesaikan Booking
              </button>
              <button
                disabled={loading}
                onClick={() => onStatusChange(booking.id, "cancelled")}
                style={{
                  background: "rgba(150,120,110,0.08)",
                  border: "1px solid #F0E0E6",
                  color: "#7A5C50",
                  padding: "10px 18px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
              >
                Batalkan
              </button>
            </div>
          )}

          {/* Admin Edit Button */}
          {new Date(booking.booking_datetime) >= new Date() && (
            <button
              disabled={loading}
              onClick={() => onEdit(booking)}
              style={{
                width: "100%",
                marginTop: "12px",
                background: "white",
                border: "1.5px solid #6B3A2A",
                color: "#6B3A2A",
                padding: "11px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                borderRadius: "10px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#6B3A2A";
                  e.currentTarget.style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#6B3A2A";
                }
              }}
            >
              ✏️ Edit Booking (Jadwal / Harga)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MiniStat ─────────────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #F0E0E6",
        borderRadius: "12px",
        padding: "16px 20px",
        flex: 1,
        minWidth: "130px",
        boxShadow: "0 1px 4px rgba(196,120,138,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}>
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          flexShrink: 0,
        }}>
        {icon}
      </div>
      <div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.4rem",
            fontWeight: 700,
            color,
            lineHeight: 1,
            marginBottom: "3px",
          }}>
          {value}
        </div>
        <div style={{ fontSize: "0.68rem", color: "#B09080", fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AdminBookingsClient({ backendUrl }: { backendUrl: string }) {
  const { getCache, setCache, invalidateCache, setRevalidating, revalidatingKeys } = useAdminCache();
  const [filter, setFilter] = useState<BookingStatusDB | "ALL">("ALL");
  const cacheKey = `admin_bookings_${filter}`;

  type CacheData = { rows: BookingRow[]; total: number; stats: { total: number; pending: number; diterima: number; revenue: number } };

  const [bookings, setBookings] = useState<BookingRow[]>(() => getCache<CacheData>(cacheKey)?.rows ?? []);
  const [loading, setLoading] = useState(!getCache<CacheData>(cacheKey));
  const [selectedBooking, setSelected] = useState<BookingRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const [editingBooking, setEditingBooking] = useState<BookingRow | null>(null);
  const [bookingEditDate, setBookingEditDate] = useState<string>("");
  const [bookingEditTime, setBookingEditTime] = useState<string>("");
  const [bookingEditPrice, setBookingEditPrice] = useState<number>(0);
  const [bookingAvailableSlots, setBookingAvailableSlots] = useState<string[]>([]);
  const [savingBooking, setSavingBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [hasVariablePriceService, setHasVariablePriceService] = useState(false);

  const [stats, setStats] = useState(() => getCache<CacheData>(cacheKey)?.stats ?? {
    total: 0,
    pending: 0,
    diterima: 0,
    revenue: 0,
  });

  // Load initial edit values when editingBooking changes
  useEffect(() => {
    if (editingBooking) {
      const bDate = new Date(editingBooking.booking_datetime);
      const dateStr = bDate.getFullYear() + '-' + String(bDate.getMonth() + 1).padStart(2, '0') + '-' + String(bDate.getDate()).padStart(2, '0');
      const timeStr = String(bDate.getHours()).padStart(2, '0') + ":" + String(bDate.getMinutes()).padStart(2, '0');
      setBookingEditDate(dateStr);
      setBookingEditTime(timeStr);
      setBookingEditPrice(Number(editingBooking.total_amount));
      setHasVariablePriceService(false);

      fetch(`/api/bookings/${editingBooking.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.details) {
            const hasVar = data.details.some((d: { is_price_variable?: boolean }) => d.is_price_variable);
            setHasVariablePriceService(hasVar);
          }
        })
        .catch(err => console.error("Error loading booking details for edit:", err));
    } else {
      setBookingAvailableSlots([]);
    }
  }, [editingBooking]);

  // Fetch available slots when editing date changes
  useEffect(() => {
    if (editingBooking && bookingEditDate) {
      fetch(`/api/bookings/slots?date=${bookingEditDate}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.available) {
            setBookingAvailableSlots(data.available);
          }
        })
        .catch(err => console.error("Error fetching slots:", err));
    }
  }, [editingBooking, bookingEditDate]);

  const handleSaveBookingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setSavingBooking(true);
    setBookingError("");

    const datetimeStr = `${bookingEditDate}T${bookingEditTime}:00`;

    try {
      const payload: { booking_datetime: string; total_amount?: number } = {
        booking_datetime: datetimeStr,
      };
      if (hasVariablePriceService) {
        payload.total_amount = bookingEditPrice;
      }

      const response = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setBookingError(data.error || "Gagal memperbarui booking.");
      } else {
        setEditingBooking(null);
        setSelected(null);
        fetchData();
        showToast("Booking berhasil diperbarui.", true);
      }
    } catch (err) {
      console.error(err);
      setBookingError("Terjadi kesalahan koneksi.");
    } finally {
      setSavingBooking(false);
    }
  };

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch data dengan SWR Caching
  const fetchData = useCallback(async () => {
    const key = `admin_bookings_${filter}`;
    const cached = getCache<CacheData>(key);
    if (cached) {
      setBookings(cached.rows);
      if (cached.stats) setStats(cached.stats);
      setLoading(false);
      setRevalidating(key, true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getBookingsForAdmin({
        status: filter,
        limit: 0,
      });
      if (result.success && result.data) {
        setBookings(result.data.rows);
        if (result.data.stats) {
          setStats(result.data.stats);
        }
        setCache(key, result.data);
      }
    } catch {
      showToast("Gagal memuat data.", false);
    } finally {
      setLoading(false);
      setRevalidating(key, false);
    }
  }, [filter, getCache, setCache, setRevalidating, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(
    id: number,
    status: BookingStatusDB,
    reason?: string,
    confirmPayment?: boolean,
  ) {
    setActionLoading(true);
    try {
      const result = await updateBookingStatus(id, status, reason, confirmPayment);
      if (result.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b)),
        );
        setSelected(null);
        showToast(
          status === "confirmed" && confirmPayment
            ? "Booking & Pembayaran berhasil dikonfirmasi LUNAS! Invoice WA dikirim."
            : status === "confirmed"
            ? "Booking berhasil diterima!"
            : status === "completed"
            ? "Booking ditandai selesai!"
            : "Status booking diperbarui.",
          status === "confirmed" || status === "completed",
        );
        invalidateCache("admin_payments");
        fetchData();
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
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "72px",
            right: "24px",
            zIndex: 2000,
            background: "white",
            border: `1.5px solid ${toast.ok ? "rgba(90,158,122,0.5)" : "rgba(192,80,96,0.5)"}`,
            color: toast.ok ? "#3D7A5A" : "#C05060",
            padding: "12px 20px",
            borderRadius: "10px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.82rem",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(196,120,138,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#2C1A0E",
              marginBottom: "4px",
            }}>
            Manajemen Booking
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#B09080" }}>
            Kelola semua reservasi layanan salon
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="btn-action"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Mini stats */}
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <MiniStat
          label="Total Booking"
          value={stats.total}
          color="#2C1A0E"
          icon="📋"
        />
        <MiniStat
          label="Menunggu Konfirmasi"
          value={stats.pending}
          color="#C9922A"
          icon="⏳"
        />
        <MiniStat
          label="Booking Diterima"
          value={stats.diterima}
          color="#5A9E7A"
          icon="✅"
        />
        <MiniStat
          label="Total Pendapatan"
          value={formatRupiah(stats.revenue)}
          color="#C4788A"
          icon="💰"
        />
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          background: "white",
          border: "1px solid #F0E0E6",
          borderRadius: "12px",
          padding: "12px 18px",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          boxShadow: "0 1px 4px rgba(196,120,138,0.06)",
        }}>
        {FILTER_TABS.map(({ key, label }: { key: BookingStatusDB | "ALL"; label: string }) => (
          <button
            key={key}
            className={`filter-btn${filter === key ? " active" : ""}`}
            onClick={() => setFilter(key as BookingStatusDB | "ALL")}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Instant DataTables Component */}
      <DataTable
        data={bookings}
        loading={loading}
        onRefresh={fetchData}
        isRevalidating={revalidatingKeys.has(cacheKey)}
        searchPlaceholder="Cari nama pelanggan, nomor telp, atau layanan..."
        searchableKeys={["customer_name", "phone_number", "services", "id"]}
        emptyMessage="Tidak ada data booking yang ditemukan 🌸"
        columns={[
          {
            key: "id",
            header: "ID",
            sortable: true,
            width: "60px",
            render: (b) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#B09080" }}>#{b.id}</span>,
          },
          {
            key: "customer_name",
            header: "Pelanggan",
            sortable: true,
            render: (b) => (
              <div>
                <div style={{ fontWeight: 600, color: "#2C1A0E" }}>{b.customer_name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "#B09080" }}>{b.phone_number}</div>
              </div>
            ),
          },
          {
            key: "booking_datetime",
            header: "Jadwal",
            sortable: true,
            sortValue: (b) => new Date(b.booking_datetime).getTime(),
            render: (b) => {
              const dt = new Date(b.booking_datetime);
              return (
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#7A5C50" }}>
                    {dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#C4788A", fontWeight: 600 }}>
                    {dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                  </div>
                </div>
              );
            },
          },
          {
            key: "services",
            header: "Layanan",
            sortable: true,
            render: (b) => <span style={{ fontSize: "0.78rem", color: "#7A5C50" }}>{b.services}</span>,
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            render: (b) => <StatusBadge status={b.status} />,
          },
          {
            key: "total_amount",
            header: "Total",
            sortable: true,
            sortValue: (b) => Number(b.total_amount),
            render: (b) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#C4788A", fontWeight: 600 }}>{formatRupiah(Number(b.total_amount))}</span>,
          },
          {
            key: "action",
            header: "Aksi",
            align: "center",
            render: (b) => (
              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                {b.status === "pending" && (
                  <>
                    <button
                      title="Terima booking"
                      onClick={() => handleStatusChange(b.id, "confirmed")}
                      style={{ background: "rgba(90,158,122,0.1)", border: "1px solid rgba(90,158,122,0.3)", color: "#3D7A5A", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer" }}
                    >
                      ✓ Terima
                    </button>
                    <button
                      title="Tolak booking"
                      onClick={() => {
                        setSelected(b); // buka modal supaya isi alasan
                      }}
                      style={{
                        background: "rgba(192,80,96,0.1)",
                        border: "1px solid rgba(192,80,96,0.3)",
                        color: "#C05060",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}>
                      ✕
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelected(b)}
                  style={{ background: "transparent", border: "1px solid #F0E0E6", color: "#C4788A", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer" }}
                >
                  Detail
                </button>
              </div>
            ),
          },
        ]}
      />

      {/* Detail Modal */}
      {selectedBooking && (
        <DetailModal
          booking={selectedBooking}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          loading={actionLoading}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          rejectError={rejectError}
          setRejectError={setRejectError}
          onEdit={setEditingBooking}
        />
      )}

      {/* Admin Edit Booking Modal */}
      {editingBooking && (() => {
        const currentBookingTime = new Date(editingBooking.booking_datetime).toTimeString().substring(0, 5);
        const slotsToDisplay = [...bookingAvailableSlots];
        if (currentBookingTime && !slotsToDisplay.includes(currentBookingTime)) {
          slotsToDisplay.push(currentBookingTime);
        }
        slotsToDisplay.sort();

        return (
          <div
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(44, 26, 14, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              padding: "20px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                background: "white",
                border: "1px solid #EDD8CC",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "460px",
                boxShadow: "0 24px 48px rgba(107, 58, 42, 0.15)",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: "#6B3A2A", margin: 0 }}>
                  Edit Booking #{editingBooking.id} (Admin)
                </h3>
                <button
                  onClick={() => setEditingBooking(null)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#8B6A5A" }}
                >
                  ✕
                </button>
              </div>

              {bookingError && (
                <div style={{ background: "#FDF2F2", border: "1px solid #F8B4B4", color: "#C81E1E", borderRadius: "8px", padding: "12px", fontSize: "0.8rem", fontWeight: 500 }}>
                  ⚠️ {bookingError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B3A2A" }}>Tanggal Booking</label>
                <input
                  type="date"
                  value={bookingEditDate}
                  onChange={(e) => setBookingEditDate(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #EDD8CC", fontSize: "0.85rem", color: "#2C1A0E", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B3A2A" }}>Pilih Jam Slot</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "8px", maxHeight: "120px", overflowY: "auto", padding: "4px" }}>
                  {slotsToDisplay.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setBookingEditTime(slot)}
                      style={{
                        padding: "6px 4px",
                        borderRadius: "6px",
                        border: bookingEditTime === slot ? "1px solid #6B3A2A" : "1px solid #EDD8CC",
                        background: bookingEditTime === slot ? "#6B3A2A" : "white",
                        color: bookingEditTime === slot ? "white" : "#6B3A2A",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {hasVariablePriceService && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B3A2A" }}>Harga Akhir (Variabel)</label>
                  <input
                    type="number"
                    value={bookingEditPrice}
                    onChange={(e) => setBookingEditPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #EDD8CC", fontSize: "0.85rem", color: "#2C1A0E", fontFamily: "inherit" }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "#A87C66" }}>
                    *Harga dapat diubah karena booking ini mengandung layanan bertarif variabel.
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #EDD8CC", background: "white", color: "#8B6A5A", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingBooking || !bookingEditTime}
                  onClick={handleSaveBookingEdit}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#6B3A2A",
                    color: "white",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: savingBooking ? "not-allowed" : "pointer",
                    opacity: savingBooking ? 0.7 : 1,
                  }}
                >
                  {savingBooking ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
