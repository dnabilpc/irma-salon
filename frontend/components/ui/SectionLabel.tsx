// components/ui/SectionLabel.tsx
// Label kecil di atas judul section — "Apa yang kami tawarkan", "Kata Mereka", dll.
// Mendukung mode terang (light) untuk section dengan background gelap
// Server Component (tidak perlu "use client")

interface SectionLabelProps {
  children: React.ReactNode;
  // light=true untuk section berlatar gelap (VirtualTryOnSection)
  light?: boolean;
}

export default function SectionLabel({ children, light = false }: SectionLabelProps) {
  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.75rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase" as const,
        color: light ? "#E8A89C" : "#C9922A",
        fontWeight: 500,
        marginBottom: "8px",
      }}
    >
      {children}
    </div>
  );
}