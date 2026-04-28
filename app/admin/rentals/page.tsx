// app/admin/rentals/page.tsx
"use client";

import { useState } from "react";

type RentalStatus = "dipinjam" | "dikembalikan" | "terlambat" | "pending";

interface Rental {
  id: string;
  customer: string;
  phone: string;
  item: string;
  kategori: string;
  rentDate: string;
  returnDate: string;
  status: RentalStatus;
  deposit: number;
  total: number;
}

const MOCK: Rental[] = [
  { id: "SW-021", customer: "Aisyah Putri",    phone: "08111222333", item: "Kebaya Merah Pengantin", kategori: "Kebaya",  rentDate: "08 Mar", returnDate: "10 Mar", status: "dipinjam",     deposit: 100000, total: 350000 },
  { id: "SW-022", customer: "Fitri Handayani", phone: "08222333444", item: "Gaun Pesta Hijau",       kategori: "Gaun",    rentDate: "07 Mar", returnDate: "09 Mar", status: "dikembalikan", deposit: 100000, total: 200000 },
  { id: "SW-023", customer: "Yuni Kartika",    phone: "08333444555", item: "Kebaya Biru Modern",     kategori: "Kebaya",  rentDate: "06 Mar", returnDate: "08 Mar", status: "terlambat",    deposit: 100000, total: 250000 },
  { id: "SW-024", customer: "Risa Amalia",     phone: "08444555666", item: "Dress Batik Premium",    kategori: "Dress",   rentDate: "09 Mar", returnDate: "11 Mar", status: "dipinjam",     deposit: 75000,  total: 180000 },
  { id: "SW-025", customer: "Nadia Putri",     phone: "08555666777", item: "Gamis Pesta Gold",       kategori: "Gamis",   rentDate: "10 Mar", returnDate: "12 Mar", status: "pending",      deposit: 0,      total: 220000 },
];

