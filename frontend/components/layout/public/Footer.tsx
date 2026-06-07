"use client";
import { FOOTER_COLUMNS } from "@/constants/data";
import type { FooterColumn } from "@/types";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#2C1A0E",
        color: "rgba(255,255,255,0.7)",
        padding: "64px 5% 32px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Kolom-kolom footer */}
      <div
        className="footer-grid"
        style={{
          display: "flex",
          gap: "60px",
          maxWidth: "1200px",
          margin: "0 auto",
          marginBottom: "48px",
        }}
      >
        {/* Kolom brand */}
        <div style={{ flex: 2 }}>
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "white",
              marginBottom: "4px",
            }}
          >
            Irma Wedding Salon
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              color: "#C9922A",
              textTransform: "uppercase" as const,
              marginBottom: "20px",
            }}
          >
            Salon & Sewa Baju
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.8,
              maxWidth: "300px",
              fontWeight: 300,
            }}
          >
            Graha Suko Indah B-1, Kecamatan Sukodono,
            <br />
            Kabupaten Sidoarjo, Jawa Timur.
          </p>
          <p style={{ fontSize: "0.875rem", marginTop: "12px" }}>
            📱 085174481660
          </p>

          {/* Social media */}
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            {[
              { platform: "Instagram", href: "https://instagram.com" },
              { platform: "WhatsApp", href: "https://wa.me/6285174481660" },
              { platform: "TikTok", href: "https://tiktok.com" },
            ].map(({ platform, href }) => (
              <a
                key={platform}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  padding: "6px 12px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  borderRadius: "2px",
                  transition: "all 0.2s",
                  textDecoration: "none",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(201,146,42,0.15)";
                  e.currentTarget.style.color = "#C9922A";
                  e.currentTarget.style.borderColor = "rgba(201,146,42,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                {platform}
              </a>
            ))}
          </div>
        </div>

        {/* Kolom link */}
        {FOOTER_COLUMNS.map(({ title, items }: FooterColumn) => (
          <div key={title} style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 600,
                color: "white",
                fontSize: "0.85rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                marginBottom: "20px",
              }}
            >
              {title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    textDecoration: "none",
                    textAlign: "left" as const,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#E8A89C")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: "28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap" as const,
          gap: "16px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <span style={{ fontSize: "0.8rem" }}>
          © 2026 Irma Wedding Salon. All rights reserved.
        </span>
        <span style={{ fontSize: "0.8rem", color: "#C9922A" }}>
          Dibuat dengan ❤ untuk Tugas Akhir Telkom University Surabaya
        </span>
      </div>
    </footer>
  );
}