"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
type PaymentStatus = "paid" | "pending" | "refunded";
type NavItem = "dashboard" | "bookings" | "rentals" | "customers" | "payments" | "settings";
type RentalStatus = "dipinjam" | "dikembalikan" | "terlambat";
type NotifType = "booking" | "payment" | "review" | "return";

interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  accent: string;
}

interface Booking {
  id: string;
  customer: string;
  service: string;
  date: string;
  time: string;
  status: BookingStatus;
  payment: PaymentStatus;
  amount: number;
}

interface RecentRental {
  id: string;
  customer: string;
  item: string;
  rentDate: string;
  returnDate: string;
  status: RentalStatus;
  amount: number;
}

interface ChartBar {
  day: string;
  bookings: number;
  revenue: number;
}

interface Notification {
  id: number;
  message: string;
  time: string;
  type: NotifType;
  unread: boolean;
}

interface NavItemConfig {
  icon: string;
  label: string;
  id: NavItem;
  badge?: number;
}

interface ScheduleItem {
  time: string;
  name: string;
  service: string;
  status: "upcoming" | "ongoing";
}

interface ServiceBreakdown {
  name: string;
  pct: number;
  count: number;
}

interface SummaryItem {
  label: string;
  value: string;
  sub: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const statCards: StatCard[] = [
  { label: "Total Booking Bulan Ini", value: "128", change: "+12%", positive: true,  icon: "📅", accent: "#C9922A" },
  { label: "Pendapatan Bulan Ini",    value: "Rp 14.2jt", change: "+8.4%", positive: true,  icon: "💰", accent: "#4CAF82" },
  { label: "Sewa Baju Aktif",         value: "23",  change: "+3",   positive: true,  icon: "👗", accent: "#E8A89C" },
  { label: "Pelanggan Baru",          value: "41",  change: "-2%",  positive: false, icon: "👤", accent: "#7B9FD4" },
];

const weeklyChart: ChartBar[] = [
  { day: "Sen", bookings: 8,  revenue: 920000  },
  { day: "Sel", bookings: 12, revenue: 1380000 },
  { day: "Rab", bookings: 7,  revenue: 840000  },
  { day: "Kam", bookings: 15, revenue: 1750000 },
  { day: "Jum", bookings: 18, revenue: 2100000 },
  { day: "Sab", bookings: 24, revenue: 2880000 },
  { day: "Min", bookings: 20, revenue: 2400000 },
];

const recentBookings: Booking[] = [
  { id: "BK-001", customer: "Siti Rahayu",    service: "Hair Treatment", date: "09 Mar", time: "10:00", status: "confirmed", payment: "paid",    amount: 150000 },
  { id: "BK-002", customer: "Dewi Kusuma",    service: "Makeup & Rias",  date: "09 Mar", time: "13:00", status: "pending",   payment: "pending", amount: 250000 },
  { id: "BK-003", customer: "Rina Aprilia",   service: "Nail Care",      date: "09 Mar", time: "14:30", status: "confirmed", payment: "paid",    amount: 80000  },
  { id: "BK-004", customer: "Mega Putri",     service: "Facial",         date: "09 Mar", time: "16:00", status: "cancelled", payment: "refunded",amount: 120000 },
  { id: "BK-005", customer: "Layla Hanum",    service: "Hair Treatment", date: "10 Mar", time: "09:00", status: "pending",   payment: "pending", amount: 150000 },
  { id: "BK-006", customer: "Nurul Fadilah",  service: "Makeup & Rias",  date: "10 Mar", time: "11:00", status: "confirmed", payment: "paid",    amount: 300000 },
];

const recentRentals: RecentRental[] = [
  { id: "SW-021", customer: "Aisyah Putri",    item: "Kebaya Merah Pengantin", rentDate: "08 Mar", returnDate: "10 Mar", status: "dipinjam",     amount: 350000 },
  { id: "SW-022", customer: "Fitri Handayani", item: "Gaun Pesta Hijau",       rentDate: "07 Mar", returnDate: "09 Mar", status: "dikembalikan", amount: 200000 },
  { id: "SW-023", customer: "Yuni Kartika",    item: "Kebaya Biru Modern",     rentDate: "06 Mar", returnDate: "08 Mar", status: "terlambat",    amount: 250000 },
  { id: "SW-024", customer: "Risa Amalia",     item: "Dress Batik Premium",    rentDate: "09 Mar", returnDate: "11 Mar", status: "dipinjam",     amount: 180000 },
];

const notifications: Notification[] = [
  { id: 1, message: "Booking baru dari Dewi Kusuma – Makeup & Rias",    time: "5 menit lalu",  type: "booking", unread: true  },
  { id: 2, message: "Pembayaran Rp 300.000 dari Nurul Fadilah berhasil", time: "23 menit lalu", type: "payment", unread: true  },
  { id: 3, message: "SW-023 terlambat dikembalikan oleh Yuni Kartika",  time: "1 jam lalu",    type: "return",  unread: true  },
  { id: 4, message: "Review bintang 5 dari Siti Rahayu",                time: "2 jam lalu",    type: "review",  unread: false },
  { id: 5, message: "Booking baru dari Layla Hanum – Hair Treatment",   time: "3 jam lalu",    type: "booking", unread: false },
];

const todaySchedule: ScheduleItem[] = [
  { time: "09:00", name: "Layla Hanum",  service: "Hair Treatment", status: "upcoming" },
  { time: "10:00", name: "Siti Rahayu", service: "Hair Treatment", status: "ongoing"  },
  { time: "13:00", name: "Dewi Kusuma", service: "Makeup & Rias",  status: "upcoming" },
  { time: "14:30", name: "Rina Aprilia",service: "Nail Care",      status: "upcoming" },
];

const serviceBreakdown: ServiceBreakdown[] = [
  { name: "Makeup & Rias",   pct: 82, count: 42 },
  { name: "Hair Treatment",  pct: 68, count: 35 },
  { name: "Persewaan Baju",  pct: 55, count: 28 },
  { name: "Facial",          pct: 40, count: 21 },
];

const summaryItems: SummaryItem[] = [
  { label: "Total Booking", value: "104",      sub: "minggu ini" },
  { label: "Total Revenue", value: "Rp 12.3jt",sub: "minggu ini" },
  { label: "Avg. per Hari", value: "Rp 1.75jt",sub: "rata-rata"  },
];

const navItems: NavItemConfig[] = [
  { icon: "▦",  label: "Dashboard",    id: "dashboard" },
  { icon: "📅", label: "Booking Salon",id: "bookings",  badge: 2 },
  { icon: "👗", label: "Sewa Baju",    id: "rentals",   badge: 1 },
  { icon: "👤", label: "Pelanggan",    id: "customers" },
  { icon: "💳", label: "Pembayaran",   id: "payments"  },
  { icon: "⚙️", label: "Pengaturan",   id: "settings"  },
];

const notifIcon: Record<NotifType, string> = {
  booking: "📅", payment: "💳", review: "⭐", return: "⚠️",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);
}

