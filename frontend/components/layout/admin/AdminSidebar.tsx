// components/layout/admin/AdminSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { NavItemConfig } from "@/types";
import { fetchSidebarCounts } from "@/actions/admin";

interface AdminSidebarProps {
  userName: string;
  userRole: string;
  userImage?: string | null;
}

const NAV_ITEMS: NavItemConfig[] = [
  { icon: "▦",  label: "Dashboard",     id: "dashboard"           },
  { icon: "", label: "Katalog Jasa Salon", id: "services-catalogue" },
  { icon: "", label: "Katalog Pakaian Sewaan", id: "clothes-catalogue" },
  { icon: "📅", label: "Booking Salon", id: "bookings"            },
  { icon: "👗", label: "Sewa Baju",     id: "rentals"             },
  { icon: "👤", label: "Pelanggan",     id: "customers"           },
  { icon: "💳", label: "Pembayaran",    id: "payments"            },
  { icon: "⚙️", label: "Pengaturan",    id: "settings"            },
];

export default function AdminSidebar({ userName, userRole, userImage }: AdminSidebarProps) {
  const [expanded, setExpanded] = useState<boolean>(true);
  const pathname = usePathname();
  const [counts, setCounts] = useState({ bookings: 0, rentals: 0, customers: 0, payments: 0 });

  // Load and refresh counts on route changes or periodically
  useEffect(() => {
    async function loadCounts() {
      const res = await fetchSidebarCounts();
      if (res.success && res.data) {
        setCounts(res.data);
      }
    }
    loadCounts();
    const interval = setInterval(loadCounts, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [pathname]);

  // Sync sidebar minimization class with body
  useEffect(() => {
    if (expanded) {
      document.body.classList.remove("sidebar-collapsed");
    } else {
      document.body.classList.add("sidebar-collapsed");
    }
    // Cleanup on unmount
    return () => {
      document.body.classList.remove("sidebar-collapsed");
    };
  }, [expanded]);

  // Force expanded true on mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setExpanded(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // run initially
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <aside
      className="admin-sidebar"
      style={{
        width: expanded ? "220px" : "58px",
        background: "#F2D8E4",
        borderRight: "1px solid #E8C0D0",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        overflow: "hidden",
        boxShadow: "2px 0 8px rgba(196,114,142,0.08)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid #E8C0D0",
          minHeight: "66px",
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "space-between" : "center",
          background: "#EEC8D8",
        }}
      >
        {expanded ? (
          <>
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#7A2848",
                  letterSpacing: "0.02em",
                }}
              >
                Irma Wedding Salon
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.18em",
                  color: "#B06080",
                  textTransform: "uppercase" as const,
                  marginTop: "2px",
                }}
              >
                Admin Panel
              </div>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="admin-sidebar-toggle-btn"
              style={{
                background: "rgba(255,255,255,0.5)",
                border: "1px solid #E8C0D0",
                color: "#B06080",
                cursor: "pointer",
                fontSize: "0.75rem",
                padding: "5px 9px",
                borderRadius: "6px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "white")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.5)")}
            >
              ←
            </button>
          </>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "#7A2848",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            IWS
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto", overflowX: "hidden" }}>
        {expanded && (
          <div
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.16em",
              color: "#B06080",
              textTransform: "uppercase" as const,
              fontFamily: "'DM Sans', sans-serif",
              padding: "6px 16px 4px",
              fontWeight: 600,
            }}
          >
            Menu Utama
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const href     = `/admin/${item.id}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const badgeVal = item.id === "bookings" ? counts.bookings :
                           item.id === "rentals" ? counts.rentals :
                           item.id === "customers" ? counts.customers :
                           item.id === "payments" ? counts.payments :
                           undefined;

          return (
            <Link
              key={item.id}
              href={href}
              onClick={() => document.body.classList.remove("sidebar-open")}
              title={!expanded ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: expanded ? "10px 16px" : "10px",
                textDecoration: "none",
                background: isActive ? "#F9EAF0" : "transparent",
                borderLeft: isActive ? "3px solid #C4728E" : "3px solid transparent",
                color: isActive ? "#7A2848" : "#8A4060",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.2s",
                justifyContent: expanded ? "flex-start" : "center",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "#F9EAF0";
                  (e.currentTarget as HTMLElement).style.color = "#7A2848";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#8A4060";
                }
              }}
            >
              <span style={{ fontSize: "1rem", flexShrink: 0, width: "20px", textAlign: "center" as const }}>
                {item.icon}
              </span>
              {expanded && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badgeVal !== undefined && badgeVal > 0 && (
                    <span
                      style={{
                        background: "#C4728E",
                        color: "white",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: "10px",
                        flexShrink: 0,
                      }}
                    >
                      {badgeVal}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid #E8C0D0",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#EEC8D8",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            flexShrink: 0,
            border: "1.5px solid #C4728E",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(196,114,142,0.15)",
            background: "white",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={userImage || "/avatar_placeholder.png"}
            alt="Avatar"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        {expanded && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#7A2848",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userName}
            </div>
            <div style={{ fontSize: "11px", color: "#B06080" }}>{userRole}</div>
          </div>
        )}
      </div>
    </aside>
  );
}