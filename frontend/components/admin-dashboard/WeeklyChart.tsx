import type { DashboardStats } from "@/actions/admin";

interface WeeklyChartProps {
  data: DashboardStats["weeklyChart"];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  if (!data || data.length === 0) return null;

  // Since both are counts, we can compare them on a single scale
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.bookings || 0, d.rentals || 0)),
    1
  );

  const totalBookings = data.reduce((sum, d) => sum + (d.bookings || 0), 0);
  const totalRentals = data.reduce((sum, d) => sum + (d.rentals || 0), 0);
  const avgCombined = (totalBookings + totalRentals) / data.length;

  const SUMMARY = [
    { label: "Total Booking", value: totalBookings.toString(), sub: data.length > 7 ? "bulan ini" : "7 hari terakhir", color: "#C4728E" },
    { label: "Total Sewa", value: totalRentals.toString(), sub: data.length > 7 ? "bulan ini" : "7 hari terakhir", color: "#7B9FD4" },
    { label: "Rerata Harian", value: avgCombined.toFixed(1).replace(/\.0$/, ""), sub: "booking & sewa", color: "#6B3A2A" },
  ];

  return (
    <div className="admin-card" style={{ padding: "22px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "22px",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#3A1A28",
              marginBottom: "2px",
            }}
          >
            {data.length > 7 ? "Aktivitas Bulan Ini" : "Aktivitas 7 Hari Terakhir"}
          </h3>
          <p style={{ fontSize: "12px", color: "#B08090" }}>
            {data.length > 7 ? "Grafik Booking & Sewa Harian Bulan Ini" : "Grafik Booking & Sewa Harian"}
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "14px" }}>
          {[
            { color: "#7B9FD4", label: "Sewa" },
            { color: "#C4728E", label: "Booking" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", background: l.color, borderRadius: "2px" }} />
              <span style={{ fontSize: "12px", color: "#B08090" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: data.length > 7 ? "3px" : "10px",
          height: "130px",
          padding: "0 4px",
          marginBottom: "20px",
        }}
      >
        {data.map((bar) => (
          <div
            key={bar.day}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              height: "100%",
            }}
          >
            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", gap: data.length > 7 ? "1px" : "3px" }}>
              {/* Sewa bar */}
              <div
                title={`Sewa Baju: ${bar.rentals || 0}`}
                style={{
                  flex: 1,
                  borderRadius: "4px 4px 0 0",
                  minHeight: "4px",
                  height: `${((bar.rentals || 0) / maxVal) * 100}%`,
                  background: "#7B9FD4",
                  transition: "height 0.6s ease",
                  cursor: "pointer",
                }}
              />
              {/* Booking bar */}
              <div
                title={`Booking: ${bar.bookings || 0}`}
                style={{
                  flex: 1,
                  borderRadius: "4px 4px 0 0",
                  minHeight: "4px",
                  height: `${((bar.bookings || 0) / maxVal) * 100}%`,
                  background: "#C4728E",
                  transition: "height 0.6s ease",
                  cursor: "pointer",
                }}
              />
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: data.length > 7 ? "8px" : "11px", color: "#B08090" }}>
              {bar.day}
            </span>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div
        className="weekly-chart-summary"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
          paddingTop: "16px",
          borderTop: "1px solid #F0D9E0",
        }}
      >
        {SUMMARY.map((s) => (
          <div key={s.label}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: s.color,
                marginBottom: "2px",
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: "12px", color: "#B08090" }}>{s.label}</div>
            <div style={{ fontSize: "10px", color: "#D0A0B0" }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}