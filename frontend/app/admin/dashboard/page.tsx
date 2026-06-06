"use client";

import { useState, useEffect } from "react";
import { getAdminDashboardStats, type DashboardStats } from "@/actions/admin";
import StatCardGrid  from "@/components/admin-dashboard/StatCardGrid";
import WeeklyChart   from "@/components/admin-dashboard/WeeklyChart";
import TodaySchedule from "@/components/admin-dashboard/TodaySchedule";
import TopServices   from "@/components/admin-dashboard/TopServices";
import BookingTable  from "@/components/admin-dashboard/BookingTable";
import RentalTable   from "@/components/admin-dashboard/RentalTable";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDashboardStats();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error ?? "Gagal memuat data dashboard.");
      }
    } catch {
      setError("Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "12px",
          color: "#6B3A2A",
          fontFamily: "'DM Sans', sans-serif"
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(107,58,42,0.1)",
            borderTopColor: "#6B3A2A",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}
        />
        <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>Memuat statistik dashboard...</span>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "16px",
          fontFamily: "'DM Sans', sans-serif"
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>⚠️</div>
        <p style={{ color: "#D94060", fontWeight: 600 }}>{error}</p>
        <button
          onClick={fetchStats}
          style={{
            background: "#6B3A2A",
            color: "white",
            border: "none",
            padding: "8px 24px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Baris 1: 4 stat cards */}
      <StatCardGrid stats={data.stats} />

      {/* Baris 2: Chart mingguan + Schedule + Top Services */}
      <div
        className="admin-main-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}
      >
        <WeeklyChart data={data.weeklyChart} />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <TodaySchedule items={data.todaySchedule} />
          <TopServices data={data.topServices} />
        </div>
      </div>

      {/* Baris 3: Tabel booking terbaru */}
      <BookingTable items={data.recentBookings} />

      {/* Baris 4: Tabel sewa terbaru */}
      <RentalTable items={data.recentRentals} />

    </div>
  );
}