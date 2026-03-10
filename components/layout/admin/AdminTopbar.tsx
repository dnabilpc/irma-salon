// components/layout/admin/AdminTopbar.tsx
// Topbar admin — judul halaman, jam real-time, notifikasi, logout
// Client Component karena ada useEffect (jam) dan useState (notif panel)
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import NotifPanel from "@/components/layout/admin/NotifPanel";

interface AdminTopbarProps {
  userName: string;
}

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard Overview",
  "/admin/bookings":  "Booking Salon",
  "/admin/rentals":   "Sewa Baju",
  "/admin/customers": "Pelanggan",
  "/admin/payments":  "Pembayaran",
  "/admin/settings":  "Pengaturan",
};

// Format tanggal Indonesia: "Senin, 9 Maret 2026"
function formatTanggal(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AdminTopbar({ userName }: AdminTopbarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [showNotif, setShowNotif]     = useState<boolean>(false);
  const [loggingOut, setLoggingOut]   = useState<boolean>(false);

  const pageTitle = PAGE_TITLES[pathname] ?? "Admin";

  // Update jam setiap menit
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
      setCurrentDate(formatTanggal(now));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  // Tutup notif panel saat klik di luar
  useEffect(() => {
    const handleClickOutside = () => setShowNotif(false);
    if (showNotif) {
      document.addEventListener("click", handleClickOutside);
    }
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
        height: "56px",
        background: "rgba(15,10,5,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #2A1A0A",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* ── Kiri: judul halaman + tanggal ── */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
          }}
        >
          {pageTitle}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.68rem",
            color: "rgba(255,255,255,0.2)",
          }}
        >
          {currentDate}
        </span>
      </div>

      {/* ── Kanan: jam + notifikasi + user ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>

        {/* Jam */}
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          {currentTime}
        </span>

        {/* Tombol notifikasi */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotif((prev) => !prev);
            }}
            title="Notifikasi"
            style={{
              background: showNotif
                ? "rgba(201,146,42,0.1)"
                : "rgba(255,255,255,0.05)",
              border: showNotif
                ? "1px solid rgba(201,146,42,0.3)"
                : "1px solid #2A1A0A",
              color: showNotif ? "#C9922A" : "rgba(255,255,255,0.55)",
              cursor: "pointer",
              width: "34px",
              height: "34px",
              borderRadius: "4px",
              fontSize: "0.95rem",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            🔔
            {/* Badge unread */}
            <span
              style={{
                position: "absolute",
                top: "-5px",
                right: "-5px",
                background: "#DC5050",
                color: "white",
                fontSize: "0.58rem",
                fontWeight: 700,
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              3
            </span>
          </button>

          {/* Panel notifikasi */}
          {showNotif && <NotifPanel />}
        </div>

        {/* Nama user + tombol logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.5)",
              maxWidth: "120px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userName}
          </div>
          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            style={{
              background: "rgba(220,80,80,0.1)",
              border: "1px solid rgba(220,80,80,0.2)",
              color: "#DC5050",
              cursor: loggingOut ? "not-allowed" : "pointer",
              padding: "5px 12px",
              borderRadius: "2px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.72rem",
              fontWeight: 500,
              transition: "all 0.2s",
              opacity: loggingOut ? 0.6 : 1,
              letterSpacing: "0.04em",
            }}
            onMouseEnter={(e) => {
              if (!loggingOut) {
                e.currentTarget.style.background = "rgba(220,80,80,0.2)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(220,80,80,0.1)";
            }}
          >
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </header>
  );
}