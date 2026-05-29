import { PUBLIC_STYLES } from "@/lib/styles";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FDF8F3 0%, #F5E6E0 40%, #EDD8CC 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{PUBLIC_STYLES}</style>
      {children}
    </div>
  );
}