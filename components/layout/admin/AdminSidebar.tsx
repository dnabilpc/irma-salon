// components/layout/admin/AdminSidebar.tsx
// Sidebar navigasi admin — collapsible (220px ↔ 56px)
// Client Component karena ada useState untuk expand/collapse
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { NavItemConfig } from "@/types";

const NAV_ITEMS: NavItemConfig[] = [
  { icon: "▦",  label: "Dashboard",     id: "dashboard"            },
  { icon: "📅", label: "Booking Salon", id: "bookings",  badge: 2  },
  { icon: "👗", label: "Sewa Baju",     id: "rentals",   badge: 1  },
  { icon: "👤", label: "Pelanggan",     id: "customers"            },
  { icon: "💳", label: "Pembayaran",    id: "payments"             },
  { icon: "⚙️", label: "Pengaturan",    id: "settings"             },
];

export default function AdminSidebar() {
  const [expanded, setExpanded] = useState<boolean>(true);
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: expanded ? "220px" : "56px",
        background: "#130900",
        borderRight: "1px solid #2A1A0A",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transition: "width 0.3s ease",
        overflow: "hidden",
      }}
    >
      {/* ── Logo / Header ── */}
      <div
        style={{
          padding: "22px 16px 18px",
          borderBottom: "1px solid #2A1A0A",
          minHeight: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "space-between" : "center",
        }}
      >
        {expanded ? (
          <>
            <div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#C9922A",
                  letterSpacing: "0.05em",
                }}
              >
                Rumah Cantik
              </div>
              <div
                style={{
                  fontSize: "0.58rem",
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                  marginTop: "2px",
                }}
              >
                Admin Panel
              </div>
            </div>
            {/* Tombol collapse */}
            <button
              onClick={() => setExpanded(false)}
              title="Ciutkan sidebar"
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.25)",
                cursor: "pointer",
                fontSize: "0.9rem",
                padding: "4px",
                lineHeight: 1,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
            >
              ←
            </button>
          </>
        ) : (
          /* Tombol expand (collapsed state) */
          <button
            onClick={() => setExpanded(true)}
            title="Perluas sidebar"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#C9922A",
              background: "none",
              border: "none",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            RC
          </button>
        )}
      </div>

      {/* ── Navigasi ── */}
      <nav
        style={{
          flex: 1,
          padding: "10px 0",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const href     = `/admin/${item.id}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.id}
              href={href}
              title={!expanded ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "11px 16px",
                textDecoration: "none",
                background: isActive ? "rgba(201,146,42,0.12)" : "transparent",
                borderLeft: isActive ? "2px solid #C9922A" : "2px solid transparent",
                color: isActive ? "#C9922A" : "rgba(255,255,255,0.4)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem",
                fontWeight: isActive ? 500 : 400,
                transition: "all 0.2s",
                borderRadius: "0 4px 4px 0",
                whiteSpace: "nowrap",
              }}
            >
              {/* Icon */}
              <span
                style={{
                  fontSize: "1rem",
                  width: "20px",
                  textAlign: "center" as const,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>

              {/* Label + badge (hanya saat expanded) */}
              {expanded && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      style={{
                        background: "#C9922A",
                        color: "#1A0F05",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "10px",
                        flexShrink: 0,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Info user di bawah ── */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid #2A1A0A",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        {/* Avatar inisial */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            flexShrink: 0,
            background: "linear-gradient(135deg, #6B3A2A, #C9922A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "white",
          }}
        >
          IR
        </div>

        {/* Nama & role (hanya saat expanded) */}
        {expanded && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.75)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Irma W.
            </div>
            <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)" }}>
              Administrator
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}