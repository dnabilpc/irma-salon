"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { NavItemConfig } from "@/types";

interface AdminSideBarProps {
  userName?: string;
  userRole?: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { icon: "▦",  label: "Dashboard",     id: "dashboard"           },
  { icon: "📅", label: "Booking Salon", id: "bookings",  badge: 2 },
  { icon: "👗", label: "Sewa Baju",     id: "rentals",   badge: 1 },
  { icon: "👤", label: "Pelanggan",     id: "customers"           },
  { icon: "💳", label: "Pembayaran",    id: "payments"            },
  { icon: "⚙️", label: "Pengaturan",    id: "settings"            },
];

export default function AdminSidebar({ userName, userRole }: AdminSideBarProps) {
  const [expanded, setExpanded] = useState<boolean>(true);
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: expanded ? "230px" : "62px",
        background: "white",
        borderRight: "1px solid #F0E0E6",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transition: "width 0.3s ease",
        overflow: "hidden",
        boxShadow: "2px 0 12px rgba(196,120,138,0.06)",
      }}
    >
      {/* ── Logo / Header ── */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid #F0E0E6",
          minHeight: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "space-between" : "center",
          background: "linear-gradient(135deg, #FDF8F3 0%, #FDF0F4 100%)",
        }}
      >
        {expanded ? (
          <>
            <div>
              {/* Ornamen kecil */}
              <div style={{
                fontSize: "0.55rem",
                letterSpacing: "0.2em",
                color: "#C4788A",
                textTransform: "uppercase",
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: "2px",
                fontWeight: 500,
              }}>
                ✦ Admin Panel
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#2C1A0E",
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
              >
                Rumah Cantik
                <span style={{ color: "#C4788A" }}> Irma</span>
              </div>
            </div>
            <button
              onClick={() => setExpanded(false)}
              title="Ciutkan sidebar"
              style={{
                background: "rgba(196,120,138,0.08)",
                border: "1px solid #F0E0E6",
                color: "#C4788A",
                cursor: "pointer",
                fontSize: "0.75rem",
                padding: "5px 8px",
                lineHeight: 1,
                borderRadius: "6px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(196,120,138,0.16)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(196,120,138,0.08)")}
            >
              ←
            </button>
          </>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            title="Perluas sidebar"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#C4788A",
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
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Label section */}
        {expanded && (
          <div style={{
            fontSize: "0.6rem",
            letterSpacing: "0.18em",
            color: "#B09080",
            textTransform: "uppercase",
            fontFamily: "'DM Sans', sans-serif",
            padding: "6px 10px 4px",
            fontWeight: 600,
          }}>
            Menu Utama
          </div>
        )}

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
                gap: "10px",
                padding: expanded ? "10px 12px" : "10px",
                textDecoration: "none",
                background: isActive
                  ? "linear-gradient(135deg, rgba(196,120,138,0.12) 0%, rgba(196,120,138,0.06) 100%)"
                  : "transparent",
                borderRadius: "10px",
                color: isActive ? "#C4788A" : "#7A5C50",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.2s",
                position: "relative",
                justifyContent: expanded ? "flex-start" : "center",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(196,120,138,0.06)";
                  (e.currentTarget as HTMLElement).style.color = "#C4788A";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#7A5C50";
                }
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: "20%",
                  height: "60%",
                  width: "3px",
                  background: "#C4788A",
                  borderRadius: "0 3px 3px 0",
                }} />
              )}

              {/* Icon */}
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>
                {item.icon}
              </span>

              {/* Label + badge */}
              {expanded && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      style={{
                        background: "#C4788A",
                        color: "white",
                        fontSize: "0.6rem",
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
          padding: "12px 12px",
          borderTop: "1px solid #F0E0E6",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
          background: "#FDFAF7",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            flexShrink: 0,
            background: "linear-gradient(135deg, #C4788A, #C9922A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "white",
            boxShadow: "0 2px 8px rgba(196,120,138,0.3)",
          }}
        >
          {userName ? userName.slice(0, 2).toUpperCase() : "IR"}
        </div>

        {expanded && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#2C1A0E",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userName ?? "Admin"}
            </div>
            <div style={{ fontSize: "0.62rem", color: "#C4788A", fontWeight: 500 }}>
              {userRole ?? "Administrator"}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}