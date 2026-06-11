// app/(public)/dashboard/page.tsx
// Dashboard pelanggan — profil + aksi cepat
// Redirect ke /login kalau belum login
"use client";

import React, { useEffect, useState } from "react";
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
  const [salonOpenHours, setSalonOpenHours] = useState("Memuat jam buka...");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    setLoadingBookings(true);
    fetch("/api/bookings")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data booking");
        return res.json();
      })
      .then((data) => {
        if (data && data.rows) {
          setBookings(data.rows);
        }
        setLoadingBookings(false);
      })
      .catch((err) => {
        console.error("Error loading bookings:", err);
        setLoadingBookings(false);
      });
  }, []);

  const upcomingBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.booking_datetime);
    return bookingDate >= today && b.status !== "cancelled" && b.status !== "rejected";
  });

  const bookingsByDate: Record<string, any[]> = {};
  upcomingBookings.forEach((b) => {
    const dateObj = new Date(b.booking_datetime);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    if (!bookingsByDate[dateStr]) {
      bookingsByDate[dateStr] = [];
    }
    bookingsByDate[dateStr].push(b);
  });

  useEffect(() => {
    if (upcomingBookings.length > 0 && !selectedDateStr) {
      const sorted = [...upcomingBookings].sort(
        (a, b) => new Date(a.booking_datetime).getTime() - new Date(b.booking_datetime).getTime()
      );
      const earliest = new Date(sorted[0].booking_datetime);
      const y = earliest.getFullYear();
      const m = String(earliest.getMonth() + 1).padStart(2, "0");
      const d = String(earliest.getDate()).padStart(2, "0");
      setSelectedDateStr(`${y}-${m}-${d}`);
      setCurrentDate(earliest);
    }
  }, [upcomingBookings, selectedDateStr]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const formatIndonesianDateStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.salon_open_description) {
          setSalonOpenHours(data.salon_open_description);
        }
      })
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

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

        {/* ── Upcoming Bookings Calendar ── */}
        <div
          style={{
            background: "white",
            border: "1px solid #EDD8CC",
            borderRadius: "12px",
            padding: "24px 28px",
            marginBottom: "24px",
            boxShadow: "0 2px 16px rgba(107,58,42,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "#6B3A2A",
                  margin: 0,
                }}
              >
                Jadwal Booking Saya
              </h2>
              <p style={{ fontSize: "0.78rem", color: "#8B6A5A", margin: "2px 0 0 0" }}>
                Kalender booking aktif Anda di Rumah Cantik Irma
              </p>
            </div>

            {/* Navigation Controls */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={prevMonth}
                style={{
                  background: "none",
                  border: "1px solid #EDD8CC",
                  color: "#6B3A2A",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#C9922A";
                  e.currentTarget.style.color = "#C9922A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#EDD8CC";
                  e.currentTarget.style.color = "#6B3A2A";
                }}
              >
                ←
              </button>
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#2C1A0E",
                  minWidth: "100px",
                  textAlign: "center",
                }}
              >
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={nextMonth}
                style={{
                  background: "none",
                  border: "1px solid #EDD8CC",
                  color: "#6B3A2A",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#C9922A";
                  e.currentTarget.style.color = "#C9922A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#EDD8CC";
                  e.currentTarget.style.color = "#6B3A2A";
                }}
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ marginBottom: "20px" }}>
            {/* Week Headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                <span
                  key={day}
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "#B09080",
                    textTransform: "uppercase",
                  }}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                rowGap: "8px",
                textAlign: "center",
              }}
            >
              {/* Empty padding cells */}
              {Array(firstDayOfMonth)
                .fill(null)
                .map((_, idx) => (
                  <div key={`empty-${idx}`} />
                ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, idx) => {
                const dayNum = idx + 1;
                const mStr = String(currentMonth + 1).padStart(2, "0");
                const dStr = String(dayNum).padStart(2, "0");
                const dateStr = `${currentYear}-${mStr}-${dStr}`;

                const dayDate = new Date(currentYear, currentMonth, dayNum);
                dayDate.setHours(0, 0, 0, 0);

                const isPast = dayDate < today;
                const cellBookings = bookingsByDate[dateStr] || [];
                const hasBooking = cellBookings.length > 0;
                const isSelected = selectedDateStr === dateStr;

                // Style logic
                let cellStyle: React.CSSProperties = {
                  width: "36px",
                  height: "36px",
                  margin: "0 auto",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  cursor: isPast ? "default" : "pointer",
                  transition: "all 0.2s",
                  color: isPast ? "#D2C0B5" : "#2C1A0E",
                  position: "relative",
                };

                if (isSelected) {
                  cellStyle = {
                    ...cellStyle,
                    background: "linear-gradient(135deg, #6B3A2A, #C9922A)",
                    color: "white",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(107,58,42,0.2)",
                  };
                } else if (hasBooking) {
                  cellStyle = {
                    ...cellStyle,
                    border: "2px solid #C9922A",
                    background: "rgba(201, 146, 42, 0.06)",
                    color: "#6B3A2A",
                    fontWeight: 700,
                  };
                }

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => {
                      if (!isPast) {
                        setSelectedDateStr(dateStr);
                      }
                    }}
                    style={cellStyle}
                  >
                    {dayNum}
                    {hasBooking && !isSelected && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "3px",
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          background: "#C9922A",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Booking Details */}
          <div
            style={{
              borderTop: "1px solid #FAF0E6",
              paddingTop: "20px",
            }}
          >
            {selectedDateStr ? (
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#8B6A5A",
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>📅 Detail Booking ({formatIndonesianDateStr(selectedDateStr)})</span>
                  {(bookingsByDate[selectedDateStr] || []).length > 0 && (
                    <span style={{ fontSize: "0.75rem", background: "rgba(201,146,42,0.1)", color: "#C9922A", padding: "2px 8px", borderRadius: "20px" }}>
                      {(bookingsByDate[selectedDateStr] || []).length} Booking
                    </span>
                  )}
                </div>

                {(bookingsByDate[selectedDateStr] || []).length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      background: "#FAF6F4",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      color: "#8B6A5A",
                    }}
                  >
                    Tidak ada booking yang terdaftar untuk tanggal ini.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(bookingsByDate[selectedDateStr] || []).map((booking) => {
                      const bDate = new Date(booking.booking_datetime);
                      const timeStr = bDate.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });

                      // Status Config matching admin configs
                      let statusLabel = booking.status;
                      let statusBg = "rgba(100,100,100,0.1)";
                      let statusColor = "#555";

                      if (booking.status === "pending") {
                        statusLabel = "Menunggu";
                        statusBg = "rgba(201,146,42,0.1)";
                        statusColor = "#A07010";
                      } else if (booking.status === "confirmed") {
                        statusLabel = "Disetujui";
                        statusBg = "rgba(42,140,90,0.1)";
                        statusColor = "#1A7A4A";
                      } else if (booking.status === "completed") {
                        statusLabel = "Selesai";
                        statusBg = "rgba(42,140,90,0.1)";
                        statusColor = "#1A7A4A";
                      } else if (booking.status === "cancelled") {
                        statusLabel = "Dibatalkan";
                        statusBg = "rgba(217,64,96,0.1)";
                        statusColor = "#D94060";
                      }

                      const showInvoiceBtn = booking.transaction_id && 
                        (booking.status === "confirmed" || booking.status === "completed");

                      return (
                        <div
                          key={booking.id}
                          style={{
                            background: "#FAF6F4",
                            border: "1px solid #EDD8CC",
                            borderRadius: "8px",
                            padding: "16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: "200px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                              <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: "#C9922A" }}>
                                ⏰ {timeStr} WIB
                              </span>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  background: statusBg,
                                  color: statusColor,
                                }}
                              >
                                {statusLabel}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
                              {booking.services}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#8B6A5A" }}>
                              Total Pembayaran: <strong style={{ color: "#6B3A2A" }}>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(booking.total_amount))}</strong>
                            </div>
                          </div>

                          {showInvoiceBtn && (
                            <button
                              onClick={() => window.open(`/invoice/${booking.transaction_id}`, "_blank")}
                              style={{
                                background: "white",
                                border: "1px solid #C9922A",
                                color: "#C9922A",
                                padding: "8px 14px",
                                borderRadius: "6px",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#C9922A";
                                e.currentTarget.style.color = "white";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.color = "#C9922A";
                              }}
                            >
                              📄 Cetak Invoice
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px",
                  background: "#FAF6F4",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  color: "#8B6A5A",
                }}
              >
                {loadingBookings ? "Sedang memuat data booking..." : "Pilih tanggal yang disorot pada kalender untuk melihat detail booking aktif Anda."}
              </div>
            )}
          </div>
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
              🏪 {salonOpenHours}
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