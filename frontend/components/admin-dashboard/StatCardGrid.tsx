import type { DashboardStats } from "@/actions/admin";

interface StatCardGridProps {
  stats: DashboardStats["stats"];
}

export default function StatCardGrid({ stats }: StatCardGridProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div
      className="admin-stats-grid"
      style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}
    >
      {stats.map((card, i) => (
        <div
          key={card.label}
          className="admin-stat-card card-anim"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          {/* Accent bar atas */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "3px",
              borderRadius: "10px 10px 0 0",
              background: card.accent,
            }}
          />

          {/* Icon + badge perubahan */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "14px",
              marginTop: "6px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: `${card.accent}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
              }}
            >
              {card.icon}
            </div>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: card.positive ? "#1A7A4A" : "#D94060",
                background: card.positive
                  ? "rgba(42,140,90,0.1)"
                  : "rgba(217,64,96,0.1)",
                padding: "3px 8px",
                borderRadius: "20px",
              }}
            >
              {card.positive ? "▲" : "▼"} {card.change}
            </span>
          </div>

          {/* Nilai */}
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#3A1A28",
              lineHeight: 1,
              marginBottom: "6px",
            }}
          >
            {card.value}
          </div>

          {/* Label */}
          <div style={{ fontSize: "13px", color: "#B08090", lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}