"use client";

import { useState, useEffect } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import DividerOrnament from "@/components/ui/DividerOrnament";

export default function RentalPolicySection() {
  const [whatsapp, setWhatsapp] = useState("08883229673");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.salon_whatsapp) {
          setWhatsapp(data.salon_whatsapp);
        }
      })
      .catch((err) => console.error("Failed to load settings in RentalPolicySection:", err));
  }, []);

  const formatDisplayPhone = (num: string) => {
    let clean = num.replace(/\D/g, "");
    if (clean.startsWith("62")) {
      return "0" + clean.slice(2);
    }
    return num;
  };

  const policies = [
    {
      icon: "📅",
      title: "Jadwal & Pengambilan",
      desc: `Baju diambil 1 hari sebelum hari H. Pengambilan harus LUNAS dan wajib membawa NOTA serta JAMINAN IDENTITAS. Konfirmasi kedatangan via WhatsApp Admin (${formatDisplayPhone(whatsapp)}).`,
    },
    {
      icon: "⏰",
      title: "Waktu Pengembalian",
      desc: "Baju dikembalikan 1 hari setelah hari H maksimal jam 8 SORE (20.00). Saat mengambil dan mengembalikan baju, NOTA wajib dibawa kembali.",
    },
    {
      icon: "💸",
      title: "Denda & Keterlambatan",
      desc: "Kelebihan hari/terlambat dikenakan denda Rp 5.000/Hari/kostum. Terlambat LEBIH DARI 3 HARI dari batas maksimal dianggap SEWA LAGI.",
    },
    {
      icon: "🛡️",
      title: "Kerusakan & Kehilangan",
      desc: "Barang atau Aksesoris yang RUSAK maupun HILANG WAJIB diganti sesuai harga asli atau dibelikan baru.",
    },
    {
      icon: "✨",
      title: "Kebersihan & Kelengkapan",
      desc: "Baju yang disewa TIDAK PERLU DICUCI (kembali rapi), kecuali baju warna putih WAJIB dicuci sebelum dikembalikan. Kami tidak menyediakan selop/sepatu.",
    },
    {
      icon: "🚫",
      title: "Kebijakan Pembatalan",
      desc: "Baju yang sudah dibawa pulang, UANG TIDAK BISA KEMBALI.",
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
