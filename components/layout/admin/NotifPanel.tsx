// components/layout/admin/NotifPanel.tsx
// Dropdown panel notifikasi di AdminTopbar
// Server Component — data statis, tidak ada interaksi state

import { NOTIFICATIONS } from "@/constants/data";
import type { NotifType } from "@/types";

const NOTIF_ICON: Record<NotifType, string> = {
  booking: "📅",
  payment: "💳",
  review:  "⭐",
  return:  "⚠️",
};

export default function NotifPanel() {
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="notif-panel" onClick={(e) => e.stopPropagation()}>

      {/* Header panel */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #2A1A0A",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky" as const,
          top: 0,
          background: "#1A0F05",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "rgba(255,255,255,0.8)" }}>
            Notifikasi
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                background: "rgba(201,146,42,0.15)",
                color: "#C9922A",
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "10px",
              }}
            >
              {unreadCount} baru
            </span>
          )}
        </div>
        <button
          style={{
            background: "none",
            border: "none",
            fontSize: "0.7rem",
            color: "#C9922A",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Baca semua
        </button>
      </div>

      {/* Daftar notifikasi */}
      {NOTIFICATIONS.map((n) => (
        <div
          key={n.id}
          style={{
            padding: "11px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            background: n.unread ? "rgba(201,146,42,0.04)" : "transparent",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = n.unread
              ? "rgba(201,146,42,0.08)"
              : "rgba(255,255,255,0.03)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = n.unread
              ? "rgba(201,146,42,0.04)"
              : "transparent")
          }
        >
          {/* Icon tipe notifikasi */}
          <span style={{ fontSize: "0.9rem", marginTop: "2px", flexShrink: 0 }}>
            {NOTIF_ICON[n.type]}
          </span>

          {/* Teks + waktu */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.78rem",
                color: n.unread ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {n.message}
            </p>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.62rem",
                color: "rgba(255,255,255,0.2)",
                marginTop: "3px",
                margin: "3px 0 0",
              }}
            >
              {n.time}
            </p>
          </div>

          {/* Dot indikator unread */}
          {n.unread && (
            <div
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#C9922A",
                marginTop: "6px",
                flexShrink: 0,
              }}
            />
          )}
        </div>
      ))}

      {/* Footer panel */}
      <div
        style={{
          padding: "10px 16px",
          textAlign: "center" as const,
          borderTop: "1px solid #2A1A0A",
        }}
      >
        <button
          style={{
            background: "none",
            border: "none",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.25)",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#C9922A")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
        >
          Lihat semua notifikasi →
        </button>
      </div>
    </div>
  );
}