"use client";

import { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import DividerOrnament from "@/components/ui/DividerOrnament";
import { AR_OUTFITS, VTO_FEATURES } from "@/constants/data";
import Link from "next/link";

export default function VirtualTryOnSection() {
  const [selectedOutfit, setSelectedOutfit] = useState<number>(0);

  return (
    <section
      id="virtual-try-on"
      style={{
        padding: "100px 5%",
        background: "linear-gradient(135deg, #2C1A0E, #6B3A2A)",
      }}>
      <div
        className="vto-section"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          gap: "80px",
          alignItems: "center",
        }}>
        {/* ── Kiri: teks penjelasan ── */}
        <div style={{ flex: 1, minWidth: "280px" }}>
          <SectionLabel light>Teknologi Terkini</SectionLabel>
          <DividerOrnament light />

          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "white",
              marginBottom: "24px",
              lineHeight: 1.15,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>
            Virtual Try-On
            <br />
            <em style={{ color: "#E8A89C" }}>Berbasis AI</em>
          </h2>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "rgba(255,255,255,0.7)",
              fontSize: "1rem",
              lineHeight: 1.8,
              marginBottom: "36px",
              fontWeight: 300,
            }}>
            Tidak perlu repot datang ke salon hanya untuk cek pakaian. Dengan
            teknologi WebAR kami, kamu bisa mencoba berbagai koleksi baju secara
            virtual langsung dari kamera browsermu — kapan saja, di mana saja.
          </p>

          {/* Feature list */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "40px",
            }}>
            {VTO_FEATURES.map((feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  fontFamily: "'DM Sans', sans-serif",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "0.9rem",
                }}>
                <span
                  style={{
                    color: "#C9922A",
                    fontSize: "1rem",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}>
                  ✦
                </span>
                {feature}
              </div>
            ))}
          </div>
          <Link href="/virtual-try-on">
            <button
              className="btn-primary"
              style={{ background: "#E8A89C", color: "#2C1A0E" }}>
              Coba Virtual Try-On Sekarang →
            </button>
          </Link>
        </div>

        {/* ── Kanan: AR mockup ── */}
        <div
          style={{
            flex: 1,
            minWidth: "280px",
            display: "flex",
            justifyContent: "center",
          }}>
          <ARMockup
            selectedOutfit={selectedOutfit}
            onSelectOutfit={setSelectedOutfit}
          />
        </div>
      </div>
    </section>
  );
}

// ── Sub-komponen: AR mockup (private, hanya dipakai di file ini) ──

interface ARMockupProps {
  selectedOutfit: number;
  onSelectOutfit: (index: number) => void;
}

function ARMockup({ selectedOutfit, onSelectOutfit }: ARMockupProps) {
  return (
    <div style={{ width: "300px" }}>
      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "4px",
          padding: "30px",
          textAlign: "center" as const,
        }}>
        {/* Area preview kamera */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: "4px",
            height: "220px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            border: "1px dashed rgba(232,168,156,0.4)",
          }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "12px" }}>
            {AR_OUTFITS[selectedOutfit]}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.1em",
            }}>
            KAMERA AKTIF
          </div>
          <div
            style={{
              width: "60px",
              height: "2px",
              background: "#E8A89C",
              margin: "8px auto",
            }}
          />
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.4)",
            }}>
            AR body tracking...
          </div>
        </div>

        {/* Pilihan outfit */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          {AR_OUTFITS.map((outfit, i) => (
            <button
              key={i}
              onClick={() => onSelectOutfit(i)}
              style={{
                flex: 1,
                background:
                  i === selectedOutfit ? "#E8A89C" : "rgba(255,255,255,0.08)",
                borderRadius: "4px",
                padding: "12px 0",
                textAlign: "center" as const,
                fontSize: "1.2rem",
                cursor: "pointer",
                border:
                  i === selectedOutfit
                    ? "1px solid #E8A89C"
                    : "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.2s",
              }}>
              {outfit}
            </button>
          ))}
        </div>

        {/* Tombol sewa */}
        <button
          style={{
            width: "100%",
            background: "#E8A89C",
            color: "#2C1A0E",
            border: "none",
            padding: "14px",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            borderRadius: "2px",
          }}>
          Sewa Baju Ini ✓
        </button>
      </div>
    </div>
  );
}
