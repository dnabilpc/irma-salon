// components/layout/admin/AdminTopbar.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import NotifPanel from "@/components/layout/admin/NotifPanel";
import { getAdminNotifications } from "@/actions/notification";

interface AdminTopbarProps {
  userName: string;
  userRole: string;
  userImage?: string | null;
}

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/admin/dashboard": { title: "Dashboard",       sub: "Selamat datang kembali" },
  "/admin/bookings":  { title: "Booking Salon",    sub: "Kelola reservasi layanan" },
  "/admin/rentals":   { title: "Sewa Baju",        sub: "Kelola transaksi sewa" },
  "/admin/customers": { title: "Data Pelanggan",   sub: "Kelola akun pelanggan" },
  "/admin/payments":  { title: "Pembayaran",       sub: "Pantau transaksi keuangan" },
  "/admin/settings":  { title: "Pengaturan",       sub: "Konfigurasi sistem" },
};

function formatTanggal(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AdminTopbar({ userName, userRole, userImage }: AdminTopbarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [showNotif, setShowNotif]     = useState<boolean>(false);
  const [loggingOut, setLoggingOut]   = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const pageInfo = PAGE_TITLES[pathname] ?? { title: "Admin", sub: "" };

  const fetchUnreadCount = async () => {
    try {
      const res = await getAdminNotifications();
      if (res.success && res.data) {
        setUnreadCount(res.data.filter((n) => n.unread).length);
      }
    } catch (e) {
      console.error("Failed to fetch unread count:", e);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchUnreadCount, 0);
    // Poll notifications status every 10 seconds for real-time dashboard updates
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(/\./g, ":")
      );
      setCurrentDate(formatTanggal(now));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setShowNotif(false);
    if (showNotif) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showNotif]);

  async function handleSignOut() {
    setLoggingOut(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/login"),
        onError:   () => setLoggingOut(false),
      },
    });
  }

  return (
    <header
      style={{
        height: "60px",
        background: "#FAEAF0",
        borderBottom: "1px solid #E8C0D0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(196,114,142,0.08)",
      }}
    >
      {/* Kiri: hamburger + judul halaman */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Hamburger Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            document.body.classList.toggle("sidebar-open");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#7A2848",
            fontSize: "1.4rem",
            cursor: "pointer",
            display: "none",
            padding: "4px 8px",
            borderRadius: "6px",
          }}
          className="admin-hamburger-btn"
          aria-label="Toggle Sidebar"
        >
          ☰
        </button>

        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#7A2848",
                lineHeight: 1,
              }}
            >
              {pageInfo.title}
            </h1>
            {pageInfo.sub && (
              <span
                className="admin-topbar-sub"
                style={{
                  fontSize: "13px",
                  color: "#B06080",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                — {pageInfo.sub}
              </span>
            )}
          </div>
          <div
            className="admin-topbar-date"
            style={{
              fontSize: "12px",
              color: "#B06080",
              fontFamily: "'DM Sans', sans-serif",
              marginTop: "2px",
            }}
          >
            {currentDate}
          </div>
        </div>
      </div>

      {/* Kanan: jam + notif + user */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>

        {/* Jam */}
        <div
          className="admin-topbar-clock"
          style={{
            background: "rgba(255,255,255,0.7)",
            border: "1px solid #E8C0D0",
            borderRadius: "8px",
            padding: "5px 12px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "13px",
            color: "#B06080",
            fontWeight: 500,
          }}
        >
          {currentTime}
        </div>

        {/* Notifikasi */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotif((prev) => !prev);
            }}
            style={{
              background: showNotif ? "white" : "rgba(255,255,255,0.7)",
              border: "1px solid",
              borderColor: showNotif ? "#C4728E" : "#E8C0D0",
              color: "#B06080",
              cursor: "pointer",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              fontSize: "1rem",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#C4728E",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: 700,
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && <NotifPanel />}
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "28px", background: "#E8C0D0" }} />

        {/* User info + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "1.5px solid #C4728E",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(196,114,142,0.15)",
              background: "white",
              flexShrink: 0,
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

          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#7A2848",
                maxWidth: "110px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName}
            </div>
            <div style={{ fontSize: "11px", color: "#B06080" }}>
              {userRole}
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            style={{
              background: "rgba(217,64,96,0.08)",
              border: "1px solid rgba(217,64,96,0.25)",
              color: "#D94060",
              cursor: loggingOut ? "not-allowed" : "pointer",
              padding: "6px 14px",
              borderRadius: "8px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s",
              opacity: loggingOut ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loggingOut) e.currentTarget.style.background = "rgba(217,64,96,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(217,64,96,0.08)";
            }}
          >
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </header>
  );
}