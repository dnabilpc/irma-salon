// components/layout/public/Navbar.tsx
// Navbar halaman publik — transparan saat di atas, solid saat di-scroll
// Client Component karena ada scroll effect dengan useEffect
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "@/constants/data";

export default function Navbar() {
  const [scrolled, setScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? "rgba(253,248,243,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #EDD8CC" : "none",
        transition: "all 0.3s ease",
        padding: "0 5%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "72px",
      }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#6B3A2A",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>
            Irma Wedding Salon
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              color: "#C9922A",
              textTransform: "uppercase" as const,
            }}>
            Salon & Sewa Baju
          </span>
        </div>
      </Link>

      {/* Desktop links */}
      <div
        className="nav-desktop"
        style={{ display: "flex", gap: "36px", alignItems: "center" }}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="nav-link"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {item.label}
          </Link>
        ))}

        {/* CTA */}
        <Link href="/booking">
          <button
            className="btn-primary"
            style={{ padding: "10px 24px", fontSize: "0.8rem" }}>
            Booking Sekarang
          </button>
        </Link>
      </div>

      {/* Mobile: hamburger placeholder */}
      <button
        style={{
          display: "none",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "1.4rem",
          color: "#6B3A2A",
        }}
        className="nav-mobile-btn"
        aria-label="Menu">
        ☰
      </button>
    </nav>
  );
}