function getBookingStatusStyle(status: BookingStatus): { bg: string; color: string; label: string } {
  const map: Record<BookingStatus, { bg: string; color: string; label: string }> = {
    pending:   { bg: "rgba(201,146,42,0.15)",  color: "#C9922A", label: "Pending"   },
    confirmed: { bg: "rgba(76,175,130,0.15)",  color: "#4CAF82", label: "Confirmed" },
    completed: { bg: "rgba(123,159,212,0.15)", color: "#7B9FD4", label: "Selesai"   },
    cancelled: { bg: "rgba(220,80,80,0.15)",   color: "#DC5050", label: "Batal"     },
  };
  return map[status];
}

function getPaymentStyle(status: PaymentStatus): { bg: string; color: string; label: string } {
  const map: Record<PaymentStatus, { bg: string; color: string; label: string }> = {
    paid:     { bg: "rgba(76,175,130,0.15)",  color: "#4CAF82", label: "Lunas"      },
    pending:  { bg: "rgba(201,146,42,0.15)",  color: "#C9922A", label: "Belum Bayar"},
    refunded: { bg: "rgba(123,159,212,0.15)", color: "#7B9FD4", label: "Refund"     },
  };
  return map[status];
}

function getRentalStyle(status: RentalStatus): { bg: string; color: string } {
  const map: Record<RentalStatus, { bg: string; color: string }> = {
    dipinjam:     { bg: "rgba(201,146,42,0.15)", color: "#C9922A" },
    dikembalikan: { bg: "rgba(76,175,130,0.15)", color: "#4CAF82" },
    terlambat:    { bg: "rgba(220,80,80,0.15)",  color: "#DC5050" },
  };
  return map[status];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      background: bg, color, fontSize: "0.7rem", fontWeight: 600,
      padding: "3px 10px", borderRadius: "2px", letterSpacing: "0.06em",
      fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" as const,
    }}>
      {label}
    </span>
  );
}

interface SidebarItemProps {
  icon: string;
  label: string;
  id: NavItem;
  active: boolean;
  onClick: (id: NavItem) => void;
  badge?: number;
  expanded: boolean;
}

