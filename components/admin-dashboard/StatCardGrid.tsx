
import { STAT_CARDS } from "@/constants/data";

export default function StatCardGrid() {
  return (
    <div
      className="admin-stats-grid"
      style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}
    >
      {STAT_CARDS.map((card, i) => (
        <div
          key={card.label}
          className="admin-stat-card card-anim"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          {/* Accent bar di atas */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "2px",
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
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>{card.icon}</span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                fontWeight: 600,
                color: card.positive ? "#4CAF82" : "#DC5050",
                background: card.positive
                  ? "rgba(76,175,130,0.1)"
                  : "rgba(220,80,80,0.1)",
                padding: "2px 7px",
                borderRadius: "2px",
              }}
            >
              {card.positive ? "▲" : "▼"} {card.change}
            </span>
          </div>

          {/* Nilai utama */}
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.9rem",
              fontWeight: 700,
              color: card.accent,
              lineHeight: 1,
              marginBottom: "5px",
            }}
          >
            {card.value}
          </div>

          {/* Label */}
          <div
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.4,
            }}
          >
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}