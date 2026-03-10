// app/not-found.tsx
// Halaman 404 custom — muncul saat URL tidak ditemukan

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FDF8F3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px",
        textAlign: "center",
      }}
    >
      {/* Angka 404 */}
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "6rem",
          fontWeight: 700,
          color: "#EDD8CC",
          lineHeight: 1,
          marginBottom: "8px",
        }}
      >
        404
      </div>

      {/* Ornamen */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "8px 0 20px" }}>
        <div style={{ width: "48px", height: "1px", background: "#EDD8CC" }} />
        <span style={{ color: "#C9922A", fontSize: "0.9rem" }}>+</span>
        <div style={{ width: "48px", height: "1px", background: "#EDD8CC" }} />
      </div>

      {/* Teks */}
      <h1
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.4rem",
          fontWeight: 600,
          color: "#2C1A0E",
          marginBottom: "12px",
        }}
      >
        Halaman Tidak Ditemukan
      </h1>
      <p
        style={{
          fontSize: "0.9rem",
          color: "#8B6A5A",
          maxWidth: "360px",
          lineHeight: 1.7,
          marginBottom: "32px",
        }}
      >
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>

      {/* Tombol kembali */}
      <Link href="/">
        <button
          style={{
            background: "#6B3A2A",
            color: "white",
            border: "none",
            padding: "12px 32px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            borderRadius: "2px",
            transition: "background 0.2s",
          }}
        >
          Kembali ke Beranda
        </button>
      </Link>
    </div>
  );
}