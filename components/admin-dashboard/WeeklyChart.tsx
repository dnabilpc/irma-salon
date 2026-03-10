
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
    <div style={{ background: "#1A0F05", border: "1px solid #2A1A0A", padding: "22px" }}>

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
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            Aktivitas Minggu Ini
          </h3>
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>
            3 – 9 Maret 2026
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "14px" }}>
          {[
            { color: "#C9922A", label: "Revenue" },
            { color: "#7B9FD4", label: "Booking" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{
                  width: "7px", height: "7px",
                  background: l.color,
                  borderRadius: "1px",
                }}
              />
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "12px",
          height: "120px",
          padding: "0 4px",
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
            <div
              style={{
                flex: 1,
                width: "100%",
                display: "flex",
                alignItems: "flex-end",
                gap: "3px",
              }}
            >
              {/* Revenue bar */}
              <div
                title={`Revenue: ${formatRupiah(bar.revenue)}`}
                style={{
                  flex: 1,
                  borderRadius: "2px 2px 0 0",
                  minHeight: "4px",
                  height: `${(bar.revenue / maxRevenue) * 100}%`,
                  background: "linear-gradient(to top, #C9922A, rgba(201,146,42,0.4))",
                  transition: "height 0.6s ease",
                  cursor: "pointer",
                }}
              />
              {/* Booking bar */}
              <div
                title={`Booking: ${bar.bookings}`}
                style={{
                  flex: 1,
                  borderRadius: "2px 2px 0 0",
                  minHeight: "4px",
                  height: `${(bar.bookings / maxBookings) * 100}%`,
                  background: "linear-gradient(to top, #7B9FD4, rgba(123,159,212,0.4))",
                  transition: "height 0.6s ease",
                  cursor: "pointer",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.3)",
              }}
            >
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
          marginTop: "18px",
          paddingTop: "18px",
          borderTop: "1px solid #2A1A0A",
        }}
      >
        {SUMMARY.map((s) => (
          <div key={s.label}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.95rem",
                fontWeight: 500,
                color: "#C9922A",
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: "0.68rem",
                color: "rgba(255,255,255,0.3)",
                marginTop: "2px",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}