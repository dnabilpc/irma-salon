// app/admin/rentals/AdminRentalsClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getRentalsForAdmin,
  updateRentalStatus,
  syncLateRentals,
  type RentalRow,
  type RentalStatus,
} from "@/actions/rental";

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
  onStatusChange: (id: number, status: RentalStatus) => void;
  loading: boolean;
}

function DetailModal({ rental, onClose, onStatusChange, loading }: DetailModalProps) {

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(90,20,40,0.3)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", border: "1px solid #E8C0D0", borderRadius: "12px", width: "100%", maxWidth: "520px", overflow: "hidden", boxShadow: "0 20px 60px rgba(196,114,142,0.25)", maxHeight: "90vh", overflowY: "auto" }}
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
              Info Sewa
            </div>
            {[
              { label: "Baju",          value: rental.outfit_name },
              { label: "Kategori",      value: rental.category_name },
              { label: "Tanggal Mulai", value: formatDate(rental.start_date) },
              { label: "Tanggal Kembali", value: formatDate(rental.end_date) },
              { label: "Durasi",        value: `${rental.duration_days} hari` },
              { label: "Total Biaya",   value: formatRupiah(rental.amount_to_be_paid), accent: true }
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F0D9E0" }}>
                <span style={{ fontSize: "13px", color: "#B08090" }}>{row.label}</span>
                <span style={{ fontSize: "13px", color: (row as { accent?: boolean }).accent ? "#C4728E" : "#3A1A28", fontWeight: (row as { accent?: boolean }).accent ? 700 : 500 }}>
                  {row.value}
                </span>
              </div>
            ))}
            <div style={{ padding: "8px 0" }} />
          </div>

          {/* Action buttons sesuai status */}

          {/* Pending → konfirmasi atau batalkan */}
          {rental.status === "pending" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={loading}
                onClick={() => onStatusChange(rental.id, "ongoing")}
                style={{ flex: 1, background: "rgba(42,140,90,0.1)", border: "1px solid rgba(42,140,90,0.3)", color: "#1A7A4A", padding: "12px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                ✓ Konfirmasi Dipinjam
              </button>
              <button
                disabled={loading}
                onClick={() => onStatusChange(rental.id, "cancelled")}
                style={{ flex: 1, background: "rgba(217,64,96,0.08)", border: "1px solid rgba(217,64,96,0.25)", color: "#D94060", padding: "12px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                ✕ Batalkan
              </button>
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
        </div>
      </div>
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

export default function AdminRentalsClient() {
  const [rentals, setRentals]       = useState<RentalRow[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<RentalStatus | "ALL">("ALL");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<RentalRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  const totalPages = Math.ceil(total / LIMIT);

  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    terlambat: 0,
    revenue: 0,
  });

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const result = await getRentalsForAdmin({
        status: filter,
        search: search || undefined,
        page,
        limit: LIMIT,
      });
      if (result.success && result.data) {
        setRentals(result.data.rows);
        setTotal(result.data.total);
        if (result.data.stats) {
          setStats(result.data.stats);
        }
      }
    } catch {
      showToast("Gagal memuat data.", false);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page, showToast]);

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

  async function handleStatusChange(id: number, status: RentalStatus) {
    setActionLoading(true);
    try {
      const result = await updateRentalStatus(id, status);
      if (result.success) {
        setRentals((prev) => prev.map((r) => r.id === id ? { ...r, rental_status: status } : r));
        setSelected(null);
        showToast(
          status === "done" ? "Sewa selesai dicatat!" :
          status === "ongoing" ? "Status diperbarui ke Dipinjam." :
          status === "cancelled" ? "Sewa dibatalkan." : "Status diperbarui.",
          status !== "cancelled"
        );
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

      {/* Filter + Search */}
      <div className="admin-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#B08090", pointerEvents: "none" }}>🔍</span>
          <input
            className="search-input"
            placeholder="Cari nama pelanggan atau baju..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
          {FILTER_TABS.map(({ key, label }) => {
            const count = key === "ALL" ? total : rentals.filter((r) => r.rental_status === key).length;
            return (
              <button
                key={key}
                className={`filter-btn${filter === key ? " active" : ""}`}
                onClick={() => { setFilter(key); setPage(1); }}
              >
                {label}
                <span style={{ marginLeft: "5px", background: filter === key ? "rgba(255,255,255,0.25)" : "#F0D9E0", color: filter === key ? "white" : "#B08090", fontSize: "11px", fontWeight: 700, padding: "0 5px", borderRadius: "10px" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabel */}
      <div className="admin-card" style={{ overflow: "hidden" }}>
        {/* Info */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0D9E0", display: "flex", justifyContent: "space-between", background: "#FDF8F5" }}>
          <span style={{ fontSize: "13px", color: "#B08090" }}>
            {loading ? "Memuat..." : `Menampilkan ${rentals.length} dari ${total} data`}
          </span>
        </div>

        <div className="table-responsive-container" style={{ margin: 0, border: "none", borderRadius: 0 }}>
          <div style={{ minWidth: "900px" }}>
            {/* Header kolom */}
        <div className="table-row" style={{ gridTemplateColumns: COL, background: "#FDF8F5", fontSize: "12px", color: "#B08090", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 600 }}>
          <span>ID</span>
          <span>Pelanggan</span>
          <span>Baju</span>
          <span>Mulai</span>
          <span>Kembali</span>
          <span>Status</span>
          <span>Total</span>
          <span />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: "48px", textAlign: "center", color: "#C4728E", fontFamily: "'DM Sans', sans-serif", fontSize: "14px" }}>
            Memuat data...
          </div>
        )}

        {/* Empty */}
        {!loading && rentals.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "#B08090", fontFamily: "'DM Sans', sans-serif", fontSize: "14px" }}>
            Tidak ada data untuk filter ini
          </div>
        )}

        {/* Data rows */}
        {!loading && rentals.map((r) => (
          <div
            key={r.id}
            className="table-row"
            style={{ gridTemplateColumns: COL, cursor: "pointer" }}
            onClick={() => setSelected(r)}
          >
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#B08090" }}>{r.id}</span>

            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#3A1A28", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.customer_name}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#B08090" }}>
                {r.customer_phone ?? "-"}
              </div>
            </div>

            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "13px", color: "#3A1A28", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.outfit_name}
              </div>
              <div style={{ fontSize: "11px", color: "#B08090" }}>{r.category_name}</div>
            </div>

            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#8A4060" }}>
              {formatDate(r.start_date)}
            </span>

            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: "12px",
              color: r.rental_status === "terlambat" ? "#D94060" : "#8A4060",
              fontWeight: r.rental_status === "terlambat" ? 700 : 400,
            }}>
              {formatDate(r.end_date)}
            </span>

            <StatusBadge status={r.rental_status as RentalStatus} />

            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#C9922A", fontWeight: 600 }}>
              {formatRupiah(r.amount_to_be_paid)}
            </span>

            {/* Quick action */}
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", justifyContent: "center" }}>
              {r.rental_status === "pending" ? (
                <button
                  title="Konfirmasi dipinjam"
                  onClick={() => handleStatusChange(r.id, "ongoing")}
                  style={{ background: "rgba(42,140,90,0.1)", border: "1px solid rgba(42,140,90,0.3)", color: "#1A7A4A", width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✓
                </button>
              ) : r.rental_status === "ongoing" || r.rental_status === "terlambat" ? (
                <button
                  title="Klik untuk tandai selesai"
                  onClick={() => setSelected(r)}
                  style={{ background: "rgba(196,114,142,0.1)", border: "1px solid rgba(196,114,142,0.3)", color: "#C4728E", width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ↩
                </button>
              ) : (
                <span style={{ fontSize: "14px", color: "#D4B8C0" }}>—</span>
              )}
            </div>
          </div>
        ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ background: "white", border: "1px solid #E8C0D0", color: page === 1 ? "#D4B8C0" : "#8A4060", padding: "7px 16px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", cursor: page === 1 ? "not-allowed" : "pointer" }}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{ background: p === page ? "#C4728E" : "white", border: `1px solid ${p === page ? "#C4728E" : "#E8C0D0"}`, color: p === page ? "white" : "#8A4060", width: "36px", height: "36px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: p === page ? 600 : 400, cursor: "pointer" }}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ background: "white", border: "1px solid #E8C0D0", color: page === totalPages ? "#D4B8C0" : "#8A4060", padding: "7px 16px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", cursor: page === totalPages ? "not-allowed" : "pointer" }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          rental={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          loading={actionLoading}
        />
      )}
    </div>
  );
}