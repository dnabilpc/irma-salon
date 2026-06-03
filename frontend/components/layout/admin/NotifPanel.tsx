// components/layout/admin/NotifPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/actions/notification";
import type { Notification, NotifType } from "@/types";

const NOTIF_ICON: Record<NotifType, string> = {
  booking: "📅",
  payment: "💳",
  review:  "⭐",
  return:  "⚠️",
};

export default function NotifPanel() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from database
  const fetchNotifs = async () => {
    const res = await getAdminNotifications();
    if (res.success && res.data) {
      setNotifs(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(fetchNotifs, 0);
    
    // Poll every 10 seconds to get real-time booking alerts
    const interval = setInterval(fetchNotifs, 10000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifs.filter((n) => n.unread).length;

  // Handle Mark All as Read
  const handleReadAll = async () => {
    if (unreadCount === 0) return;
    
    // Optimistic update
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    
    const res = await markAllNotificationsAsRead();
    if (!res.success) {
      // Revert if failed
      fetchNotifs();
    }
  };

  // Handle click on a notification item
  const handleNotifClick = async (n: Notification) => {
    if (n.unread) {
      // Optimistic update
      setNotifs((prev) => prev.map((item) => item.id === n.id ? { ...item, unread: false } : item));
      await markNotificationAsRead(n.id);
    }

    // Redirect to correct admin view based on type
    if (n.type === "booking") {
      router.push("/admin/bookings");
    } else if (n.type === "return") {
      router.push("/admin/rentals");
    } else if (n.type === "payment") {
      router.push("/admin/payments");
    } else {
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="notif-panel" onClick={(e) => e.stopPropagation()} style={{
      position: "absolute",
      right: 0,
      top: "45px",
      width: "320px",
      background: "white",
      border: "1px solid #F0D9E0",
      borderRadius: "8px",
      boxShadow: "0 10px 30px rgba(122, 40, 72, 0.15)",
      zIndex: 50,
      overflow: "hidden",
    }}>
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
                background: "#C4728E",
                color: "white",
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
          onClick={handleReadAll}
          disabled={unreadCount === 0}
          style={{
            background: "none",
            border: "none",
            fontSize: "12px",
            color: unreadCount > 0 ? "#C4728E" : "#B08090",
            cursor: unreadCount > 0 ? "pointer" : "default",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}
        >
          Baca semua
        </button>
      </div>

      {/* List notifikasi */}
      <div style={{ maxHeight: "360px", overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#B08090", fontSize: "13px" }}>
            Memuat notifikasi...
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <span style={{ fontSize: "2rem" }}>📭</span>
            <p style={{ margin: "10px 0 0 0", color: "#B08090", fontSize: "13px", fontFamily: "'DM Sans', sans-serif" }}>
              Tidak ada notifikasi baru
            </p>
          </div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotifClick(n)}
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
                {NOTIF_ICON[n.type] || "🔔"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "13px",
                    color: n.unread ? "#3A1A28" : "#8A4060",
                    lineHeight: 1.5,
                    margin: 0,
                    fontWeight: n.unread ? 600 : 400,
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
          ))
        )}
      </div>

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
          onClick={() => router.push("/admin/bookings")}
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