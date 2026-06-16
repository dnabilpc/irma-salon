import type { DashboardStats } from "@/actions/admin";
import { formatRupiah } from "@/lib/utils";

interface WeeklyChartProps {
  data: DashboardStats["weeklyChart"];
}

function formatRevenueShort(val: number) {
  if (val >= 1000000) {
    return `Rp ${(val / 1000000).toFixed(2).replace(/\.?0+$/, "")}jt`;
  }
  return formatRupiah(val);
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  if (!data || data.length === 0) return null;

  const maxRevenue  = Math.max(...data.map((d) => d.revenue), 1);
  const maxBookings = Math.max(...data.map((d) => d.bookings), 1);

  const totalBookings = data.reduce((sum, d) => sum + d.bookings, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = totalRevenue / data.length;

  const SUMMARY = [
    { label: "Total Booking", value: totalBookings.toString(), sub: "7 hari terakhir" },
    { label: "Total Revenue", value: formatRevenueShort(totalRevenue), sub: "7 hari terakhir" },
    { label: "Avg. per Hari", value: formatRevenueShort(avgRevenue), sub: "rata-rata"  },
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
            Aktivitas 7 Hari Terakhir
          </h3>
          <p style={{ fontSize: "12px", color: "#B08090" }}>Grafik Booking & Revenue Harian</p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "14px" }}>
          {[
            { color: "#C4728E", label: "Revenue" },
            { color: "#C9922A", label: "Booking" },
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
          gap: "10px",
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
            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", gap: "3px" }}>
              {/* Revenue bar */}
              <div
                title={`Revenue: ${formatRupiah(bar.revenue)}`}
                style={{
                  flex: 1,
                  borderRadius: "4px 4px 0 0",
                  minHeight: "4px",
                  height: `${(bar.revenue / maxRevenue) * 100}%`,
                  background: "linear-gradient(to top, #C4728E, rgba(196,114,142,0.3))",
                  transition: "height 0.6s ease",
                  cursor: "pointer",
                }}
              />
              {/* Booking bar */}
              <div
                title={`Booking: ${bar.bookings}`}
                style={{
                  flex: 1,
                  borderRadius: "4px 4px 0 0",
                  minHeight: "4px",
                  height: `${(bar.bookings / maxBookings) * 100}%`,
                  background: "linear-gradient(to top, #C9922A, rgba(201,146,42,0.3))",
                  transition: "height 0.6s ease",
                  cursor: "pointer",
                }}
              />
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#B08090" }}>
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
                color: "#C4728E",
                marginBottom: "2px",
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: "12px", color: "#B08090" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}