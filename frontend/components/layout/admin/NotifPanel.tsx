// components/layout/admin/NotifPanel.tsx
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
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #F0D9E0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky" as const,
          top: 0,
          background: "#FAEAF0",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "#7A2848",
            }}
          >
            Notifikasi
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                background: "#F9EAF0",
                color: "#C4728E",
                fontSize: "11px",
                fontWeight: 700,
                padding: "1px 8px",
                borderRadius: "10px",
                border: "1px solid #E8C0D0",
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
            fontSize: "12px",
            color: "#C4728E",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}
        >
          Baca semua
        </button>
      </div>

      {/* List notifikasi */}
      {NOTIFICATIONS.map((n) => (
        <div
          key={n.id}
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #F0D9E0",
            background: n.unread ? "#FDF5F8" : "white",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#F9EAF0")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = n.unread ? "#FDF5F8" : "white")
          }
        >
          <span style={{ fontSize: "1rem", marginTop: "2px", flexShrink: 0 }}>
            {NOTIF_ICON[n.type]}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "13px",
                color: n.unread ? "#3A1A28" : "#8A4060",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {n.message}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "#B08090",
                marginTop: "3px",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {n.time}
            </p>
          </div>
          {n.unread && (
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#C4728E",
                marginTop: "5px",
                flexShrink: 0,
              }}
            />
          )}
        </div>
      ))}

      {/* Footer */}
      <div
        style={{
          padding: "10px 16px",
          textAlign: "center" as const,
          borderTop: "1px solid #F0D9E0",
          background: "#FDF8F5",
        }}
      >
        <button
          style={{
            background: "none",
            border: "none",
            fontSize: "12px",
            color: "#B08090",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#C4728E")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#B08090")}
        >
          Lihat semua notifikasi →
        </button>
      </div>
    </div>
  );
}