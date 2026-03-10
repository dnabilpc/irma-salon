// components/ui/Badge.tsx
// Reusable status badge — dipakai di BookingTable & RentalTable
// Server Component (tidak perlu "use client")

interface BadgeProps {
  label: string;
  bg: string;
  color: string;
}

export default function Badge({ label, bg, color }: BadgeProps) {
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: "0.7rem",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "2px",
        letterSpacing: "0.06em",
        fontFamily: "'DM Mono', monospace",
        whiteSpace: "nowrap" as const,
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}