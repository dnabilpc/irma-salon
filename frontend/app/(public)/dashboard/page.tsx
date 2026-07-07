// app/(public)/dashboard/page.tsx
// Dashboard pelanggan — profil + aksi cepat
// Redirect ke /login kalau belum login
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { cancelBooking } from "@/actions/booking";
import { cancelRental } from "@/actions/rental";

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
  const [rentals, setRentals] = useState<any[]>([]);
  const [loadingRentals, setLoadingRentals] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [vtoTasks, setVtoTasks] = useState<any[]>([]);
  const [loadingVto, setLoadingVto] = useState(true);
  const vtoSectionRef = React.useRef<HTMLDivElement>(null);

  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null);
  const [cancellingRentalId, setCancellingRentalId] = useState<number | null>(null);
  const [confirmingBookingCancelId, setConfirmingBookingCancelId] = useState<number | null>(null);
  const [confirmingRentalCancelId, setConfirmingRentalCancelId] = useState<number | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (confirmingBookingCancelId !== null) {
      const timer = setTimeout(() => {
        setConfirmingBookingCancelId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmingBookingCancelId]);

  useEffect(() => {
    if (confirmingRentalCancelId !== null) {
      const timer = setTimeout(() => {
        setConfirmingRentalCancelId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmingRentalCancelId]);

  const fetchBookings = () => {
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
  };

  const fetchRentals = () => {
    setLoadingRentals(true);
    fetch("/api/rentals")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data sewa");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setRentals(data);
        }
        setLoadingRentals(false);
      })
      .catch((err) => {
        console.error("Error loading rentals:", err);
        setLoadingRentals(false);
      });
  };

  useEffect(() => {
    fetchBookings();
    fetchRentals();
  }, []);

  const handleCancelBooking = async (bookingId: number) => {
    setCancellingBookingId(bookingId);
    try {
      const res = await cancelBooking(bookingId);
      if (res.success) {
        alert("Booking berhasil dibatalkan.");
        fetchBookings();
      } else {
        alert(res.error || "Gagal membatalkan booking.");
      }
    } catch (err) {
      console.error("Cancel booking error:", err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setCancellingBookingId(null);
      setConfirmingBookingCancelId(null);
    }
  };

  const handleCancelRental = async (rentalId: number) => {
    setCancellingRentalId(rentalId);
    try {
      const res = await cancelRental(rentalId);
      if (res.success) {
        alert("Sewa baju berhasil dibatalkan.");
        fetchRentals();
      } else {
        alert(res.error || "Gagal membatalkan sewa baju.");
      }
    } catch (err) {
      console.error("Cancel rental error:", err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setCancellingRentalId(null);
      setConfirmingRentalCancelId(null);
    }
  };

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

  // Load VTO history
  useEffect(() => {
    if (!session) return;
    
    const fetchVto = () => {
      fetch("/api/vto/history")
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil riwayat VTO");
          return res.json();
        })
        .then((data) => {
          setVtoTasks(data);
          setLoadingVto(false);
        })
        .catch((err) => {
          console.error("Error loading VTO history:", err);
          setLoadingVto(false);
        });
    };

    fetchVto();
  }, [session]);

  // Polling for VTO tasks if pending/processing
  useEffect(() => {
    if (!session) return;
    const hasActiveTasks = vtoTasks.some(
      (task) => task.status === "pending" || task.status === "processing"
    );
    if (!hasActiveTasks) return;

    const interval = setInterval(() => {
      fetch("/api/vto/history")
        .then((res) => {
          if (res.ok) return res.json();
        })
        .then((data) => {
          if (data) setVtoTasks(data);
        })
        .catch((err) => console.error("Error polling VTO history:", err));
    }, 10000);

    return () => clearInterval(interval);
  }, [session, vtoTasks]);

  // Scroll to VTO section if param exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("section") === "vto") {
        setTimeout(() => {
          vtoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, [loadingVto]);

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
                        booking.status !== "cancelled" && booking.status !== "rejected";

                      const canCancelBooking = booking.status === "pending" || 
                        (booking.status === "confirmed" && booking.payment_status !== "lunas");

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

                           <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                             {showInvoiceBtn && (
                               <button
                                 onClick={() => window.open(`/invoice/${booking.transaction_id}`, "_blank")}
                                 style={{
                                   background: booking.status === "pending" ? "#C9922A" : "white",
                                   border: "1px solid #C9922A",
                                   color: booking.status === "pending" ? "white" : "#C9922A",
                                   padding: "8px 14px",
                                   borderRadius: "6px",
                                   fontSize: "0.78rem",
                                   fontWeight: 600,
                                   cursor: "pointer",
                                   transition: "all 0.2s",
                                 }}
                                 onMouseEnter={(e) => {
                                   e.currentTarget.style.background = booking.status === "pending" ? "#6B3A2A" : "#C9922A";
                                   e.currentTarget.style.color = "white";
                                 }}
                                 onMouseLeave={(e) => {
                                   e.currentTarget.style.background = booking.status === "pending" ? "#C9922A" : "white";
                                   e.currentTarget.style.color = booking.status === "pending" ? "white" : "#C9922A";
                                 }}
                               >
                                 {booking.status === "pending" ? "💳 Bayar" : "📄 Cetak Invoice"}
                               </button>
                             )}

                             {canCancelBooking && (
                               <button
                                 onClick={() => {
                                   if (confirmingBookingCancelId === booking.id) {
                                     handleCancelBooking(booking.id);
                                   } else {
                                     setConfirmingBookingCancelId(booking.id);
                                   }
                                 }}
                                 disabled={cancellingBookingId === booking.id}
                                 style={{
                                   background: confirmingBookingCancelId === booking.id ? "#DC5050" : "transparent",
                                   border: "1px solid #DC5050",
                                   color: confirmingBookingCancelId === booking.id ? "white" : "#DC5050",
                                   padding: "8px 14px",
                                   borderRadius: "6px",
                                   fontSize: "0.78rem",
                                   fontWeight: 600,
                                   cursor: "pointer",
                                   transition: "all 0.2s",
                                 }}
                                 onMouseEnter={(e) => {
                                   if (confirmingBookingCancelId !== booking.id) {
                                     e.currentTarget.style.background = "#DC5050";
                                     e.currentTarget.style.color = "white";
                                   }
                                 }}
                                 onMouseLeave={(e) => {
                                   if (confirmingBookingCancelId !== booking.id) {
                                     e.currentTarget.style.background = "transparent";
                                     e.currentTarget.style.color = "#DC5050";
                                   }
                                 }}
                               >
                                 {cancellingBookingId === booking.id 
                                   ? "Memproses..." 
                                   : confirmingBookingCancelId === booking.id 
                                     ? "⚠️ Yakin Batal?" 
                                     : "✕ Batalkan"}
                               </button>
                             )}
                           </div>
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

        {/* ── Riwayat Sewa Baju ── */}
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
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#6B3A2A",
                margin: 0,
              }}
            >
              Riwayat Sewa Baju
            </h2>
            <p style={{ fontSize: "0.78rem", color: "#8B6A5A", margin: "2px 0 0 0" }}>
              Daftar penyewaan busana pesta dan baju pengantin Anda
            </p>
          </div>

          {loadingRentals ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#8B6A5A", fontSize: "0.85rem" }}>
              Memuat riwayat sewa baju...
            </div>
          ) : rentals.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "28px",
                background: "#FAF6F4",
                borderRadius: "8px",
                fontSize: "0.82rem",
                color: "#8B6A5A",
                border: "1px dashed #EDD8CC",
              }}
            >
              Anda belum pernah menyewa baju di salon kami.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {rentals.map((rental) => {
                const sDate = new Date(rental.start_date);
                const eDate = new Date(rental.end_date);
                const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
                const sDateStr = sDate.toLocaleDateString("id-ID", options);
                const eDateStr = eDate.toLocaleDateString("id-ID", options);

                // Status configuration
                let statusLabel = rental.status;
                let statusBg = "rgba(100,100,100,0.1)";
                let statusColor = "#555";

                if (rental.status === "pending") {
                  statusLabel = "Menunggu";
                  statusBg = "rgba(201,146,42,0.1)";
                  statusColor = "#A07010";
                } else if (rental.status === "ongoing") {
                  statusLabel = "Sewa Aktif";
                  statusBg = "rgba(42,140,90,0.1)";
                  statusColor = "#1A7A4A";
                } else if (rental.status === "terlambat") {
                  statusLabel = "Terlambat";
                  statusBg = "rgba(217,64,96,0.1)";
                  statusColor = "#D94060";
                } else if (rental.status === "done") {
                  statusLabel = "Selesai";
                  statusBg = "rgba(42,140,90,0.1)";
                  statusColor = "#1A7A4A";
                } else if (rental.status === "cancelled") {
                  statusLabel = "Dibatalkan";
                  statusBg = "rgba(122,92,80,0.1)";
                  statusColor = "#7A5C50";
                }

                // Payment Status configuration
                let payLabel = "Belum Lunas";
                let payBg = "rgba(201,146,42,0.1)";
                let payColor = "#A07010";
                if (rental.payment_status === "lunas") {
                  payLabel = "Lunas";
                  payBg = "rgba(42,140,90,0.1)";
                  payColor = "#1A7A4A";
                }

                const canCancelRental = rental.status === "pending" || (rental.status === "ongoing" && rental.payment_status !== "lunas");
                const showInvoiceBtn = rental.transaction_id && rental.status !== "cancelled";

                return (
                  <div
                    key={rental.id}
                    style={{
                      background: "#FAF6F4",
                      border: "1px solid #EDD8CC",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "220px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px", borderRadius: "12px", background: statusBg, color: statusColor }}>
                          {statusLabel}
                        </span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px", borderRadius: "12px", background: payBg, color: payColor }}>
                          💳 {payLabel}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#8B6A5A" }}>
                          #{rental.id}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
                        {rental.outfit_name}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "#8B6A5A", marginBottom: "2px" }}>
                        Kategori: <strong style={{ color: "#6B3A2A" }}>{rental.category_name}</strong>
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "#8B6A5A", marginBottom: "2px" }}>
                        Durasi: <strong>{sDateStr} s/d {eDateStr}</strong> ({rental.duration_days} hari)
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#8B6A5A" }}>
                        Total Biaya: <strong style={{ color: "#6B3A2A" }}>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(rental.amount_to_be_paid))}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {showInvoiceBtn && (
                        <button
                          onClick={() => window.open(`/invoice/${rental.transaction_id}`, "_blank")}
                          style={{
                            background: rental.payment_status === "pending" ? "#C9922A" : "white",
                            border: "1px solid #C9922A",
                            color: rental.payment_status === "pending" ? "white" : "#C9922A",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = rental.payment_status === "pending" ? "#6B3A2A" : "#C9922A";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = rental.payment_status === "pending" ? "#C9922A" : "white";
                            e.currentTarget.style.color = rental.payment_status === "pending" ? "white" : "#C9922A";
                          }}
                        >
                          {rental.payment_status === "pending" ? "💳 Bayar" : "📄 Cetak Invoice"}
                        </button>
                      )}

                      {canCancelRental && (
                        <button
                          onClick={() => {
                            if (confirmingRentalCancelId === rental.id) {
                              handleCancelRental(rental.id);
                            } else {
                              setConfirmingRentalCancelId(rental.id);
                            }
                          }}
                          disabled={cancellingRentalId === rental.id}
                          style={{
                            background: confirmingRentalCancelId === rental.id ? "#DC5050" : "transparent",
                            border: "1px solid #DC5050",
                            color: confirmingRentalCancelId === rental.id ? "white" : "#DC5050",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (confirmingRentalCancelId !== rental.id) {
                              e.currentTarget.style.background = "#DC5050";
                              e.currentTarget.style.color = "white";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (confirmingRentalCancelId !== rental.id) {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "#DC5050";
                            }
                          }}
                        >
                          {cancellingRentalId === rental.id 
                            ? "Memproses..." 
                            : confirmingRentalCancelId === rental.id 
                              ? "⚠️ Yakin Batal?" 
                              : "✕ Batalkan"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Riwayat Virtual Try-On ── */}
        <div
          ref={vtoSectionRef}
          style={{
            background: "white",
            border: "1px solid #EDD8CC",
            borderRadius: "12px",
            padding: "24px 28px",
            marginBottom: "24px",
            boxShadow: "0 2px 16px rgba(107,58,42,0.05)",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#6B3A2A",
                margin: 0,
              }}
            >
              Riwayat Virtual Try-On
            </h2>
            <p style={{ fontSize: "0.78rem", color: "#8B6A5A", margin: "2px 0 0 0" }}>
              Daftar hasil eksperimen coba baju virtual Anda
            </p>
          </div>

          {loadingVto ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#8B6A5A", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif" }}>
              Memuat riwayat Virtual Try-On...
            </div>
          ) : vtoTasks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 24px",
                background: "#FAF6F4",
                borderRadius: "8px",
                fontSize: "0.82rem",
                color: "#8B6A5A",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "8px" }}>👗</span>
              Anda belum pernah melakukan Virtual Try-On.
              <Link href="/virtual-try-on" style={{ color: "#C9922A", textDecoration: "none", fontWeight: 600, marginLeft: "6px" }}>
                Coba Sekarang →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {vtoTasks.map((task) => {
                const isCompleted = task.status === "completed";
                const isFailed = task.status === "failed";
                const isProcessing = task.status === "processing";
                
                let statusLabel = "Menunggu Antrean";
                let statusBg = "rgba(107,58,42,0.08)";
                let statusColor = "#6B3A2A";
                
                if (isProcessing) {
                  statusLabel = "Diproses AI";
                  statusBg = "rgba(201,146,42,0.1)";
                  statusColor = "#A07010";
                } else if (isCompleted) {
                  statusLabel = "Selesai";
                  statusBg = "rgba(42,140,90,0.1)";
                  statusColor = "#1A7A4A";
                } else if (isFailed) {
                  statusLabel = "Gagal";
                  statusBg = "rgba(217,64,96,0.1)";
                  statusColor = "#D94060";
                }

                const dateStr = task.created_at ? new Date(task.created_at).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "";

                return (
                  <div
                    key={task.id}
                    style={{
                      background: "#FAF6F4",
                      border: "1px solid #EDD8CC",
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      gap: "16px",
                      alignItems: "stretch",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Left side: input images */}
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
                      {/* Selfie */}
                      <div style={{ width: "60px", height: "80px", borderRadius: "6px", overflow: "hidden", border: "1px solid #EDD8CC", background: "#F5E6E0", position: "relative" }}>
                        {task.person_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={task.person_image_url} alt="Selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>🤳</div>
                        )}
                      </div>
                      <span style={{ color: "#D2C0B5" }}>+</span>
                      {/* Clothes */}
                      <div style={{ width: "60px", height: "80px", borderRadius: "6px", overflow: "hidden", border: "1px solid #EDD8CC", background: "#F5E6E0", position: "relative" }}>
                        {task.clothes_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={task.clothes_image_url} alt="Baju" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>👗</div>
                        )}
                      </div>
                    </div>

                    {/* Middle side: Details & Status */}
                    <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.72rem", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
                          {dateStr}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: statusBg,
                            color: statusColor,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          {isProcessing && (
                            <span style={{
                              width: "5px", height: "5px", borderRadius: "50%", background: "#C9922A",
                              animation: "pulse 1.2s infinite"
                            }} />
                          )}
                          {statusLabel}
                        </span>
                      </div>
                      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: "#2C1A0E", margin: "0 0 4px 0" }}>
                        {task.outfit_name || "Custom Outfit"}
                      </h3>
                      {isFailed && task.error_message && (
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#D94060", fontFamily: "'DM Sans', sans-serif" }}>
                          Error: {task.error_message}
                        </p>
                      )}
                    </div>

                    {/* Right side: VTO Result output or download action */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0, marginLeft: "auto" }}>
                      {isCompleted && task.result_image_url ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div 
                            style={{ 
                              width: "60px", 
                              height: "80px", 
                              borderRadius: "6px", 
                              overflow: "hidden", 
                              border: "1.5px solid #C9922A", 
                              boxShadow: "0 4px 12px rgba(201,146,42,0.15)",
                              position: "relative",
                              cursor: "pointer"
                            }}
                            onClick={() => window.open(task.result_image_url, "_blank")}
                            title="Klik untuk memperbesar"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={task.result_image_url} alt="Hasil VTO" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <button
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = task.result_image_url;
                              link.download = `vto-${(task.outfit_name || "outfit").replace(/\s+/g, "-").toLowerCase()}.jpg`;
                              link.target = "_blank";
                              link.click();
                            }}
                            style={{
                              background: "#C9922A",
                              border: "none",
                              color: "white",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "background 0.2s",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#6B3A2A")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#C9922A")}
                          >
                            ⬇ Unduh
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "60px", height: "80px", borderRadius: "6px", border: "1px dashed #EDD8CC", background: "rgba(255,255,255,0.4)" }}>
                          <span style={{ fontSize: "1.2rem", opacity: 0.3 }}>
                            {isProcessing ? "⏳" : isFailed ? "❌" : "⏱️"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style>{`
          @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        `}</style>

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