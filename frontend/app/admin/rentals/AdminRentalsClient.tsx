// app/admin/rentals/AdminRentalsClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import {
  getRentalsForAdmin,
  updateRentalStatus,
  syncLateRentals,
  type RentalRow,
  type RentalStatus,
} from "@/actions/rental";
import { useAdminCache } from "@/context/AdminCacheContext";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RentalStatus, { label: string; bg: string; color: string }> = {
  pending:      { label: "Menunggu",     bg: "rgba(201,146,42,0.12)",  color: "#A07010" },
  ongoing:      { label: "Dipinjam",     bg: "rgba(196,114,142,0.12)", color: "#C4728E" },
  terlambat:    { label: "Terlambat",    bg: "rgba(217,64,96,0.12)",   color: "#D94060" },
  done:         { label: "Selesai",      bg: "rgba(42,140,90,0.12)",   color: "#1A7A4A" },
  cancelled:    { label: "Dibatalkan",   bg: "rgba(150,100,120,0.12)", color: "#806070" },
};

const FILTER_TABS: { key: RentalStatus | "ALL"; label: string }[] = [
  { key: "ALL",         label: "Semua"     },
  { key: "pending",     label: "Menunggu"  },
  { key: "ongoing",     label: "Dipinjam"  },
  { key: "terlambat",   label: "Terlambat" },
  { key: "done",        label: "Selesai"   },
  { key: "cancelled",   label: "Dibatalkan"},
];

const LIMIT = 10;
const COL   = "48px 1fr 1fr 100px 100px 120px 100px 48px";

// ── StatusBadge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RentalStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: cfg.bg, color: cfg.color,
      fontSize: "12px", fontWeight: 600,
      padding: "3px 10px", borderRadius: "20px",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────

interface DetailModalProps {
  rental: RentalRow;
  onClose: () => void;
  onStatusChange: (id: number, status: RentalStatus, confirmPayment?: boolean) => void;
  loading: boolean;
  onEdit: (rental: RentalRow) => void;
  backendUrl: string;
}

