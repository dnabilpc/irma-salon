// app/admin/layout.tsx
// Layout untuk semua halaman admin
// Server Component — cek session di server sebelum render apapun

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/layout/admin/AdminSidebar";
import AdminTopbar  from "@/components/layout/admin/AdminTopbar";
import { ADMIN_STYLES } from "@/lib/styles";
import type { AppUser } from "@/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ambil session dari server menggunakan request headers
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Belum login sama sekali
  if (!session) {
    redirect("/login");
  }

  // Sudah login tapi bukan admin
  const user = session.user as unknown as AppUser;
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0F0A05",
        color: "white",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{ADMIN_STYLES}</style>

      {/* Sidebar kiri — fixed, collapsible state dikelola di dalam komponen */}
      <AdminSidebar />

      {/* Area konten kanan */}
      <div
        style={{
          flex: 1,
          marginLeft: "220px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          transition: "margin-left 0.3s ease",
        }}
      >
        <AdminTopbar userName={user.name} />

        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>

        {/* Footer admin */}
        <footer
          style={{
            borderTop: "1px solid #2A1A0A",
            padding: "10px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6rem",
              color: "rgba(255,255,255,0.18)",
            }}
          >
            Salon Rumah Cantik Irma — Admin v1.0
          </span>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6rem",
              color: "rgba(255,255,255,0.18)",
            }}
          >
            Tugas Akhir · Telkom University Surabaya · 2026
          </span>
        </footer>
      </div>
    </div>
  );
}