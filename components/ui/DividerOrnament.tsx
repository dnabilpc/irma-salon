// components/ui/DividerOrnament.tsx
// Ornamen garis pemisah dengan simbol ❧ di tengah
// Dipakai di antara SectionLabel dan judul H2 di setiap section
// Server Component (tidak perlu "use client")

interface DividerOrnamentProps {
  // light=true untuk section berlatar gelap (VirtualTryOnSection)
  light?: boolean;
}

export default function DividerOrnament({ light = false }: DividerOrnamentProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        margin: "14px 0 20px",
      }}
    >
      {/* Garis kiri */}
      <div
        style={{
          flex: 1,
          height: "1px",
          background: light ? "rgba(232,168,156,0.3)" : "#EDD8CC",
        }}
      />

      {/* Ornamen tengah */}
      <span
        style={{
          fontSize: "1rem",
          color: light ? "#E8A89C" : "#C9922A",
          lineHeight: 1,
          userSelect: "none" as const,
        }}
      >
        ❧
      </span>

      {/* Garis kanan */}
      <div
        style={{
          flex: 1,
          height: "1px",
          background: light ? "rgba(232,168,156,0.3)" : "#EDD8CC",
        }}
      />
    </div>
  );
}