// components/admin-dashboard/TodaySchedule.tsx
import { TODAY_SCHEDULE } from "@/constants/data";

export default function TodaySchedule() {
  return (
    <div className="admin-card" style={{ padding: "18px" }}>
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#3A1A28",
          marginBottom: "14px",
        }}
      >
        Jadwal Hari Ini
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {TODAY_SCHEDULE.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              padding: "8px 10px",
              background: s.status === "ongoing" ? "rgba(42,140,90,0.07)" : "#FDF8F5",
              border: s.status === "ongoing"
                ? "1px solid rgba(42,140,90,0.2)"
                : "1px solid #F0D9E0",
              borderRadius: "8px",
            }}
          >
            {/* Jam */}
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                color: s.status === "ongoing" ? "#1A7A4A" : "#B08090",
                minWidth: "38px",
                fontWeight: 500,
              }}
            >
              {s.time}
            </div>

            {/* Dot */}
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: s.status === "ongoing" ? "#1A7A4A" : "#E8C0D0",
                flexShrink: 0,
              }}
            />

            {/* Nama + layanan */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#3A1A28" }}>
                {s.name}
              </div>
              <div style={{ fontSize: "11px", color: "#B08090" }}>{s.service}</div>
            </div>

            {/* Badge LIVE */}
            {s.status === "ongoing" && (
              <span
                style={{
                  fontSize: "10px",
                  background: "rgba(42,140,90,0.12)",
                  color: "#1A7A4A",
                  padding: "2px 7px",
                  borderRadius: "20px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  border: "1px solid rgba(42,140,90,0.2)",
                }}
              >
                LIVE
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}