function DetailModal({ rental, onClose, onStatusChange, loading, onEdit, backendUrl }: DetailModalProps) {
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [transformOrigin, setTransformOrigin] = useState("center center");

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(90,20,40,0.3)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", overflowY: "auto" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", border: "1px solid #E8C0D0", borderRadius: "12px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 60px rgba(196,114,142,0.25)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0D9E0", background: "#FAEAF0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#7A2848", marginBottom: "6px" }}>
              Detail Sewa #{rental.id}
            </div>
            <StatusBadge status={rental.status as RentalStatus} />
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.6)", border: "1px solid #E8C0D0", color: "#B08090", cursor: "pointer", width: "30px", height: "30px", borderRadius: "6px", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Info pelanggan */}
          <div style={{ background: "#FDF8F5", border: "1px solid #F0D9E0", borderRadius: "8px", padding: "0 16px", marginBottom: "14px" }}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.18em", color: "#C4728E", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", padding: "10px 0 4px", fontWeight: 600 }}>
              Info Pelanggan
            </div>
            {[
              { label: "Nama",      value: rental.customer_name },
              { label: "WhatsApp",  value: rental.customer_phone ?? "-" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F0D9E0" }}>
                <span style={{ fontSize: "13px", color: "#B08090" }}>{row.label}</span>
                <span style={{ fontSize: "13px", color: "#3A1A28", fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ padding: "8px 0" }} />
          </div>

          {/* Info baju */}
          <div style={{ background: "#FDF8F5", border: "1px solid #F0D9E0", borderRadius: "8px", padding: "0 16px", marginBottom: "14px" }}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.18em", color: "#C4728E", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", padding: "10px 0 4px", fontWeight: 600 }}>
              Info Sewa & Pembayaran
            </div>
            {[
              { label: "Baju",          value: rental.outfit_name },
              { label: "Kategori",      value: rental.category_name },
              { label: "Tanggal Mulai", value: formatDate(rental.start_date) },
              { label: "Tanggal Kembali", value: formatDate(rental.end_date) },
              { label: "Durasi",        value: `${rental.duration_days} hari` },
              { label: "Metode Bayar",  value: (rental.payment_method ?? "cash").toUpperCase() },
              { label: "Total Biaya",   value: formatRupiah(rental.amount_to_be_paid), accent: true }
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F0D9E0" }}>
                <span style={{ fontSize: "13px", color: "#B08090" }}>{row.label}</span>
                <span style={{ fontSize: "13px", color: (row as { accent?: boolean }).accent ? "#C4728E" : "#3A1A28", fontWeight: (row as { accent?: boolean }).accent ? 700 : 500 }}>
                  {row.value}
                </span>
              </div>
            ))}
            {rental.payment_proof_sent && rental.payment_proof_url && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "13px", color: "#B08090", fontWeight: 500 }}>Bukti Pembayaran (Scan/Upload)</span>
                <div 
                  onClick={() => setZoomImageUrl(`${backendUrl}${rental.payment_proof_url}`)}
                  style={{
                    width: "100%",
                    height: "140px",
                    borderRadius: "8px",
                    border: "1px dashed #F0D9E0",
                    overflow: "hidden",
                    cursor: "zoom-in",
                    position: "relative",
                    background: "#FDF8F5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#C4728E"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#F0D9E0"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`${backendUrl}${rental.payment_proof_url}`} 
                    alt="Bukti Transfer" 
                    style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "8px" }} 
                  />
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "rgba(0,0,0,0.45)",
                    color: "white",
                    fontSize: "11px",
                    textAlign: "center",
                    padding: "4px 0",
                    fontWeight: 500,
                    width: "100%"
                  }}>
                    🔍 Klik untuk memperbesar
                  </div>
                </div>
              </div>
            )}
            <div style={{ padding: "8px 0" }} />
          </div>

          {/* Action buttons sesuai status */}

          {/* Pending → konfirmasi 1-click lunas atau batalkan */}
          {rental.status === "pending" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                disabled={loading}
                onClick={() => onStatusChange(rental.id, "ongoing", true)}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #1A7A4A, #3D7A5A)",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(26,122,74,0.25)",
                }}
              >
                🟢 Konfirmasi Dipinjam & Bayar (Lunas)
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  disabled={loading}
                  onClick={() => onStatusChange(rental.id, "ongoing", false)}
                  style={{ flex: 1, background: "rgba(201,146,42,0.1)", border: "1.5px solid rgba(201,146,42,0.4)", color: "#A07010", padding: "10px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
                >
                  🟡 Konfirmasi Dipinjam (Bayar di Salon/Cash)
                </button>
                <button
                  disabled={loading}
                  onClick={() => onStatusChange(rental.id, "cancelled")}
                  style={{ flex: 1, background: "rgba(217,64,96,0.08)", border: "1.5px solid rgba(217,64,96,0.3)", color: "#D94060", padding: "10px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
                >
                  🔴 Batalkan
                </button>
              </div>
            </div>
          )}



          {/* Ongoing → tandai dikembalikan */}
          {rental.status === "ongoing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                disabled={loading}
                onClick={() => onStatusChange(rental.id, "done")}
                style={{ width: "100%", background: "rgba(42,140,90,0.1)", border: "1px solid rgba(42,140,90,0.3)", color: "#1A7A4A", padding: "12px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                ✓ Tandai Sudah Dikembalikan
              </button>
            </div>
          )}

          {/* Terlambat → tandai dikembalikan */}
          {rental.status === "terlambat" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ background: "rgba(217,64,96,0.07)", border: "1px solid rgba(217,64,96,0.2)", borderRadius: "8px", padding: "10px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#D94060" }}>
                ⚠️ Baju belum dikembalikan melewati batas waktu!
              </div>
              <button
                disabled={loading}
                onClick={() => onStatusChange(rental.id, "done")}
                style={{ width: "100%", background: "rgba(42,140,90,0.1)", border: "1px solid rgba(42,140,90,0.3)", color: "#1A7A4A", padding: "12px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                ✓ Tandai Sudah Dikembalikan
              </button>
            </div>
          )}

          {/* Done / Cancelled — read only */}
          {(rental.status === "done" || rental.status === "cancelled") && (
            <div style={{ background: "#FDF8F5", border: "1px solid #F0D9E0", borderRadius: "8px", padding: "12px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#B08090", textAlign: "center" }}>
              {rental.status === "done" ? "Transaksi sewa selesai." : "Transaksi sewa dibatalkan."}
            </div>
          )}
          {/* Admin Edit Button */}
          {(() => {
            const rentalEndDate = new Date(rental.start_date);
            rentalEndDate.setDate(rentalEndDate.getDate() + Number(rental.duration_days));
            const isExpired = rentalEndDate < new Date();
            if (isExpired) return null;

            return (
              <button
                disabled={loading}
                onClick={() => onEdit(rental)}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  background: "white",
                  border: "1.5px solid #6B3A2A",
                  color: "#6B3A2A",
                  padding: "11px",
                  borderRadius: "8px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
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
                ✏️ Edit Sewa (Baju / Tanggal)
              </button>
            );
          })()}
        </div>
      </div>
      {/* Zoom Image Modal */}
      {zoomImageUrl && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setZoomImageUrl(null);
            setZoomScale(1);
            setTransformOrigin("center center");
          }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: "20px" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxHeight: "90vh", maxWidth: "90vw" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomImageUrl}
              alt="Preview Bukti Transfer"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                if (zoomScale === 1) {
                  setTransformOrigin(`${x}% ${y}%`); setZoomScale(2.5);
                } else {
                  setZoomScale(1); setTransformOrigin("center center");
                }
              }}
              style={{ maxHeight: "80vh", maxWidth: "100%", objectFit: "contain", transform: `scale(${zoomScale})`, transformOrigin, transition: "transform 0.25s ease", borderRadius: "8px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── MiniStat ───────────────────────────────────────────────────────────────

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="admin-card" style={{ padding: "16px 20px" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color, lineHeight: 1, marginBottom: "4px" }}>
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "#B08090" }}>{label}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminRentalsClient({ backendUrl }: { backendUrl: string }) {
  const { getCache, setCache, invalidateCache, setRevalidating, revalidatingKeys } = useAdminCache();
  const [filter, setFilter]         = useState<RentalStatus | "ALL">("ALL");
  const cacheKey = `admin_rentals_${filter}`;

  const [rentals, setRentals]       = useState<RentalRow[]>(() => getCache<any>(cacheKey)?.rows ?? []);
  const [total, setTotal]           = useState(() => getCache<any>(cacheKey)?.total ?? 0);
  const [loading, setLoading]       = useState(!getCache<any>(cacheKey));
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<RentalRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  const [editingRental, setEditingRental] = useState<RentalRow | null>(null);
  const [outfitList, setOutfitList] = useState<any[]>([]);
  const [rentalEditOutfitId, setRentalEditOutfitId] = useState<number>(0);
  const [rentalEditStartDate, setRentalEditStartDate] = useState<string>("");
  const [rentalEditDuration, setRentalEditDuration] = useState<number>(1);
  const [savingRental, setSavingRental] = useState(false);
  const [rentalError, setRentalError] = useState("");

  const [stats, setStats] = useState(() => getCache<any>(cacheKey)?.stats ?? {
    total: 0,
    ongoing: 0,
    terlambat: 0,
    revenue: 0,
  });

  useEffect(() => {
    fetch("/api/outfits")
      .then(res => res.json())
      .then(data => {
        if (data && data.outfits) {
          setOutfitList(data.outfits);
        }
      })
      .catch(err => console.error("Error loading outfits:", err));
  }, []);

  useEffect(() => {
    if (editingRental) {
      setRentalError("");
      setRentalEditOutfitId(editingRental.outfit_catalogues_id);
      
      const sDate = new Date(editingRental.start_date);
      const dateStr = sDate.getFullYear() + '-' + String(sDate.getMonth() + 1).padStart(2, '0') + '-' + String(sDate.getDate()).padStart(2, '0');
      setRentalEditStartDate(dateStr);
      setRentalEditDuration(editingRental.duration_days);
    }
  }, [editingRental]);

  const handleSaveRentalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRental) return;
    setSavingRental(true);
    setRentalError("");

    try {
      const response = await fetch(`/api/rentals/${editingRental.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outfit_catalogues_id: rentalEditOutfitId,
          start_date: rentalEditStartDate,
          duration_days: rentalEditDuration,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setRentalError(data.error || "Gagal memperbarui penyewaan.");
      } else {
        setEditingRental(null);
        setSelected(null);
        fetchData();
        showToast("Penyewaan baju berhasil diperbarui.", true);
      }
    } catch (err) {
      console.error(err);
      setRentalError("Terjadi kesalahan koneksi.");
    } finally {
      setSavingRental(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    const key = `admin_rentals_${filter}`;
    const cached = getCache<any>(key);
    if (cached) {
      setRentals(cached.rows);
      setTotal(cached.total);
      if (cached.stats) setStats(cached.stats);
      setLoading(false);
      setRevalidating(key, true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getRentalsForAdmin({
        status: filter,
        limit: 0,
      });
      if (result.success && result.data) {
        setRentals(result.data.rows);
        setTotal(result.data.total);
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

  // Sync status terlambat saat halaman dibuka
  useEffect(() => {
    syncLateRentals().then((res) => {
      if (res.success && res.data && res.data.updated > 0) {
        showToast(`${res.data.updated} sewa ditandai terlambat.`, false);
      }
    });
  }, [showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleStatusChange(id: number, status: RentalStatus, confirmPayment?: boolean) {
    setActionLoading(true);
    try {
      const result = await updateRentalStatus(id, status, confirmPayment);
      if (result.success) {
        setRentals((prev) => prev.map((r) => r.id === id ? { ...r, rental_status: status } : r));
        setSelected(null);
        let msg = "Status diperbarui.";
        if (status === "ongoing" && confirmPayment) {
          msg = "Sewa dikonfirmasi & Pembayaran LUNAS! Invoice WA dikirim.";
        } else if (status === "done") {
          if (result.data?.penaltyAmount) {
            msg = `Pengembalian dicatat. Denda ${formatRupiah(result.data.penaltyAmount)} (${result.data.lateDays} hari telat) ditambahkan.`;
          } else {
            msg = "Sewa selesai dicatat tepat waktu!";
          }
        } else if (status === "ongoing") {
          msg = "Status diperbarui ke Dipinjam.";
        } else if (status === "cancelled") {
          msg = "Sewa dibatalkan.";
        }
        showToast(msg, status !== "cancelled");
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
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "72px", right: "24px", zIndex: 2000,
          background: "white",
          border: `1.5px solid ${toast.ok ? "#5A9E7A" : "#C05060"}`,
          color: toast.ok ? "#3D7A5A" : "#C05060",
          padding: "12px 20px", borderRadius: "10px",
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600,
          boxShadow: "0 8px 24px rgba(196,120,138,0.15)",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          {toast.ok ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#7A2848", marginBottom: "4px" }}>
            Manajemen Sewa Baju
          </h1>
          <p style={{ fontSize: "14px", color: "#B06080" }}>
            Kelola semua transaksi persewaan baju
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <MiniStat label="Total Sewa"        value={stats.total}              color="#7A2848" />
        <MiniStat label="Sedang Dipinjam"   value={stats.ongoing}            color="#C4728E" />
        <MiniStat label="Terlambat"         value={stats.terlambat}          color="#D94060" />
        <MiniStat label="Total Pendapatan"  value={formatRupiah(stats.revenue)} color="#C9922A" />
      </div>

      {/* Alert terlambat */}
      {stats.terlambat > 0 && (
        <div style={{ background: "rgba(217,64,96,0.08)", border: "1px solid rgba(217,64,96,0.25)", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.2rem" }}>⚠️</span>
          <span style={{ fontSize: "14px", color: "#D94060", fontWeight: 500 }}>
            {stats.terlambat} baju belum dikembalikan melewati batas waktu!
          </span>
          <button
            onClick={() => { setFilter("terlambat"); setPage(1); }}
            style={{ marginLeft: "auto", background: "rgba(217,64,96,0.1)", border: "1px solid rgba(217,64,96,0.25)", color: "#D94060", padding: "5px 12px", borderRadius: "6px", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          >
            Lihat Sekarang →
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="admin-card" style={{ padding: "12px 18px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {FILTER_TABS.map(({ key, label }) => {
          const count = key === "ALL" ? total : rentals.filter((r) => r.rental_status === key).length;
          return (
            <button
              key={key}
              className={`filter-btn${filter === key ? " active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
              <span style={{ marginLeft: "5px", background: filter === key ? "rgba(255,255,255,0.25)" : "#F0D9E0", color: filter === key ? "white" : "#B08090", fontSize: "11px", fontWeight: 700, padding: "0 5px", borderRadius: "10px" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* DataTables Component */}
      <DataTable
        data={rentals}
        loading={loading}
        onRefresh={fetchData}
        isRevalidating={revalidatingKeys.has(cacheKey)}
        searchPlaceholder="Cari nama pelanggan, telp, atau nama baju..."
        searchableKeys={["customer_name", "customer_phone", "outfit_name", "category_name", "id"]}
        emptyMessage="Tidak ada data sewa baju yang ditemukan 🌸"
        columns={[
          {
            key: "id",
            header: "ID",
            sortable: true,
            width: "60px",
            render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#B08090" }}>#{r.id}</span>,
          },
          {
            key: "customer_name",
            header: "Pelanggan",
            sortable: true,
            render: (r) => (
              <div>
                <div style={{ fontWeight: 600, color: "#3A1A28" }}>{r.customer_name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "#B08090" }}>{r.customer_phone ?? "-"}</div>
              </div>
            ),
          },
          {
            key: "outfit_name",
            header: "Baju / Busana",
            sortable: true,
            render: (r) => (
              <div>
                <div style={{ fontWeight: 600, color: "#3A1A28" }}>{r.outfit_name}</div>
                <div style={{ fontSize: "0.7rem", color: "#B08090" }}>{r.category_name}</div>
              </div>
            ),
          },
          {
            key: "start_date",
            header: "Mulai",
            sortable: true,
            render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#8A4060" }}>{formatDate(r.start_date)}</span>,
          },
          {
            key: "end_date",
            header: "Batas Kembali",
            sortable: true,
            render: (r) => (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: r.rental_status === "terlambat" ? "#D94060" : "#8A4060", fontWeight: r.rental_status === "terlambat" ? 700 : 400 }}>
                {formatDate(r.end_date)}
              </span>
            ),
          },
          {
            key: "rental_status",
            header: "Status",
            sortable: true,
            render: (r) => <StatusBadge status={r.rental_status as RentalStatus} />,
          },
          {
            key: "amount_to_be_paid",
            header: "Total Biaya",
            sortable: true,
            sortValue: (r) => Number(r.amount_to_be_paid),
            render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#C9922A", fontWeight: 600 }}>{formatRupiah(r.amount_to_be_paid)}</span>,
          },
          {
            key: "action",
            header: "Aksi",
            align: "center",
            render: (r) => (
              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                {r.rental_status === "pending" ? (
                  <button
                    title="Konfirmasi dipinjam"
                    onClick={() => handleStatusChange(r.id, "ongoing")}
                    style={{ background: "rgba(42,140,90,0.1)", border: "1px solid rgba(42,140,90,0.3)", color: "#1A7A4A", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer" }}
                  >
                    ✓ Pinjam
                  </button>
                ) : r.rental_status === "ongoing" || r.rental_status === "terlambat" ? (
                  <button
                    title="Klik untuk tandai selesai"
                    onClick={() => setSelected(r)}
                    style={{ background: "rgba(196,114,142,0.1)", border: "1px solid rgba(196,114,142,0.3)", color: "#C4728E", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer" }}
                  >
                    ↩ Selesai
                  </button>
                ) : null}
                <button
                  onClick={() => setSelected(r)}
                  style={{ background: "transparent", border: "1px solid #E8C0D0", color: "#8A4060", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer" }}
                >
                  Detail
                </button>
              </div>
            ),
          },
        ]}
      />
      {/* Detail Modal */}
      {selected && (
        <DetailModal
          rental={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          loading={actionLoading}
          onEdit={setEditingRental}
          backendUrl={backendUrl}
        />
      )}

      {/* Admin Edit Rental Modal */}
      {editingRental && (() => {
        const selectedOutfit = outfitList.find(o => o.id === Number(rentalEditOutfitId));
        const dailyPrice = selectedOutfit ? Number(selectedOutfit.price) : 0;
        const estimatedTotal = dailyPrice * rentalEditDuration;

        return (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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
                  Edit Sewa Baju #{editingRental.id} (Admin)
                </h3>
                <button
                  onClick={() => setEditingRental(null)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#8B6A5A" }}
                >
                  ✕
                </button>
              </div>

              {rentalError && (
                <div style={{ background: "#FDF2F2", border: "1px solid #F8B4B4", color: "#C81E1E", borderRadius: "8px", padding: "12px", fontSize: "0.8rem", fontWeight: 500 }}>
                  ⚠️ {rentalError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B3A2A" }}>Pilih Baju yang Disewa</label>
                <select
                  value={rentalEditOutfitId}
                  onChange={(e) => setRentalEditOutfitId(Number(e.target.value))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #EDD8CC", fontSize: "0.85rem", color: "#2C1A0E", background: "white", fontFamily: "inherit" }}
                >
                  <option value={0} disabled>Pilih baju...</option>
                  {outfitList.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.outfit_name} - {o.size} ({new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(o.price)}/hari)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B3A2A" }}>Tanggal Mulai Sewa</label>
                <input
                  type="date"
                  value={rentalEditStartDate}
                  onChange={(e) => setRentalEditStartDate(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #EDD8CC", fontSize: "0.85rem", color: "#2C1A0E", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B3A2A" }}>Durasi Sewa (Hari)</label>
                <input
                  type="number"
                  value={rentalEditDuration}
                  onChange={(e) => setRentalEditDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  min={1}
                  max={30}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #EDD8CC", fontSize: "0.85rem", color: "#2C1A0E", fontFamily: "inherit" }}
                />
              </div>

              {dailyPrice > 0 && (
                <div style={{ padding: "12px 16px", background: "#FAF6F4", borderRadius: "8px", border: "1px solid #EDD8CC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#8B6A5A" }}>Estimasi Total Harga Baru:</span>
                  <strong style={{ fontSize: "0.95rem", color: "#6B3A2A" }}>
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(estimatedTotal)}
                  </strong>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setEditingRental(null)}
                  style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #EDD8CC", background: "white", color: "#8B6A5A", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingRental || rentalEditOutfitId === 0 || !rentalEditStartDate}
                  onClick={handleSaveRentalEdit}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#6B3A2A",
                    color: "white",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: savingRental ? "not-allowed" : "pointer",
                    opacity: savingRental ? 0.7 : 1,
                  }}
                >
                  {savingRental ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}