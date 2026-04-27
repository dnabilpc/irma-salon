import { STAT_CARDS } from "@/constants/data";

export default function StatCardGrid() {
  return (
    <div
      className="admin-stats-grid"
      style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}
    >
      {STAT_CARDS.map((card, i) => (
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
              borderRadius: "12px 12px 0 0",
              background: card.accent,
            }}
          />

          {/* Icon + badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
              marginTop: "4px",
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
                fontSize: "1.3rem",
              }}
            >
              {card.icon}
            </div>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                fontWeight: 700,
                color: card.positive ? "#5A9E7A" : "#C05060",
                background: card.positive
                  ? "rgba(90,158,122,0.1)"
                  : "rgba(192,80,96,0.1)",
                padding: "3px 8px",
                borderRadius: "6px",
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
              color: "#2C1A0E",
              lineHeight: 1,
              marginBottom: "6px",
            }}
          >
            {card.value}
          </div>

          {/* Label */}
          <div style={{ fontSize: "0.75rem", color: "#7A5C50", lineHeight: 1.4 }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}