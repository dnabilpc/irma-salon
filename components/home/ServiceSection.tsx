// components/home/ServicesSection.tsx
// Section daftar layanan — grid 3 kolom menggunakan ServiceCard
// Server Component (tidak perlu "use client")

import ServiceCard from "@/components/ui/ServiceCard";
import SectionLabel from "@/components/ui/SectionLabel";
import DividerOrnament from "@/components/ui/DividerOrnament";
import { SERVICES } from "@/constants/data";

export default function ServicesSection() {
  return (
    <section id="layanan" style={{ padding: "100px 5%", background: "white" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Heading */}
        <div style={{ textAlign: "center" as const, marginBottom: "64px" }}>
          <SectionLabel>Apa yang kami tawarkan</SectionLabel>
          <DividerOrnament />
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#2C1A0E",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Layanan Unggulan Kami
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "#8B6A5A",
              marginTop: "16px",
              fontSize: "1rem",
              maxWidth: "500px",
              margin: "16px auto 0",
              lineHeight: 1.7,
            }}
          >
            Dari perawatan kecantikan hingga persewaan baju, semua bisa kamu
            booking online dengan mudah.
          </p>
        </div>

        {/* Grid layanan */}
        <div
          className="services-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
          }}
        >
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}