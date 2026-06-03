// components/layout/public/Navbar.tsx
// Navbar halaman publik — transparan saat di atas, solid saat di-scroll
// Auth-aware: tampilan berbeda saat sudah login / belum login
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { NAV_ITEMS } from "@/constants/data";
import type { NavLink } from "@/types";

export default function Navbar() {
  const router   = useRouter();
  const { data: session, isPending } = useSession();

  const [scrolled,    setScrolled]    = useState<boolean>(false);
  const [loggingOut,  setLoggingOut]  = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    if (showDropdown) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showDropdown]);

  async function handleSignOut() {
    setLoggingOut(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/"),
        onError:   () => setLoggingOut(false),
      },
    });
  }

  const user      = session?.user;
  const isAdmin   = (user as { role?: string } | undefined)?.role === "ADMIN";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
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
      }}
    >
      {/* ── Logo ── */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#6B3A2A",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Rumah Cantik
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              color: "#C9922A",
              textTransform: "uppercase" as const,
            }}
          >
            Irma Salon & Sewa Baju
          </span>
        </div>
      </Link>

      {/* ── Desktop links ── */}
      <div
        className="nav-desktop"
        style={{ display: "flex", gap: "36px", alignItems: "center" }}
      >
        {/* Nav links */}
        {NAV_ITEMS.map((item: NavLink) => (
          <Link
            key={item.label}
            href={item.href}
            className="nav-link"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {item.label}
          </Link>
        ))}

        {/* ── Auth area ── */}
        {isPending ? (
          // Loading state — placeholder agar layout tidak loncat
          <div style={{ width: "80px" }} />
        ) : user ? (
          // ── Sudah login ──
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

            {/* Tombol booking */}
            <Link href="/booking">
              <button
                className="btn-primary"
                style={{ padding: "9px 20px", fontSize: "0.78rem" }}
              >
                Booking
              </button>
            </Link>

            {/* Avatar + dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown((prev) => !prev);
                }}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: showDropdown ? "2px solid #C9922A" : "2px solid transparent",
                  overflow: "hidden",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "border-color 0.2s",
                  flexShrink: 0,
                  background: "#F5E6E0",
                  padding: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.image || "/avatar_placeholder.png"}
                  alt="Avatar"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </button>

              {/* Dropdown menu */}
              {showDropdown && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "48px",
                    right: 0,
                    background: "white",
                    border: "1px solid #EDD8CC",
                    borderRadius: "8px",
                    boxShadow: "0 8px 32px rgba(107,58,42,0.12)",
                    minWidth: "200px",
                    overflow: "hidden",
                    zIndex: 200,
                  }}
                >
                  {/* Info user */}
                  <div
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid #EDD8CC",
                      background: "#FDFAF7",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#2C1A0E",
                        marginBottom: "2px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.72rem",
                        color: "#8B6A5A",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.email}
                    </div>
                  </div>

                  {/* Menu items */}
                  {[
                    isAdmin
                      ? { label: "Admin Dashboard", href: "/admin/dashboard", icon: "▦" }
                      : { label: "Dashboard Saya",   href: "/dashboard",       icon: "🏠" },
                    { label: "Booking Layanan",       href: "/booking",         icon: "📅" },
                    { label: "Sewa Baju",             href: "/sewa",            icon: "👗" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      style={{ textDecoration: "none" }}
                      onClick={() => setShowDropdown(false)}
                    >
                      <div
                        style={{
                          padding: "11px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.82rem",
                          color: "#2C1A0E",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          borderBottom: "1px solid #F5EDE5",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FDF8F3")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ fontSize: "0.9rem", width: "18px", textAlign: "center" as const }}>
                          {item.icon}
                        </span>
                        {item.label}
                      </div>
                    </Link>
                  ))}

                  {/* Keluar */}
                  <button
                    onClick={handleSignOut}
                    disabled={loggingOut}
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.82rem",
                      color: "#DC5050",
                      background: "none",
                      border: "none",
                      cursor: loggingOut ? "not-allowed" : "pointer",
                      transition: "background 0.15s",
                      opacity: loggingOut ? 0.6 : 1,
                      textAlign: "left" as const,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,80,80,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: "0.9rem", width: "18px", textAlign: "center" as const }}>
                      🚪
                    </span>
                    {loggingOut ? "Keluar..." : "Keluar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // ── Belum login ──
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link href="/login">
              <button
                className="btn-outline"
                style={{ padding: "9px 20px", fontSize: "0.78rem" }}
              >
                Masuk
              </button>
            </Link>
            <Link href="/register">
              <button
                className="btn-primary"
                style={{ padding: "9px 20px", fontSize: "0.78rem" }}
              >
                Daftar
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Mobile: hamburger placeholder ── */}
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
        aria-label="Menu"
      >
        ☰
      </button>
    </nav>
  );
}