function SidebarItem({ icon, label, id, active, onClick, badge, expanded }: SidebarItemProps) {
  const [hovered, setHovered] = useState<boolean>(false);
  return (
    <button
      onClick={() => onClick(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        width: "100%", padding: "11px 16px", border: "none", cursor: "pointer",
        background: active ? "rgba(201,146,42,0.12)" : hovered ? "rgba(255,255,255,0.03)" : "transparent",
        borderLeft: active ? "2px solid #C9922A" : "2px solid transparent",
        color: active ? "#C9922A" : hovered ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)",
        fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: active ? 500 : 400,
        transition: "all 0.2s", textAlign: "left" as const, borderRadius: "0 4px 4px 0",
      }}
    >
      <span style={{ fontSize: "1rem", width: "20px", textAlign: "center" as const, flexShrink: 0 }}>{icon}</span>
      {expanded && (
        <>
          <span style={{ flex: 1 }}>{label}</span>
          {badge !== undefined && badge > 0 && (
            <span style={{
              background: "#C9922A", color: "#1A0F05", fontSize: "0.65rem",
              fontWeight: 700, padding: "2px 7px", borderRadius: "10px",
            }}>{badge}</span>
          )}
        </>
      )}
    </button>
  );
}

function WeeklyChart({ data }: { data: ChartBar[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  const maxBookings = Math.max(...data.map((d) => d.bookings));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "120px", padding: "0 4px" }}>
      {data.map((bar) => (
        <div key={bar.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", gap: "3px" }}>
            <div
              title={`Revenue: ${formatRupiah(bar.revenue)}`}
              style={{
                flex: 1, borderRadius: "2px 2px 0 0", minHeight: "4px",
                height: `${(bar.revenue / maxRevenue) * 100}%`,
                background: "linear-gradient(to top, #C9922A, rgba(201,146,42,0.4))",
                transition: "height 0.6s ease",
              }}
            />
            <div
              title={`Booking: ${bar.bookings}`}
              style={{
                flex: 1, borderRadius: "2px 2px 0 0", minHeight: "4px",
                height: `${(bar.bookings / maxBookings) * 100}%`,
                background: "linear-gradient(to top, #7B9FD4, rgba(123,159,212,0.4))",
                transition: "height 0.6s ease",
              }}
            />
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>{bar.day}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
  const [showNotif, setShowNotif] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [bookingFilter, setBookingFilter] = useState<BookingStatus | "all">("all");

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredBookings: Booking[] =
    bookingFilter === "all"
      ? recentBookings
      : recentBookings.filter((b) => b.status === bookingFilter);

  const filterOptions: Array<{ key: BookingStatus | "all"; label: string }> = [
    { key: "all", label: "Semua" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "completed", label: "Selesai" },
    { key: "cancelled", label: "Batal" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F0A05", color: "white", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Cormorant+Garamond:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #1A0F05; }
        ::-webkit-scrollbar-thumb { background: #3A2010; border-radius: 2px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-anim { animation: fadeUp 0.4s ease forwards; opacity: 0; }

        .stat-card {
          background: #1A0F05;
          border: 1px solid #2A1A0A;
          padding: 24px;
          transition: all 0.25s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .stat-card:hover {
          border-color: #3A2A1A;
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
        }

        .table-row {
          display: grid;
          padding: 13px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
          align-items: center;
          gap: 8px;
        }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: rgba(255,255,255,0.025); }

        .filter-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.4);
          padding: 5px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 2px;
        }
        .filter-btn:hover { border-color: rgba(201,146,42,0.4); color: #C9922A; }
        .filter-btn.active {
          background: rgba(201,146,42,0.12);
          border-color: #C9922A;
          color: #C9922A;
        }

        .notif-panel {
          position: absolute; top: 52px; right: 0;
          width: 340px; background: #1A0F05;
          border: 1px solid #2A1A0A;
          border-radius: 4px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7);
          z-index: 200;
          animation: slideDown 0.2s ease;
          max-height: 420px;
          overflow-y: auto;
        }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .main-grid  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarOpen ? "220px" : "56px",
        background: "#130900",
        borderRight: "1px solid #2A1A0A",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
        transition: "width 0.3s ease",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 16px 18px", borderBottom: "1px solid #2A1A0A", minHeight: "64px", display: "flex", alignItems: "center" }}>
          {sidebarOpen ? (
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 700, color: "#C9922A", letterSpacing: "0.05em" }}>
                Rumah Cantik
              </div>
              <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em", textTransform: "uppercase" as const, marginTop: "2px" }}>
                Admin Panel
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 700, color: "#C9922A", textAlign: "center" as const, width: "100%" }}>
              RC
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "10px 0", display: "flex", flexDirection: "column", gap: "2px" }}>
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              id={item.id}
              active={activeNav === item.id}
              onClick={setActiveNav}
              badge={item.badge}
              expanded={sidebarOpen}
            />
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #2A1A0A", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #6B3A2A, #C9922A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700,
          }}>IR</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>Irma W.</div>
              <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)" }}>Administrator</div>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? "220px" : "56px",
        transition: "margin-left 0.3s ease",
        display: "flex", flexDirection: "column", minHeight: "100vh",
      }}>

        {/* TOPBAR */}
        <header style={{
          height: "56px", background: "rgba(15,10,5,0.97)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid #2A1A0A", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 24px",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.1rem", padding: "4px", lineHeight: 1 }}
            >☰</button>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                {activeNav === "dashboard" ? "Dashboard Overview" : navItems.find((n) => n.id === activeNav)?.label}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.2)" }}>
                Senin, 9 Mar 2026
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", color: "rgba(255,255,255,0.25)" }}>
              {currentTime}
            </span>

            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowNotif(!showNotif); }}
                style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid #2A1A0A",
                  color: "rgba(255,255,255,0.55)", cursor: "pointer",
                  width: "34px", height: "34px", borderRadius: "4px", fontSize: "0.95rem",
                  position: "relative", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: "-5px", right: "-5px",
                    background: "#DC5050", color: "white", fontSize: "0.58rem",
                    fontWeight: 700, width: "16px", height: "16px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{unreadCount}</span>
                )}
              </button>

              {showNotif && (
                <div className="notif-panel">
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #2A1A0A", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#1A0F05" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Notifikasi</span>
                    <button style={{ background: "none", border: "none", fontSize: "0.7rem", color: "#C9922A", cursor: "pointer" }}>Baca semua</button>
                  </div>
                  {notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: n.unread ? "rgba(201,146,42,0.04)" : "transparent",
                      display: "flex", gap: "10px", alignItems: "flex-start",
                    }}>
                      <span style={{ fontSize: "0.9rem", marginTop: "2px" }}>{notifIcon[n.type]}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.78rem", color: n.unread ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{n.message}</p>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", marginTop: "3px" }}>{n.time}</p>
                      </div>
                      {n.unread && <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#C9922A", marginTop: "6px", flexShrink: 0 }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }} onClick={() => setShowNotif(false)}>

          {/* STAT CARDS */}
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
            {statCards.map((card, i) => (
              <div key={card.label} className="stat-card card-anim" style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: card.accent }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <span style={{ fontSize: "1.4rem" }}>{card.icon}</span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", fontWeight: 600,
                    color: card.positive ? "#4CAF82" : "#DC5050",
                    background: card.positive ? "rgba(76,175,130,0.1)" : "rgba(220,80,80,0.1)",
                    padding: "2px 7px", borderRadius: "2px",
                  }}>
                    {card.positive ? "▲" : "▼"} {card.change}
                  </span>
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.9rem", fontWeight: 700, color: card.accent, lineHeight: 1, marginBottom: "5px" }}>
                  {card.value}
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* CHART + SIDEBAR PANELS */}
          <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "14px", marginBottom: "14px" }}>

            {/* Weekly Chart */}
            <div style={{ background: "#1A0F05", border: "1px solid #2A1A0A", padding: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
                    Aktivitas Minggu Ini
                  </h3>
                  <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>3 – 9 Maret 2026</p>
                </div>
                <div style={{ display: "flex", gap: "14px" }}>
                  {[{ color: "#C9922A", label: "Revenue" }, { color: "#7B9FD4", label: "Booking" }].map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <div style={{ width: "7px", height: "7px", background: l.color, borderRadius: "1px" }} />
                      <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <WeeklyChart data={weeklyChart} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginTop: "18px", paddingTop: "18px", borderTop: "1px solid #2A1A0A" }}>
                {summaryItems.map((s) => (
                  <div key={s.label}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.95rem", fontWeight: 500, color: "#C9922A" }}>{s.value}</div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panels */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Today's Schedule */}
              <div style={{ background: "#1A0F05", border: "1px solid #2A1A0A", padding: "18px" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "14px" }}>
                  Jadwal Hari Ini
                </h3>
                {todaySchedule.map((s, i) => (
                  <div key={i} style={{
                    display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px",
                    padding: "7px 8px",
                    background: s.status === "ongoing" ? "rgba(76,175,130,0.06)" : "transparent",
                    border: s.status === "ongoing" ? "1px solid rgba(76,175,130,0.12)" : "1px solid transparent",
                    borderRadius: "2px",
                  }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.67rem", color: s.status === "ongoing" ? "#4CAF82" : "rgba(255,255,255,0.25)", minWidth: "38px" }}>
                      {s.time}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>{s.name}</div>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>{s.service}</div>
                    </div>
                    {s.status === "ongoing" && (
                      <span style={{ fontSize: "0.58rem", background: "rgba(76,175,130,0.15)", color: "#4CAF82", padding: "1px 5px", borderRadius: "2px" }}>LIVE</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Top Services */}
              <div style={{ background: "#1A0F05", border: "1px solid #2A1A0A", padding: "18px", flex: 1 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "14px" }}>
                  Top Layanan
                </h3>
                {serviceBreakdown.map((s) => (
                  <div key={s.name} style={{ marginBottom: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>{s.name}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.67rem", color: "rgba(255,255,255,0.25)" }}>{s.count}x</span>
                    </div>
                    <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.pct}%`, background: "linear-gradient(to right, #C9922A, rgba(201,146,42,0.35))", borderRadius: "2px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOOKING TABLE */}
          <div style={{ background: "#1A0F05", border: "1px solid #2A1A0A", marginBottom: "14px" }}>
            <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #2A1A0A", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: "10px" }}>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
                  Booking Terbaru
                </h3>
                <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>
                  {filteredBookings.length} dari {recentBookings.length} data
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                {filterOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`filter-btn${bookingFilter === key ? " active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); setBookingFilter(key); }}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Header row */}
            <div className="table-row" style={{
              gridTemplateColumns: "76px 1fr 130px 72px 72px 96px 96px 88px",
              color: "rgba(255,255,255,0.22)", fontSize: "0.65rem",
              letterSpacing: "0.1em", textTransform: "uppercase" as const,
              fontFamily: "'DM Mono', monospace",
            }}>
              <span>ID</span><span>Pelanggan</span><span>Layanan</span>
              <span>Tgl</span><span>Jam</span><span>Status</span>
              <span>Bayar</span><span>Total</span>
            </div>

            {filteredBookings.map((booking) => {
              const bs = getBookingStatusStyle(booking.status);
              const ps = getPaymentStyle(booking.payment);
              return (
                <div key={booking.id} className="table-row" style={{ gridTemplateColumns: "76px 1fr 130px 72px 72px 96px 96px 88px" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>{booking.id}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "rgba(255,255,255,0.72)" }}>{booking.customer}</span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{booking.service}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>{booking.date}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>{booking.time}</span>
                  <Badge label={bs.label} bg={bs.bg} color={bs.color} />
                  <Badge label={ps.label} bg={ps.bg} color={ps.color} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#C9922A", fontWeight: 500 }}>
                    {formatRupiah(booking.amount)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* RENTAL TABLE */}
          <div style={{ background: "#1A0F05", border: "1px solid #2A1A0A" }}>
            <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #2A1A0A" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
                Sewa Baju Aktif
              </h3>
              <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>Transaksi persewaan terkini</p>
            </div>

            <div className="table-row" style={{
              gridTemplateColumns: "76px 1fr 1fr 72px 80px 106px 88px",
              color: "rgba(255,255,255,0.22)", fontSize: "0.65rem",
              letterSpacing: "0.1em", textTransform: "uppercase" as const,
              fontFamily: "'DM Mono', monospace",
            }}>
              <span>ID</span><span>Pelanggan</span><span>Item</span>
              <span>Mulai</span><span>Kembali</span><span>Status</span><span>Total</span>
            </div>

            {recentRentals.map((r) => {
              const rs = getRentalStyle(r.status);
              return (
                <div key={r.id} className="table-row" style={{ gridTemplateColumns: "76px 1fr 1fr 72px 80px 106px 88px" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>{r.id}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "rgba(255,255,255,0.72)" }}>{r.customer}</span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{r.item}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>{r.rentDate}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: r.status === "terlambat" ? "#DC5050" : "rgba(255,255,255,0.3)" }}>
                    {r.returnDate}
                  </span>
                  <Badge label={r.status} bg={rs.bg} color={rs.color} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#C9922A", fontWeight: 500 }}>
                    {formatRupiah(r.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </main>

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid #2A1A0A", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.18)" }}>
            Salon Rumah Cantik Irma — Admin v1.0
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.18)" }}>
            Tugas Akhir · Telkom University Surabaya · 2026
          </span>
        </footer>
      </div>
    </div>
  );
}
