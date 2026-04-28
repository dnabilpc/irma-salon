// app/admin/customers/page.tsx
"use client";

import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinDate: string;
  totalBooking: number;
  totalSewa: number;
  totalSpend: number;
  lastVisit: string;
}

const MOCK: Customer[] = [
  { id: "USR-001", name: "Siti Rahayu",   phone: "08123456789", email: "siti@email.com",   joinDate: "Jan 2026", totalBooking: 8,  totalSewa: 2, totalSpend: 1250000, lastVisit: "09 Mar 2026" },
  { id: "USR-002", name: "Dewi Kusuma",   phone: "08234567890", email: "dewi@email.com",   joinDate: "Feb 2026", totalBooking: 3,  totalSewa: 5, totalSpend: 980000,  lastVisit: "09 Mar 2026" },
  { id: "USR-003", name: "Rina Aprilia",  phone: "08345678901", email: "rina@email.com",   joinDate: "Jan 2026", totalBooking: 12, totalSewa: 1, totalSpend: 2100000, lastVisit: "09 Mar 2026" },
  { id: "USR-004", name: "Mega Putri",    phone: "08456789012", email: "mega@email.com",   joinDate: "Mar 2026", totalBooking: 1,  totalSewa: 0, totalSpend: 120000,  lastVisit: "09 Mar 2026" },
  { id: "USR-005", name: "Layla Hanum",   phone: "08567890123", email: "layla@email.com",  joinDate: "Feb 2026", totalBooking: 5,  totalSewa: 3, totalSpend: 890000,  lastVisit: "08 Mar 2026" },
  { id: "USR-006", name: "Nurul Fadilah", phone: "08678901234", email: "nurul@email.com",  joinDate: "Jan 2026", totalBooking: 15, totalSewa: 4, totalSpend: 3200000, lastVisit: "10 Mar 2026" },
  { id: "USR-007", name: "Aisyah Putri",  phone: "08111222333", email: "aisyah@email.com", joinDate: "Mar 2026", totalBooking: 2,  totalSewa: 2, totalSpend: 550000,  lastVisit: "08 Mar 2026" },
  { id: "USR-008", name: "Fitri H.",      phone: "08789012345", email: "fitri@email.com",  joinDate: "Feb 2026", totalBooking: 6,  totalSewa: 1, totalSpend: 760000,  lastVisit: "07 Mar 2026" },
];

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

const COL = "80px 1fr 120px 80px 80px 100px 110px";

export default function CustomersPage() {
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = MOCK.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:      MOCK.length,
    baru:       MOCK.filter((c) => c.joinDate.includes("Mar")).length,
    aktif:      MOCK.filter((c) => c.totalBooking >= 5).length,
    totalSpend: MOCK.reduce((s, c) => s + c.totalSpend, 0),
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#7A2848", marginBottom: "4px" }}>
            Data Pelanggan
          </h1>
          <p style={{ fontSize: "14px", color: "#B06080" }}>Kelola akun dan riwayat pelanggan</p>
        </div>
        <button className="btn-action-gold">↓ Export CSV</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Total Pelanggan",    value: stats.total,              color: "#7A2848" },
          { label: "Pelanggan Baru",     value: stats.baru,               color: "#C9922A" },
          { label: "Pelanggan Aktif",    value: stats.aktif,              color: "#1A7A4A" },
          { label: "Total Pendapatan",   value: formatRupiah(stats.totalSpend), color: "#C4728E" },
        ].map((s) => (
          <div key={s.label} className="admin-card" style={{ padding: "16px 20px" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: "4px" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#B08090" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="admin-card" style={{ padding: "16px 18px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#B08090", pointerEvents: "none" }}>🔍</span>
          <input
            className="search-input"
            placeholder="Cari nama, nomor HP, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="admin-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0D9E0", background: "#FDF8F5" }}>
          <span style={{ fontSize: "13px", color: "#B08090" }}>
            Menampilkan {filtered.length} dari {MOCK.length} pelanggan
          </span>
        </div>

        {/* Header kolom */}
        <div className="table-row" style={{ gridTemplateColumns: COL, background: "#FDF8F5", fontSize: "12px", color: "#B08090", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 600 }}>
          <span>ID</span>
          <span>Pelanggan</span>
          <span>Bergabung</span>
          <span>Booking</span>
          <span>Sewa</span>
          <span>Kunjungan</span>
          <span>Total Spend</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" as const, color: "#B08090", fontSize: "14px" }}>
            Pelanggan tidak ditemukan
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="table-row" style={{ gridTemplateColumns: COL, cursor: "pointer" }} onClick={() => setSelected(c)}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#B08090" }}>{c.id}</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#3A1A28" }}>{c.name}</div>
                <div style={{ fontSize: "12px", color: "#B08090" }}>{c.phone}</div>
              </div>
              <span style={{ fontSize: "13px", color: "#8A4060" }}>{c.joinDate}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#C4728E", fontWeight: 600 }}>{c.totalBooking}x</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#C9922A", fontWeight: 600 }}>{c.totalSewa}x</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#8A4060" }}>{c.lastVisit}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#7A2848", fontWeight: 600 }}>{formatRupiah(c.totalSpend)}</span>
            </div>
          ))
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
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #C4728E, #C9922A)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1rem", fontWeight: 700 }}>
                  {selected.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#7A2848" }}>{selected.name}</div>
                  <div style={{ fontSize: "12px", color: "#B06080" }}>{selected.id}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#B08090", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "24px" }}>
              {[
                { label: "Email",          value: selected.email              },
                { label: "WhatsApp",       value: selected.phone              },
                { label: "Bergabung",      value: selected.joinDate           },
                { label: "Kunjungan Terakhir", value: selected.lastVisit      },
                { label: "Total Booking",  value: `${selected.totalBooking}x` },
                { label: "Total Sewa",     value: `${selected.totalSewa}x`    },
                { label: "Total Pengeluaran", value: formatRupiah(selected.totalSpend), accent: true },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0D9E0" }}>
                  <span style={{ fontSize: "13px", color: "#B08090", fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: "14px", color: (row as { accent?: boolean }).accent ? "#C4728E" : "#3A1A28", fontWeight: (row as { accent?: boolean }).accent ? 700 : 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}