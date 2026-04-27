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
          color: "#2C1A0E",
          marginBottom: "14px",
        }}
      >
        Jadwal Hari Ini
      </h3>

      {TODAY_SCHEDULE.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "8px",
            padding: "8px 10px",
            background: s.status === "ongoing"
              ? "rgba(90,158,122,0.07)"
              : "transparent",
            border: s.status === "ongoing"
              ? "1px solid rgba(90,158,122,0.2)"
              : "1px solid transparent",
            borderRadius: "8px",
          }}
        >
          {/* Jam */}
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.67rem",
              color: s.status === "ongoing" ? "#5A9E7A" : "#B09080",
              minWidth: "38px",
              fontWeight: 500,
            }}
          >
            {s.time}
          </div>

          {/* Dot */}
          <div style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: s.status === "ongoing" ? "#5A9E7A" : "#F0E0E6",
            flexShrink: 0,
          }} />

          {/* Nama & layanan */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#2C1A0E" }}>
              {s.name}
            </div>
            <div style={{ fontSize: "0.65rem", color: "#B09080" }}>{s.service}</div>
          </div>

          {/* Badge LIVE */}
          {s.status === "ongoing" && (
            <span
              style={{
                fontSize: "0.58rem",
                background: "rgba(90,158,122,0.12)",
                color: "#5A9E7A",
                padding: "2px 7px",
                borderRadius: "6px",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              LIVE
            </span>
          )}
        </div>
      ))}
    </div>
  );
}