const STATUS_CONFIG: Record<RentalStatus, { label: string; bg: string; color: string }> = {
  pending:      { label: "Menunggu",     bg: "rgba(201,146,42,0.12)",  color: "#A07010" },
  dipinjam:     { label: "Dipinjam",     bg: "rgba(196,114,142,0.12)", color: "#C4728E" },
  dikembalikan: { label: "Dikembalikan", bg: "rgba(42,140,90,0.12)",   color: "#1A7A4A" },
  terlambat:    { label: "Terlambat",    bg: "rgba(217,64,96,0.12)",   color: "#D94060" },
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

const COL = "72px 1fr 1fr 80px 80px 110px 90px";

export default function RentalsPage() {
  const [filter, setFilter] = useState<RentalStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [rentals, setRentals] = useState<Rental[]>(MOCK);
  const [selected, setSelected] = useState<Rental | null>(null);

  const filtered = rentals.filter((r) => {
    const statusMatch = filter === "all" || r.status === filter;
    const searchMatch = !search || r.customer.toLowerCase().includes(search.toLowerCase()) || r.item.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const stats = {
    total:        rentals.length,
    dipinjam:     rentals.filter((r) => r.status === "dipinjam").length,
    terlambat:    rentals.filter((r) => r.status === "terlambat").length,
    revenue:      rentals.filter((r) => r.status === "dikembalikan").reduce((s, r) => s + r.total, 0),
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#7A2848", marginBottom: "4px" }}>
            Manajemen Sewa Baju
          </h1>
          <p style={{ fontSize: "14px", color: "#B06080" }}>Kelola semua transaksi persewaan baju</p>
        </div>
        <button className="btn-action-gold">↓ Export CSV</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Total Sewa",       value: stats.total,              color: "#7A2848" },
          { label: "Sedang Dipinjam",  value: stats.dipinjam,           color: "#C4728E" },
          { label: "Terlambat",        value: stats.terlambat,          color: "#D94060" },
          { label: "Total Pendapatan", value: formatRupiah(stats.revenue), color: "#C9922A" },
        ].map((s) => (
          <div key={s.label} className="admin-card" style={{ padding: "16px 20px" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: "4px" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#B08090" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert terlambat */}
      {stats.terlambat > 0 && (
        <div style={{ background: "rgba(217,64,96,0.08)", border: "1px solid rgba(217,64,96,0.25)", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.2rem" }}>⚠️</span>
          <span style={{ fontSize: "14px", color: "#D94060", fontWeight: 500 }}>
            {stats.terlambat} baju belum dikembalikan melewati batas waktu!
          </span>
        </div>
      )}

      {/* Filter + Search */}
      <div className="admin-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#B08090", pointerEvents: "none" }}>🔍</span>
          <input className="search-input" placeholder="Cari nama pelanggan atau item baju..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
          {(["all", "pending", "dipinjam", "dikembalikan", "terlambat"] as const).map((key) => {
            const labels: Record<string, string> = { all: "Semua", pending: "Menunggu", dipinjam: "Dipinjam", dikembalikan: "Dikembalikan", terlambat: "Terlambat" };
            const count = key === "all" ? rentals.length : rentals.filter((r) => r.status === key).length;
            return (
              <button key={key} className={`filter-btn${filter === key ? " active" : ""}`} onClick={() => setFilter(key)}>
                {labels[key]}
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
        <div className="table-row" style={{ gridTemplateColumns: COL, background: "#FDF8F5", fontSize: "12px", color: "#B08090", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 600 }}>
          <span>ID</span>
          <span>Pelanggan</span>
          <span>Item Baju</span>
          <span>Mulai</span>
          <span>Kembali</span>
          <span>Status</span>
          <span>Total</span>
        </div>

        {filtered.map((r) => {
          const sc = STATUS_CONFIG[r.status];
          return (
            <div key={r.id} className="table-row" style={{ gridTemplateColumns: COL, cursor: "pointer" }} onClick={() => setSelected(r)}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#B08090" }}>{r.id}</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#3A1A28" }}>{r.customer}</div>
                <div style={{ fontSize: "12px", color: "#B08090" }}>{r.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "#3A1A28" }}>{r.item}</div>
                <div style={{ fontSize: "11px", color: "#B08090" }}>{r.kategori}</div>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#8A4060" }}>{r.rentDate}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: r.status === "terlambat" ? "#D94060" : "#8A4060", fontWeight: r.status === "terlambat" ? 700 : 400 }}>
                {r.returnDate}
              </span>
              <span style={{ display: "inline-flex", background: sc.bg, color: sc.color, fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" as const }}>
                {sc.label}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#C9922A", fontWeight: 600 }}>{formatRupiah(r.total)}</span>
            </div>
          );
        })}
      </div>

      {/* Modal detail */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(90,20,40,0.3)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={() => setSelected(null)}>
          <div style={{ background: "white", border: "1px solid #E8C0D0", borderRadius: "12px", width: "100%", maxWidth: "480px", overflow: "hidden", boxShadow: "0 20px 60px rgba(196,114,142,0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0D9E0", background: "#FAEAF0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#7A2848" }}>Detail Sewa {selected.id}</div>
                <span style={{ display: "inline-block", marginTop: "4px", background: STATUS_CONFIG[selected.status].bg, color: STATUS_CONFIG[selected.status].color, fontSize: "12px", fontWeight: 600, padding: "2px 10px", borderRadius: "20px" }}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#B08090", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { label: "Pelanggan",    value: selected.customer       },
                { label: "WhatsApp",     value: selected.phone          },
                { label: "Item",         value: selected.item           },
                { label: "Kategori",     value: selected.kategori       },
                { label: "Tanggal Sewa", value: selected.rentDate       },
                { label: "Batas Kembali",value: selected.returnDate     },
                { label: "Deposit",      value: formatRupiah(selected.deposit), accent: false },
                { label: "Total",        value: formatRupiah(selected.total),   accent: true  },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0D9E0" }}>
                  <span style={{ fontSize: "13px", color: "#B08090", fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: "14px", color: row.accent ? "#C4728E" : "#3A1A28", fontWeight: row.accent ? 700 : 500 }}>{row.value}</span>
                </div>
              ))}
              {selected.status === "dipinjam" && (
                <button
                  onClick={() => {
                    setRentals((prev) => prev.map((r) => r.id === selected.id ? { ...r, status: "dikembalikan" } : r));
                    setSelected(null);
                  }}
                  style={{ marginTop: "16px", width: "100%", background: "rgba(42,140,90,0.1)", border: "1px solid rgba(42,140,90,0.3)", color: "#1A7A4A", padding: "12px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  ✓ Tandai Sudah Dikembalikan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}