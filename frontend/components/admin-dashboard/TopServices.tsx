import type { DashboardStats } from "@/actions/admin";

interface TopServicesProps {
  data: DashboardStats["topServices"];
}

export default function TopServices({ data }: TopServicesProps) {
  return (
    <div className="admin-card" style={{ padding: "18px", flex: 1 }}>
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#3A1A28",
          marginBottom: "16px",
        }}
      >
        Top Layanan
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {!data || data.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#B08090", fontSize: "12px" }}>
            Belum ada data layanan
          </div>
        ) : (
          data.map((s) => (
            <div key={s.name}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontSize: "13px", color: "#3A1A28", fontWeight: 500 }}>
                  {s.name}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    color: "#B08090",
                  }}
                >
                  {s.count}x
                </span>
              </div>
              {/* Progress bar */}
              <div
                style={{
                  height: "6px",
                  background: "#F0D9E0",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${s.pct}%`,
                    background: "linear-gradient(to right, #C4728E, rgba(196,114,142,0.4))",
                    borderRadius: "4px",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}