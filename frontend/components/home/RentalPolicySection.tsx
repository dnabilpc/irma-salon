// components/home/RentalPolicySection.tsx
// Section Kebijakan Sewa pada Homepage
"use client";

import SectionLabel from "@/components/ui/SectionLabel";
import DividerOrnament from "@/components/ui/DividerOrnament";

export default function RentalPolicySection() {
  const policies = [
    {
      icon: "⏰",
      title: "Waktu Pengembalian",
      desc: "Durasi sewa standar adalah 3 hari (ambil H-1, gunakan hari H, kembalikan H+1). Jam operasional pengembalian dari pukul 09.00 - 18.00 WIB.",
    },
    {
      icon: "💸",
      title: "Denda Keterlambatan",
      desc: "Keterlambatan pengembalian baju di luar batas kesepakatan awal dikenakan denda administratif per hari (misal 10% dari tarif sewa per baju).",
    },
    {
      icon: "✨",
      title: "Kebersihan & Laundry",
      desc: "Penyewa tidak perlu mencuci baju yang disewa. Biaya sewa sudah termasuk laundry standard. Harap menjaga pakaian agar terhindar dari noda membandel.",
    },
    {
      icon: "🛡️",
      title: "Kerusakan & Kehilangan",
      desc: "Kerusakan ringan (jahitan lepas) ditoleransi. Kerusakan berat (robek, terbakar) atau kehilangan kelengkapan aksesoris dikenakan biaya ganti rugi sesuai kondisi.",
    },
  ];

  return (
    <section id="kebijakan-sewa" style={{ padding: "100px 5%", background: "#FDF8F3" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <SectionLabel>Syarat & Aturan</SectionLabel>
          <DividerOrnament />
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#2C1A0E",
              fontFamily: "'Playfair Display', Georgia, serif",
              marginTop: "16px",
            }}
          >
            Kebijakan Sewa Baju
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.95rem",
              color: "rgba(44, 26, 14, 0.6)",
              maxWidth: "540px",
              margin: "12px auto 0",
              lineHeight: 1.6,
            }}
          >
            Harap membaca syarat dan ketentuan penyewaan busana di Irma Wedding Salon demi kenyamanan bersama.
          </p>
        </div>

        {/* Grid Kebijakan */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "28px",
          }}
        >
          {policies.map((p, idx) => (
            <div
              key={idx}
              style={{
                background: "white",
                padding: "36px 28px",
                border: "1px solid #EDD8CC",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(44, 26, 14, 0.02)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.borderColor = "#C9922A";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(44, 26, 14, 0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#EDD8CC";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(44, 26, 14, 0.02)";
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "20px",
                  display: "inline-block",
                }}
              >
                {p.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#2C1A0E",
                  marginBottom: "12px",
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                  color: "rgba(44, 26, 14, 0.65)",
                }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
