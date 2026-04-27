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
          borderBottom: "1px solid #F0E0E6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          background: "white",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            fontSize: "0.9rem",
            color: "#2C1A0E",
          }}>
            Notifikasi
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                background: "rgba(196,120,138,0.12)",
                color: "#C4788A",
                fontSize: "0.62rem",
                fontWeight: 700,
                padding: "2px 8px",
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
            fontSize: "0.72rem",
            color: "#C4788A",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}
        >
          Baca semua
        </button>
      </div>

      {/* List */}
      {NOTIFICATIONS.map((n) => (
        <div
          key={n.id}
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #F5EBF0",
            background: n.unread ? "rgba(196,120,138,0.04)" : "white",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = n.unread
              ? "rgba(196,120,138,0.08)"
              : "#FDFAF7")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = n.unread
              ? "rgba(196,120,138,0.04)"
              : "white")
          }
        >
          <span style={{ fontSize: "0.9rem", marginTop: "2px", flexShrink: 0 }}>
            {NOTIF_ICON[n.type]}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.78rem",
                color: n.unread ? "#2C1A0E" : "#7A5C50",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {n.message}
            </p>
            <p style={{
              fontSize: "0.62rem",
              color: "#B09080",
              marginTop: "3px",
              fontFamily: "'DM Mono', monospace",
            }}>
              {n.time}
            </p>
          </div>
          {n.unread && (
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#C4788A",
                marginTop: "6px",
                flexShrink: 0,
              }}
            />
          )}
        </div>
      ))}

      {/* Footer */}
      <div style={{ padding: "10px 16px", textAlign: "center", borderTop: "1px solid #F0E0E6" }}>
        <button
          style={{
            background: "none",
            border: "none",
            fontSize: "0.72rem",
            color: "#B09080",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#C4788A")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#B09080")}
        >
          Lihat semua notifikasi →
        </button>
      </div>
    </div>
  );
}