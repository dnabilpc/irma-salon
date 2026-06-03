"use client";

// app/(auth)/pending-approval/page.tsx
import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <div
      style={{
        background: "white",
        padding: "48px 40px",
        border: "1px solid #EDD8CC",
        width: "100%",
        maxWidth: "460px",
        boxShadow: "0 20px 60px rgba(107,58,42,0.08)",
        borderRadius: "4px",
        textAlign: "center",
      }}
    >
      {/* Salon brand */}
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#6B3A2A", marginBottom: "4px" }}>
        Rumah Cantik Irma
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", letterSpacing: "0.18em", color: "#C9922A", textTransform: "uppercase", marginBottom: "32px" }}>
        Pendaftaran Diterima
      </div>

      {/* Ornamental divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <div style={{ flex: 1, height: "1px", background: "#EDD8CC" }} />
        <span style={{ color: "#C9922A", fontSize: "1.2rem" }}>✦</span>
        <div style={{ flex: 1, height: "1px", background: "#EDD8CC" }} />
      </div>

      {/* Icon */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(201,146,42,0.12), rgba(107,58,42,0.08))",
          border: "2px solid rgba(201,146,42,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "2rem",
        }}
      >
        ⏳
      </div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#6B3A2A",
          marginBottom: "12px",
          lineHeight: 1.3,
        }}
      >
        Pendaftaran Berhasil!
      </h1>

      {/* Body text */}
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#8B6A5A", lineHeight: 1.7, marginBottom: "12px" }}>
        Terima kasih telah mendaftar di <strong style={{ color: "#6B3A2A" }}>Rumah Cantik Irma</strong>.
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#8B6A5A", lineHeight: 1.7, marginBottom: "28px" }}>
        Akun Anda sedang <strong style={{ color: "#C9922A" }}>menunggu verifikasi admin</strong>. Kami akan mengirimkan notifikasi WhatsApp ke nomor yang Anda daftarkan setelah akun disetujui.
      </p>

      {/* Info box */}
      <div
        style={{
          background: "rgba(201,146,42,0.06)",
          border: "1px solid rgba(201,146,42,0.2)",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "32px",
          textAlign: "left",
        }}
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#C9922A", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
          Langkah selanjutnya
        </div>
        {[
          "Tunggu notifikasi WhatsApp dari kami",
          "Setelah disetujui, login menggunakan email yang terdaftar",
          "Nikmati layanan booking dan sewa baju di Rumah Cantik Irma",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: i < 2 ? "8px" : "0" }}>
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "#6B3A2A",
                color: "white",
                fontSize: "0.65rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              {i + 1}
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "#6B3A2A", lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/"
        style={{
          display: "inline-block",
          background: "#6B3A2A",
          color: "white",
          padding: "12px 32px",
          borderRadius: "6px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.85rem",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          textDecoration: "none",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#C9922A")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#6B3A2A")}
      >
        Kembali ke Beranda
      </Link>

      <div style={{ marginTop: "16px" }}>
        <Link
          href="/login"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#8B6A5A", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#6B3A2A")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8B6A5A")}
        >
          Sudah disetujui? Login di sini
        </Link>
      </div>
    </div>
  );
}
