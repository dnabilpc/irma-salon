import { HERO_STATS } from "@/constants/data";
import type { Stat } from "@/types";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      id="beranda"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #FDF8F3 0%, #F5E6E0 40%, #EDD8CC 100%)",
        display: "flex",
        alignItems: "center",
        padding: "100px 5% 60px",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Decorative background blobs */}
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(201,146,42,0.06)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "10%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "rgba(232,168,156,0.12)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "45%",
          width: "2px",
          height: "60%",
          background: "rgba(107,58,42,0.08)",
          pointerEvents: "none",
        }}
      />

      <div
        className="hero-grid"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "80px",
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
        }}>
        {/* ── Kiri: teks ── */}
        <div className="animate-hero" style={{ flex: 1 }}>
          {/* Badge AI */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #6B3A2A, #C9922A)",
              color: "white",
              padding: "8px 18px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              borderRadius: "2px",
              marginBottom: "28px",
            }}>
            <span>✨</span> NEW: Virtual Try-On berbasis AI
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: "24px",
              color: "#2C1A0E",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>
            Kecantikanmu,
            <br />
            <em style={{ color: "#6B3A2A", fontStyle: "italic" }}>
              Dimulai Di Sini
            </em>
          </h1>

          {/* Deskripsi */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "1.05rem",
              lineHeight: 1.7,
              color: "#8B6A5A",
              marginBottom: "40px",
              maxWidth: "460px",
              fontWeight: 300,
            }}>
            Salon & persewaan baju premium dengan teknologi Virtual Try-On
            berbasis AI. Coba baju favoritmu secara virtual sebelum menyewa —
            langsung dari browser-mu.
          </p>

          {/* CTA buttons */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "56px",
            }}>
            <Link href="/booking">
              <button className="btn-primary">Booking Sekarang</button>
            </Link>
            <Link href="/virtual-try-on">
              <button className="btn-outline">Coba Virtual Try-On</button>
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-row" style={{ display: "flex", gap: "40px" }}>
            {HERO_STATS.map(({ value, label }: Stat) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: "2.8rem",
                    fontWeight: 700,
                    color: "#6B3A2A",
                    lineHeight: 1,
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}>
                  {value}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.8rem",
                    color: "#8B6A5A",
                    marginTop: "4px",
                    letterSpacing: "0.05em",
                  }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Kanan: visual card ── */}
        <div
          className="animate-hero-2"
          style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

// ── Sub-komponen: visual card kanan (private, hanya dipakai di file ini) ──

function HeroVisual() {
  return (
    <div style={{ position: "relative", width: "360px", height: "460px" }}>
      {/* Kartu utama */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "20px",
          right: 0,
          bottom: "20px",
          background: "linear-gradient(145deg, #6B3A2A, #C9922A)",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          color: "white",
        }}>
        <div style={{ fontSize: "5rem", marginBottom: "16px" }}>👗</div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase" as const,
            opacity: 0.8,
            marginBottom: "8px",
          }}>
          Virtual Try-On
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "24px",
            textAlign: "center" as const,
          }}>
          Coba Dulu, Sewa Kemudian
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.2)",
            borderRadius: "4px",
            padding: "14px 24px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
            textAlign: "center" as const,
          }}>
          📷 Aktifkan kamera untuk
          <br />
          mulai Virtual Try-On
        </div>
      </div>

      {/* Badge mengambang: atas */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: 0,
          background: "white",
          padding: "14px 20px",
          borderRadius: "4px",
          boxShadow: "0 8px 32px rgba(107,58,42,0.15)",
          fontFamily: "'DM Sans', sans-serif",
          zIndex: 2,
        }}>
        <div
          style={{ fontSize: "0.7rem", color: "#8B6A5A", marginBottom: "4px" }}>
          Booking hari ini
        </div>
        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#2C1A0E" }}>
          12 slot tersedia ✓
        </div>
      </div>

      {/* Badge mengambang: bawah */}
      <div
        style={{
          position: "absolute",
          top: "400px",
          left: 0,
          background: "white",
          padding: "14px 20px",
          borderRadius: "4px",
          boxShadow: "0 8px 32px rgba(107,58,42,0.15)",
          fontFamily: "'DM Sans', sans-serif",
          zIndex: 2,
        }}>
        <div
          style={{ fontSize: "0.7rem", color: "#8B6A5A", marginBottom: "4px" }}>
          Rating pelanggan
        </div>
        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#C9922A" }}>
          ★★★★★ 4.9/5
        </div>
      </div>
    </div>
  );
}
