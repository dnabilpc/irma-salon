// components/admin-dashboard/TopServices.tsx
import { SERVICE_BREAKDOWN } from "@/constants/data";

export default function TopServices() {
  return (
    <div className="admin-card" style={{ padding: "18px", flex: 1 }}>
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#2C1A0E",
          marginBottom: "14px",
        }}
      >
        Top Layanan
      </h3>

      {SERVICE_BREAKDOWN.map((s) => (
        <div key={s.name} style={{ marginBottom: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ fontSize: "0.75rem", color: "#3D2314", fontWeight: 500 }}>{s.name}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.67rem", color: "#B09080" }}>
              {s.count}x
            </span>
          </div>
          {/* Progress bar */}
          <div
            style={{
              height: "4px",
              background: "#F5EBF0",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${s.pct}%`,
                background: "linear-gradient(to right, #C4788A, rgba(196,120,138,0.4))",
                borderRadius: "4px",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}