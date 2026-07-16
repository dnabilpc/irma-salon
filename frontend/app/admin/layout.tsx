// app/admin/layout.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/layout/admin/AdminSidebar";
import AdminTopbar  from "@/components/layout/admin/AdminTopbar";
import SidebarOverlay from "@/components/layout/admin/SidebarOverlay";
import { ADMIN_STYLES } from "@/lib/styles";
import type { AppUser } from "@/types";

import { AdminCacheProvider } from "@/context/AdminCacheContext";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const user = session.user as unknown as AppUser;
  if (user.role !== "admin") redirect("/");

  return (
    <AdminCacheProvider>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#FDF8F3",
          color: "#2C1A0E",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <style>{ADMIN_STYLES}</style>

        <SidebarOverlay />

        <AdminSidebar userName={user.name} userRole={user.role} userImage={user.image} />

        <div className="admin-content-wrapper">
          <AdminTopbar userName={user.name} userRole={user.role} userImage={user.image} />

          <main style={{ flex: 1, overflowY: "auto", padding: "0" }}>
            {children}
          </main>

          {/* Footer */}
          <footer
            className="admin-footer"
            style={{
              borderTop: "1px solid #F0E0E6",
              padding: "12px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "white",
            }}
          >
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#B09080" }}>
              Irma Wedding Salon — Admin v1.0
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#C4788A" }}>
              Tugas Akhir · Telkom University Surabaya · 2026
            </span>
          </footer>
        </div>
      </div>
    </AdminCacheProvider>
  );
}