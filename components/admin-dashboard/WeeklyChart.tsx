import { WEEKLY_CHART } from "@/constants/data";
import { formatRupiah } from "@/lib/utils";

const SUMMARY = [
  { label: "Total Booking", value: "104",       sub: "minggu ini" },
  { label: "Total Revenue", value: "Rp 12.3jt", sub: "minggu ini" },
  { label: "Avg. per Hari", value: "Rp 1.75jt", sub: "rata-rata"  },
];

export default function WeeklyChart() {
  const maxRevenue  = Math.max(...WEEKLY_CHART.map((d) => d.revenue));
  const maxBookings = Math.max(...WEEKLY_CHART.map((d) => d.bookings));

  return (
    <div className="admin-card" style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "#2C1A0E",
            }}
          >
            Aktivitas Minggu Ini
          </h3>
          <p style={{ fontSize: "0.72rem", color: "#B09080", marginTop: "2px" }}>
            3 – 9 Maret 2026
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "14px" }}>
          {[
            { color: "#C4788A", label: "Revenue" },
            { color: "#C9922A", label: "Booking" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", background: l.color, borderRadius: "2px" }} />
              <span style={{ fontSize: "0.7rem", color: "#7A5C50" }}>{l.label}</span>
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
        {WEEKLY_CHART.map((bar) => (
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
                  background: "linear-gradient(to top, #C4788A, rgba(196,120,138,0.35))",
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
                  background: "linear-gradient(to top, #C9922A, rgba(201,146,42,0.35))",
                  transition: "height 0.6s ease",
                  cursor: "pointer",
                }}
              />
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#B09080" }}>
              {bar.day}
            </span>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
          paddingTop: "18px",
          borderTop: "1px solid #F0E0E6",
        }}
      >
        {SUMMARY.map((s) => (
          <div key={s.label}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.95rem",
                fontWeight: 500,
                color: "#C4788A",
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#B09080", marginTop: "2px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}