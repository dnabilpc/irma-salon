// app/admin/customers/page.tsx
// Halaman Manajemen Pelanggan
// TODO: Implementasi list pelanggan dari database PostgreSQL

export default function CustomersPage() {
  return (
    <div style={{ padding: "24px" }}>

      {/* Header halaman */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            marginBottom: "6px",
          }}
        >
          Data Pelanggan
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Kelola akun dan riwayat pelanggan
        </p>
      </div>

      {/* Placeholder konten */}
      <div
        style={{
          background: "#1A0F05",
          border: "1px dashed #3A2A1A",
          borderRadius: "4px",
          padding: "64px 24px",
          textAlign: "center" as const,
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "2rem" }}>👤</span>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          Halaman ini sedang dalam pengembangan
        </p>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.7rem",
            color: "rgba(201,146,42,0.4)",
          }}
        >
          TODO: List pelanggan + riwayat booking + detail akun
        </p>
      </div>

    </div>
  );
}