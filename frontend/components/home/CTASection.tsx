// components/home/CTASection.tsx
// Section Call-to-Action di bagian bawah homepage
// Server Component (tidak perlu "use client")

import SectionLabel from "@/components/ui/SectionLabel";
import DividerOrnament from "@/components/ui/DividerOrnament";

export default function CTASection() {
  return (
    <section id="tentang" style={{ padding: "100px 5%", background: "#FDF8F3", textAlign: "center" as const }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        <SectionLabel>Siap tampil cantik?</SectionLabel>
        <DividerOrnament />

        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 700,
            color: "#2C1A0E",
            marginBottom: "20px",
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          Booking Sekarang,
          <br />
          <em style={{ color: "#6B3A2A" }}>Tampil Percaya Diri</em>
        </h2>

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "#8B6A5A",
            marginBottom: "40px",
            lineHeight: 1.7,
            fontSize: "1rem",
          }}
        >
          Reservasi layanan salon dan sewa baju favoritmu hanya dalam beberapa
          klik. Tersedia 7 hari seminggu.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap" as const,
          }}
        >
          <button
            className="btn-primary"
            style={{ fontSize: "1rem", padding: "16px 40px" }}
          >
            Booking Layanan Salon
          </button>
          <button
            className="btn-outline"
            style={{ fontSize: "1rem", padding: "16px 40px" }}
          >
            Sewa Baju
          </button>
        </div>
      </div>
    </section>
  );
}