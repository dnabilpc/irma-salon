"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import NotifPanel from "@/components/layout/admin/NotifPanel";

interface AdminTopbarProps {
  userName: string;
}

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/admin/dashboard": { title: "Dashboard",         sub: "Selamat datang kembali 👋" },
  "/admin/bookings":  { title: "Booking Salon",      sub: "Kelola reservasi layanan" },
  "/admin/rentals":   { title: "Sewa Baju",          sub: "Kelola transaksi sewa" },
  "/admin/customers": { title: "Data Pelanggan",     sub: "Kelola akun pelanggan" },
  "/admin/payments":  { title: "Pembayaran",         sub: "Pantau transaksi keuangan" },
  "/admin/settings":  { title: "Pengaturan",         sub: "Konfigurasi sistem" },
};

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

  const pageInfo = PAGE_TITLES[pathname] ?? { title: "Admin", sub: "" };

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
        height: "64px",
        background: "white",
        borderBottom: "1px solid #F0E0E6",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        boxShadow: "0 1px 8px rgba(196,120,138,0.06)",
      }}
    >
      {/* ── Kiri: judul + sub ── */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#2C1A0E",
              lineHeight: 1,
            }}
          >
            {pageInfo.title}
          </h1>
          {pageInfo.sub && (
            <span style={{
              fontSize: "0.72rem",
              color: "#B09080",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              — {pageInfo.sub}
            </span>
          )}
        </div>
        <div style={{
          fontSize: "0.65rem",
          color: "#C4788A",
          fontFamily: "'DM Sans', sans-serif",
          marginTop: "2px",
          fontWeight: 500,
        }}>
          {currentDate}
        </div>
      </div>

      {/* ── Kanan: jam + notif + user ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

        {/* Jam */}
        <div
          style={{
            background: "rgba(196,120,138,0.07)",
            border: "1px solid #F0E0E6",
            borderRadius: "8px",
            padding: "5px 12px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.8rem",
            color: "#C4788A",
            fontWeight: 500,
          }}
        >
          {currentTime}
        </div>

        {/* Tombol notifikasi */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotif((prev) => !prev);
            }}
            title="Notifikasi"
            style={{
              background: showNotif ? "rgba(196,120,138,0.1)" : "transparent",
              border: "1px solid",
              borderColor: showNotif ? "#C4788A" : "#F0E0E6",
              color: showNotif ? "#C4788A" : "#7A5C50",
              cursor: "pointer",
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              fontSize: "1rem",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!showNotif) {
                e.currentTarget.style.borderColor = "#C4788A";
                e.currentTarget.style.background = "rgba(196,120,138,0.06)";
              }
            }}
            onMouseLeave={(e) => {
              if (!showNotif) {
                e.currentTarget.style.borderColor = "#F0E0E6";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            🔔
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "#C4788A",
                color: "white",
                fontSize: "0.55rem",
                fontWeight: 700,
                width: "15px",
                height: "15px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              3
            </span>
          </button>
          {showNotif && <NotifPanel />}
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "28px", background: "#F0E0E6" }} />

        {/* User info + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #C4788A, #C9922A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "0.72rem",
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(196,120,138,0.25)",
            }}
          >
            {userName.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#2C1A0E",
              maxWidth: "110px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {userName}
            </div>
            <div style={{ fontSize: "0.6rem", color: "#C4788A", fontWeight: 500 }}>
              Administrator
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            style={{
              background: "rgba(192,80,96,0.07)",
              border: "1px solid rgba(192,80,96,0.2)",
              color: "#C05060",
              cursor: loggingOut ? "not-allowed" : "pointer",
              padding: "6px 14px",
              borderRadius: "8px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.72rem",
              fontWeight: 600,
              transition: "all 0.2s",
              opacity: loggingOut ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loggingOut) e.currentTarget.style.background = "rgba(192,80,96,0.14)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(192,80,96,0.07)";
            }}
          >
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </header>
  );
}