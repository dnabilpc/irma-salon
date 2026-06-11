// app/admin/payments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { fetchAdminPayments, confirmAdminPayment } from "@/actions/admin";
import type { PaymentRow } from "@/actions/admin";

type PaymentStatus = "lunas" | "pending" | "refund" | "gagal";
type PaymentMethod = "cash" | "qris" | "midtrans" | "payment_gateway";
type PaymentType   = "booking" | "sewa";

const STATUS_CONFIG: Record<PaymentStatus, { label: string; bg: string; color: string }> = {
  lunas:   { label: "Lunas",   bg: "rgba(42,140,90,0.12)",   color: "#1A7A4A" },
  pending: { label: "Pending", bg: "rgba(201,146,42,0.12)",  color: "#A07010" },
  refund:  { label: "Refund",  bg: "rgba(155,111,212,0.12)", color: "#7A50B0" },
  gagal:   { label: "Gagal",   bg: "rgba(217,64,96,0.12)",   color: "#D94060" },
};

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: string }> = {
  cash:     { label: "Tunai",     icon: "💵" },
  qris:     { label: "QRIS",      icon: "📱" },
  midtrans: { label: "Midtrans",  icon: "💳" },
  payment_gateway: { label: "Midtrans", icon: "💳" }
};

const TYPE_CONFIG: Record<PaymentType, { label: string; bg: string; color: string }> = {
  booking: { label: "Booking", bg: "rgba(196,114,142,0.12)", color: "#C4728E" },
  sewa:    { label: "Sewa",    bg: "rgba(201,146,42,0.12)",  color: "#A07010" },
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const COL = "80px 1fr 80px 90px 100px 90px 100px";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<PaymentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<PaymentType | "all">("all");
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState<PaymentRow | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    const res = await fetchAdminPayments();
    if (res.success && res.data) {
      setPayments(res.data.payments);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = payments.filter((p) => {
    const statusMatch = filter === "all" || p.status === filter;
    const typeMatch   = typeFilter === "all" || p.type === typeFilter;
    const searchMatch = !search || 
                        p.customer.toLowerCase().includes(search.toLowerCase()) || 
                        String(p.id).toLowerCase().includes(search.toLowerCase());
    return statusMatch && typeMatch && searchMatch;
  });

  const stats = {
    total:     payments.length,
    lunas:     payments.filter((p) => p.status === "lunas").length,
    pending:   payments.filter((p) => p.status === "pending").length,
    revenue:   payments.filter((p) => p.status === "lunas").reduce((s, p) => s + Number(p.amount), 0),
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#7A2848", marginBottom: "4px" }}>
            Manajemen Pembayaran
          </h1>
          <p style={{ fontSize: "14px", color: "#B06080" }}>Pantau semua transaksi pembayaran</p>
        </div>
        <button className="btn-action-gold" onClick={() => window.print()}>↓ Cetak Laporan</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Total Transaksi",  value: stats.total,              color: "#7A2848" },
          { label: "Sudah Lunas",      value: stats.lunas,              color: "#1A7A4A" },
          { label: "Menunggu Bayar",   value: stats.pending,            color: "#A07010" },
          { label: "Total Pendapatan", value: formatRupiah(stats.revenue), color: "#C4728E" },
        ].map((s) => (
          <div key={s.label} className="admin-card" style={{ padding: "16px 20px" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: "4px" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#B08090" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="admin-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#B08090", pointerEvents: "none" }}>🔍</span>
          <input className="search-input" placeholder="Cari nama pelanggan atau ID transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const, alignItems: "center" }}>
          {/* Status filter */}
          <span style={{ fontSize: "12px", color: "#B08090", fontWeight: 600, marginRight: "4px" }}>Status:</span>
          {(["all", "lunas", "pending", "gagal"] as const).map((key) => {
            const labels: Record<string, string> = { all: "Semua", lunas: "Lunas", pending: "Pending", gagal: "Gagal" };
            const count = key === "all" ? payments.length : payments.filter((p) => p.status === key).length;
            return (
              <button key={key} className={`filter-btn${filter === key ? " active" : ""}`} onClick={() => setFilter(key)}>
                {labels[key]}
                <span style={{ marginLeft: "5px", background: filter === key ? "rgba(255,255,255,0.25)" : "#F0D9E0", color: filter === key ? "white" : "#B08090", fontSize: "11px", fontWeight: 700, padding: "0 5px", borderRadius: "10px" }}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ width: "1px", height: "20px", background: "#E8C0D0", margin: "0 4px" }} />

          {/* Type filter */}
          <span style={{ fontSize: "12px", color: "#B08090", fontWeight: 600, marginRight: "4px" }}>Tipe:</span>
          {(["all", "booking", "sewa"] as const).map((key) => {
            const labels: Record<string, string> = { all: "Semua", booking: "Booking", sewa: "Sewa" };
            return (
              <button key={key} className={`filter-btn${typeFilter === key ? " active" : ""}`} onClick={() => setTypeFilter(key)}>
                {labels[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabel */}
      <div className="admin-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0D9E0", background: "#FDF8F5" }}>
          <span style={{ fontSize: "13px", color: "#B08090" }}>
            {loading ? "Memuat data..." : `Menampilkan ${filtered.length} dari ${payments.length} transaksi`}
          </span>
        </div>

        <div className="table-row" style={{ gridTemplateColumns: COL, background: "#FDF8F5", fontSize: "12px", color: "#B08090", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 600 }}>
          <span>ID</span>
          <span>Pelanggan</span>
          <span>Tipe</span>
          <span>Metode</span>
          <span>Status</span>
          <span>Tanggal</span>
          <span>Jumlah</span>
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center" as const, color: "#B08090", fontSize: "14px" }}>
            Memuat data transaksi dari server...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" as const, color: "#B08090", fontSize: "14px" }}>
            Tidak ada data untuk filter ini
          </div>
        ) : (
          filtered.map((p) => {
            const sc = STATUS_CONFIG[p.status] || { label: p.status, bg: "rgba(100,100,100,0.1)", color: "#555" };
            const tc = TYPE_CONFIG[p.type] || { label: p.type, bg: "rgba(100,100,100,0.1)", color: "#555" };
            const mc = METHOD_CONFIG[p.method] || { label: p.method, icon: "💳" };
            return (
              <div key={p.id} className="table-row" style={{ gridTemplateColumns: COL, cursor: "pointer" }} onClick={() => setSelected(p)}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#B08090" }}>TRX-{p.id}</span>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#3A1A28" }}>{p.customer}</div>
                  <div style={{ fontSize: "12px", color: "#B08090" }}>{p.description}</div>
                </div>
                <span style={{ display: "inline-flex", background: tc.bg, color: tc.color, fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" as const, height: "fit-content", width: "fit-content" }}>
                  {tc.label}
                </span>
                <span style={{ fontSize: "13px", color: "#8A4060" }}>{mc.icon} {mc.label}</span>
                <span style={{ display: "inline-flex", background: sc.bg, color: sc.color, fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" as const, height: "fit-content", width: "fit-content" }}>
                  {sc.label}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#8A4060" }}>{p.date}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#C9922A", fontWeight: 600 }}>{formatRupiah(Number(p.amount))}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Modal detail */}
      {selected && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(90,20,40,0.3)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: "white", border: "1px solid #E8C0D0", borderRadius: "12px", width: "100%", maxWidth: "480px", overflow: "hidden", boxShadow: "0 20px 60px rgba(196,114,142,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0D9E0", background: "#FAEAF0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#7A2848" }}>
                  Detail Transaksi
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#B06080" }}>TRX-{selected.id}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#B08090", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "24px" }}>
              {[
                { label: "Pelanggan",  value: selected.customer },
                { label: "WhatsApp",   value: selected.phone || "—" },
                { label: "Jenis",      value: (TYPE_CONFIG[selected.type] || { label: selected.type }).label },
                { label: "Layanan",    value: selected.description },
                { label: "Metode",     value: `${(METHOD_CONFIG[selected.method] || { icon: "💳", label: selected.method }).icon} ${(METHOD_CONFIG[selected.method] || { label: selected.method }).label}` },
                { label: "Tanggal",    value: selected.date     },
                { label: "Status",     value: (STATUS_CONFIG[selected.status] || { label: selected.status }).label },
                { label: "Jumlah",     value: formatRupiah(Number(selected.amount)), accent: true },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0D9E0" }}>
                  <span style={{ fontSize: "13px", color: "#B08090", fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: "14px", color: (row as { accent?: boolean }).accent ? "#C4728E" : "#3A1A28", fontWeight: (row as { accent?: boolean }).accent ? 700 : 500 }}>{row.value}</span>
                </div>
              ))}

              {/* Action buttons */}
              {selected.status === "lunas" && (
                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button
                    onClick={() => window.open(`/invoice/${selected.id}`, "_blank")}
                    style={{ flex: 1, background: "rgba(42,140,90,0.1)", border: "1px solid rgba(42,140,90,0.3)", color: "#1A7A4A", padding: "11px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cetak Bukti (Invoice)
                  </button>
                </div>
              )}
              {selected.status === "pending" && (
                <button
                  onClick={async () => {
                    setSubmitting(true);
                    const res = await confirmAdminPayment(Number(selected.id));
                    setSubmitting(false);
                    if (res.success) {
                      setSelected(null);
                      loadPayments();
                    } else {
                      alert(res.error || "Gagal memverifikasi pembayaran.");
                    }
                  }}
                  disabled={submitting}
                  style={{ width: "100%", marginTop: "16px", background: "rgba(42,140,90,0.1)", border: "1px solid rgba(42,140,90,0.3)", color: "#1A7A4A", padding: "12px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? "Memproses..." : "✓ Konfirmasi Pembayaran"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}