// components/home/TestimonialSection.tsx
// Section testimoni — auto-slide setiap 4 detik, bisa klik dots
// Client Component karena ada auto-rotate dengan useEffect
"use client";

import { useState, useEffect } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import DividerOrnament from "@/components/ui/DividerOrnament";
import { TESTIMONIALS } from "@/constants/data";
import type { Testimonial } from "@/types";

export default function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Auto-rotate setiap 4 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const active: Testimonial = TESTIMONIALS[activeIndex];

  return (
    <section style={{ padding: "100px 5%", background: "#F5E6E0" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" as const }}>

        <SectionLabel>Kata Mereka</SectionLabel>
        <DividerOrnament />

        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 700,
            color: "#2C1A0E",
            marginBottom: "60px",
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          Testimoni Pelanggan
        </h2>

        {/* Kartu testimoni */}
        <div
          style={{
            background: "white",
            padding: "48px",
            border: "1px solid #EDD8CC",
            position: "relative",
            minHeight: "200px",
          }}
        >
          {/* Tanda kutip dekoratif */}
          <div
            style={{
              fontSize: "5rem",
              color: "#E8A89C",
              position: "absolute",
              top: "20px", left: "32px",
              lineHeight: 1,
              fontFamily: "Georgia, serif",
              opacity: 0.4,
              pointerEvents: "none",
              userSelect: "none" as const,
            }}
          >
            
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Teks testimoni */}
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1.05rem",
                lineHeight: 1.8,
                color: "#2C1A0E",
                fontWeight: 300,
                marginBottom: "28px",
                fontStyle: "italic",
              }}
            >
              {active.text}
            </p>

            {/* Info penulis */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "44px", height: "44px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6B3A2A, #C9922A)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  flexShrink: 0,
                }}
              >
                {active.avatar}
              </div>

              {/* Nama & rating */}
              <div style={{ textAlign: "left" as const }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#2C1A0E" }}>
                  {active.name}
                </div>
                <div style={{ color: "#C9922A", fontSize: "0.85rem" }}>
                  {"★".repeat(active.rating)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginTop: "28px",
          }}
        >
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              className={`testimonial-dot${i === activeIndex ? " active" : ""}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Testimoni ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}