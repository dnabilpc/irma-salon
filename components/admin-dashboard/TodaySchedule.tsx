import { TODAY_SCHEDULE } from "@/constants/data";

export default function TodaySchedule() {
  return (
    <div style={{ background: "#1A0F05", border: "1px solid #2A1A0A", padding: "18px" }}>

      {/* Header */}
      <h3
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "0.95rem",
          fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
          marginBottom: "14px",
        }}
      >
        Jadwal Hari Ini
      </h3>

      {/* Schedule items */}
      {TODAY_SCHEDULE.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "8px",
            padding: "7px 8px",
            background: s.status === "ongoing"
              ? "rgba(76,175,130,0.06)"
              : "transparent",
            border: s.status === "ongoing"
              ? "1px solid rgba(76,175,130,0.12)"
              : "1px solid transparent",
            borderRadius: "2px",
          }}
        >
          {/* Jam */}
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.67rem",
              color: s.status === "ongoing" ? "#4CAF82" : "rgba(255,255,255,0.25)",
              minWidth: "38px",
            }}
          >
            {s.time}
          </div>

          {/* Nama & layanan */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "rgba(255,255,255,0.65)",
              }}
            >
              {s.name}
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>
              {s.service}
            </div>
          </div>

          {/* Badge LIVE */}
          {s.status === "ongoing" && (
            <span
              style={{
                fontSize: "0.58rem",
                background: "rgba(76,175,130,0.15)",
                color: "#4CAF82",
                padding: "1px 5px",
                borderRadius: "2px",
                fontWeight: 600,
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