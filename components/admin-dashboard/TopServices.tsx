import { SERVICE_BREAKDOWN } from "@/constants/data";

export default function TopServices() {
  return (
    <div
      style={{
        background: "#1A0F05",
        border: "1px solid #2A1A0A",
        padding: "18px",
        flex: 1,
      }}
    >
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
        Top Layanan
      </h3>

      {/* Service items */}
      {SERVICE_BREAKDOWN.map((s) => (
        <div key={s.name} style={{ marginBottom: "11px" }}>

          {/* Label + count */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
              {s.name}
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.67rem",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              {s.count}x
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: "3px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${s.pct}%`,
                background: "linear-gradient(to right, #C9922A, rgba(201,146,42,0.35))",
                borderRadius: "2px",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}