// app/admin/dashboard/page.tsx
// Halaman Dashboard Admin
// Layout (Sidebar + Topbar + Footer) sudah ditangani oleh admin/layout.tsx

import StatCardGrid  from "@/components/admin-dashboard/StatCardGrid";
import WeeklyChart   from "@/components/admin-dashboard/WeeklyChart";
import TodaySchedule from "@/components/admin-dashboard/TodaySchedule";
import TopServices   from "@/components/admin-dashboard/TopServices";
import BookingTable  from "@/components/admin-dashboard/BookingTable";
import RentalTable   from "@/components/admin-dashboard/RentalTable";

export default function DashboardPage() {
  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Baris 1: 4 stat cards */}
      <StatCardGrid />

      {/* Baris 2: Chart mingguan + Schedule + Top Services */}
      <div
        className="admin-main-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}
      >
        <WeeklyChart />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <TodaySchedule />
          <TopServices />
        </div>
      </div>

      {/* Baris 3: Tabel booking terbaru */}
      <BookingTable />

      {/* Baris 4: Tabel sewa terbaru */}
      <RentalTable />

    </div>
  );
}