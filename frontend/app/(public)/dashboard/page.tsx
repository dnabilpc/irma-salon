// app/(public)/dashboard/page.tsx
// Dashboard pelanggan — profil + aksi cepat
// Redirect ke /login kalau belum login
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";

// ── Kartu aksi cepat ───────────────────────────────────────────────────────

interface QuickAction {
  icon: string;
  label: string;
  desc: string;
  href: string;
  accent: string;
  bg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: "📅",
    label: "Booking Layanan",
    desc: "Reservasi jadwal salon kamu",
    href: "/booking",
    accent: "#6B3A2A",
    bg: "rgba(107,58,42,0.06)",
  },
  {
    icon: "👗",
    label: "Sewa Baju",
    desc: "Lihat koleksi & sewa baju pesta",
    href: "/rent",
    accent: "#C9922A",
    bg: "rgba(201,146,42,0.06)",
  },
  {
    icon: "✨",
    label: "Virtual Try-On",
    desc: "Coba baju secara virtual via AR",
    href: "/virtual-try-on",
    accent: "#E8A89C",
    bg: "rgba(232,168,156,0.12)",
  },
];

// ── Komponen kartu aksi ────────────────────────────────────────────────────

function QuickActionCard({ action }: { action: QuickAction }) {
  return (
    <Link href={action.href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "white",
          border: "1px solid #EDD8CC",
          borderRadius: "8px",
          padding: "28px 24px",
          cursor: "pointer",
          transition: "all 0.25s ease",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.transform = "translateY(-4px)";
          el.style.boxShadow = "0 12px 32px rgba(107,58,42,0.1)";
          el.style.borderColor = action.accent;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
          el.style.borderColor = "#EDD8CC";
        }}
      >
        {/* Icon background */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "12px",
            background: action.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.6rem",
          }}
        >
          {action.icon}
        </div>

        <div>
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#2C1A0E",
              marginBottom: "4px",
            }}
          >
            {action.label}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              color: "#8B6A5A",
              lineHeight: 1.5,
            }}
          >
            {action.desc}
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            color: action.accent,
            fontSize: "1rem",
            opacity: 0.6,
          }}
        >
          →
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Redirect ke login kalau belum login
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [session, isPending, router]);

  // Redirect admin ke halaman admin
  useEffect(() => {
    if (!isPending && session?.user) {
      const user = session.user as { role?: string };
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      }
    }
  }, [session, isPending, router]);

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/"),
      },
    });
  }

  // Loading
  if (isPending || !session) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          color: "#8B6A5A",
          fontSize: "0.9rem",
        }}
      >
        Memuat...
      </div>
    );
  }

  const user = session.user;

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: "100px",
        paddingBottom: "80px",
        background: "#FDF8F3",
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >

        {/* ── Header profil ── */}
        {/* ── Header profil ── */}
        <div
          className="profile-header"
          style={{
            background: "white",
            border: "1px solid #EDD8CC",
            borderRadius: "12px",
            padding: "32px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            boxShadow: "0 2px 16px rgba(107,58,42,0.05)",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              border: "2px solid #E8A89C",
              overflow: "hidden",
              background: "#F5E6E0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(107,58,42,0.15)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.image || "/avatar_placeholder.png"}
              alt="Foto Profil"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.68rem",
                letterSpacing: "0.2em",
                color: "#C9922A",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Selamat datang kembali
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#2C1A0E",
                marginBottom: "4px",
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.82rem",
                color: "#8B6A5A",
              }}
            >
              {user.email}
            </div>
          </div>

          {/* Aksi Profil */}
          <div
            className="profile-actions"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <Link href="/profile" style={{ textDecoration: "none" }}>
              <button
                style={{
                  width: "100%",
                  background: "#6B3A2A",
                  border: "1px solid #6B3A2A",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#C9922A";
                  e.currentTarget.style.borderColor = "#C9922A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#6B3A2A";
                  e.currentTarget.style.borderColor = "#6B3A2A";
                }}
              >
                Edit Profil
              </button>
            </Link>

            <button
              onClick={handleSignOut}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid #EDD8CC",
                color: "#8B6A5A",
                padding: "8px 16px",
                borderRadius: "6px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.78rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#DC5050";
                e.currentTarget.style.color = "#DC5050";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#EDD8CC";
                e.currentTarget.style.color = "#8B6A5A";
              }}
            >
              Keluar
            </button>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#EDD8CC" }} />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.18em",
              color: "#C9922A",
              textTransform: "uppercase",
            }}
          >
            Apa yang ingin kamu lakukan?
          </span>
          <div style={{ flex: 1, height: "1px", background: "#EDD8CC" }} />
        </div>

        {/* ── Aksi cepat ── */}
        <div
          className="dashboard-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard key={action.label} action={action} />
          ))}
        </div>

        {/* ── Info salon ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #6B3A2A, #C9922A)",
            borderRadius: "12px",
            padding: "24px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: "white",
                marginBottom: "4px",
              }}
            >
              Rumah Cantik Irma
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Buka Senin – Sabtu · 09.00 – 18.00 WIB
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.7)",
                marginTop: "2px",
              }}
            >
              📍 Graha Suko Indah B-1, Sukodono, Sidoarjo
            </div>
          </div>
          <a
            href="https://wa.me/6285174481660"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 500,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            📱 Hubungi via WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}