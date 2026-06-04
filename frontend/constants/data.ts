// constants/data.ts
// Semua static & mock data untuk seluruh project
//
// CATATAN: Data di file ini adalah MOCK DATA untuk development & demo UI.
// Saat integrasi dengan database, data ini akan digantikan oleh API calls
// ke PostgreSQL melalui Better Auth dan server actions/API routes.
//
// Diimport dengan: import { NAMA_KONSTANTA } from "@/constants/data"

import type {
  Service,
  Testimonial,
  Stat,
  FooterColumn,
  StatCard,
  Booking,
  Rental,
  ChartBar,
  Notification,
  ScheduleItem,
  ServiceBreakdown,
  NavLink,
} from "@/types";

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC / HOMEPAGE
// ═══════════════════════════════════════════════════════════════════════════

// Dipakai di: ServicesSection → ServiceCard
export const SERVICES: Service[] = [
  {
    id: 1,
    name: "Hair Treatment",
    desc: "Perawatan rambut profesional dengan produk premium pilihan",
    price: "Mulai Rp 85.000",
    image: "https://hyninbeauty.id/wp-content/uploads/2023/10/8.-8-Manfaat-Hair-Treatment-di-Salon-Wajib-Kamu-Ketahui-1.jpg",
    duration: "60 menit",
  },
  {
    id: 2,
    name: "Makeup & Rias",
    desc: "Rias wajah untuk berbagai acara spesial kamu",
    price: "Mulai Rp 150.000",
    image: "https://cnfstore.com/pub/media/mageplaza/blog/post/m/a/makeup_flawless.jpg",
    duration: "90 menit",
  },
  {
    id: 3,
    name: "Rebonding",
    desc: "Perawatan rambut dengan teknologi terkini",
    price: "Mulai Rp 100.000",
    image: "https://img.freepik.com/free-photo/young-woman-getting-her-hair-curled-by-stylist-parlor-beautiful-young-hairdresser-giving-new-haircut-female-saloon_231208-10920.jpg?semt=ais_rp_50_assets&w=740&q=80",
    duration: "90 menit",
  },
  {
    id: 4,
    name: "Facial & Skincare",
    desc: "Perawatan kulit wajah dengan teknologi terkini",
    price: "Mulai Rp 120.000",
    image: "https://florida-academy.edu/wp-content/uploads/2021/08/types-of-facial-florida-academy-2048x1365.jpg",
    duration: "75 menit",
  },
  {
    id: 5,
    name: "Persewaan Baju",
    desc: "Koleksi baju pesta & adat pilihan tersedia lengkap",
    price: "Mulai Rp 200.000",
    image: "https://akcdn.detik.net.id/api/wm/2020/11/06/nggak-perlu-beli-ini-rekomendasi-rental-baju-online-untuk-berbagai-acara-yang-terjamin-kebersihannya_169.jpeg?w=650",
    duration: "Per hari",
  },
  {
    id: 6,
    name: "Virtual Try-On",
    desc: "Coba baju secara virtual sebelum menyewa via AR",
    price: "Gratis",
    image: "https://imageio.forbes.com/specials-images/imageserve/60a53427c26131a1df84b6ef/snapchat-ar/0x0.png?width=960&dpr=1.5",
    duration: "Instant",
    isNew: true,
  },
];

// Dipakai di: TestimonialSection
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Siti Rahayu",
    text: "Pelayanannya memuaskan banget! Virtual Try-On-nya bikin saya bisa pilih baju tanpa harus datang dulu 😍",
    rating: 5,
    avatar: "SR",
  },
  {
    name: "Dewi Kusuma",
    text: "Booking online sangat mudah dan cepat. Hasil riasnya juga cantik banget untuk pernikahan saya.",
    rating: 5,
    avatar: "DK",
  },
  {
    name: "Rina Aprilia",
    text: "Harga terjangkau, kualitas premium. Sudah langganan di sini sudah 2 tahun!",
    rating: 5,
    avatar: "RA",
  },
];

// Dipakai di: HeroSection
export const HERO_STATS: Stat[] = [
  { value: "500+", label: "Pelanggan Puas" },
  { value: "50+",  label: "Koleksi Baju"  },
  { value: "5★",   label: "Rating Google" },
];

// Dipakai di: Footer
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Layanan",
    items: [
      { label: "Hair Treatment", href: "/booking" },
      { label: "Makeup & Rias", href: "/booking" },
      { label: "Nail Care", href: "/booking" },
      { label: "Facial & Skincare", href: "/booking" },
    ],
  },
  {
    title: "Sewa Baju",
    items: [
      { label: "Katalog Koleksi", href: "/rent" },
      { label: "Virtual Try-On", href: "/virtual-try-on" },
      { label: "Cara Sewa", href: "/rent#cara-sewa" },
      { label: "Kebijakan Sewa", href: "/#kebijakan-sewa" },
    ],
  },
  {
    title: "Informasi",
    items: [
      { label: "Tentang Kami", href: "/#tentang" },
      { label: "Blog Kecantikan", href: "/#" },
      { label: "Syarat & Ketentuan", href: "/#" },
      { label: "Hubungi Kami", href: "https://wa.me/6285174481660" },
    ],
  },
];

// Dipakai di Navbar
export const NAV_ITEMS: NavLink[] = [
  {label: "Beranda", href: "/#beranda"},
  {label: "Layanan", href: "/#layanan"},
  {label: "Virtual Try-On", href: "/#virtual-try-on"},
  {label: "Tentang", href: "/#tentang"},
];

// Dipakai di: VirtualTryOnSection — outfit selector AR mockup
export const AR_OUTFITS: string[] = ["👗", "👘", "🥻", "👙"];

// Dipakai di: VirtualTryOnSection — daftar fitur VTO
export const VTO_FEATURES: string[] = [
  "Coba puluhan koleksi baju dalam hitungan menit",
  "Teknologi AI berjalan langsung di browser, tanpa install app",
  "Tampilan realistis dengan body tracking akurat",
];

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN / DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

// Dipakai di: StatCardGrid
export const STAT_CARDS: StatCard[] = [
  {
    label: "Total Booking Bulan Ini",
    value: "128",
    change: "+12%",
    positive: true,
    icon: "📅",
    accent: "#C9922A",
  },
  {
    label: "Pendapatan Bulan Ini",
    value: "Rp 14.2jt",
    change: "+8.4%",
    positive: true,
    icon: "💰",
    accent: "#4CAF82",
  },
  {
    label: "Sewa Baju Aktif",
    value: "23",
    change: "+3",
    positive: true,
    icon: "👗",
    accent: "#E8A89C",
  },
  {
    label: "Pelanggan Baru",
    value: "41",
    change: "-2%",
    positive: false,
    icon: "👤",
    accent: "#7B9FD4",
  },
];

// Dipakai di: WeeklyChart
export const WEEKLY_CHART: ChartBar[] = [
  { day: "Sen", bookings: 8,  revenue: 920000  },
  { day: "Sel", bookings: 12, revenue: 1380000 },
  { day: "Rab", bookings: 7,  revenue: 840000  },
  { day: "Kam", bookings: 15, revenue: 1750000 },
  { day: "Jum", bookings: 18, revenue: 2100000 },
  { day: "Sab", bookings: 24, revenue: 2880000 },
  { day: "Min", bookings: 20, revenue: 2400000 },
];

// Dipakai di: BookingTable
export const RECENT_BOOKINGS: Booking[] = [
  { id: "BK-001", customer: "Siti Rahayu",   service: "Hair Treatment", date: "09 Mar", time: "10:00", status: "confirmed", payment: "paid",     amount: 150000 },
  { id: "BK-002", customer: "Dewi Kusuma",   service: "Makeup & Rias",  date: "09 Mar", time: "13:00", status: "pending",   payment: "pending",  amount: 250000 },
  { id: "BK-003", customer: "Rina Aprilia",  service: "Nail Care",      date: "09 Mar", time: "14:30", status: "confirmed", payment: "paid",     amount: 80000  },
  { id: "BK-004", customer: "Mega Putri",    service: "Facial",         date: "09 Mar", time: "16:00", status: "cancelled", payment: "refunded", amount: 120000 },
  { id: "BK-005", customer: "Layla Hanum",   service: "Hair Treatment", date: "10 Mar", time: "09:00", status: "pending",   payment: "pending",  amount: 150000 },
  { id: "BK-006", customer: "Nurul Fadilah", service: "Makeup & Rias",  date: "10 Mar", time: "11:00", status: "confirmed", payment: "paid",     amount: 300000 },
];

// Dipakai di: RentalTable
export const RECENT_RENTALS: Rental[] = [
  { id: "SW-021", customer: "Aisyah Putri",    item: "Kebaya Merah Pengantin", rentDate: "08 Mar", returnDate: "10 Mar", status: "dipinjam",     amount: 350000 },
  { id: "SW-022", customer: "Fitri Handayani", item: "Gaun Pesta Hijau",       rentDate: "07 Mar", returnDate: "09 Mar", status: "dikembalikan", amount: 200000 },
  { id: "SW-023", customer: "Yuni Kartika",    item: "Kebaya Biru Modern",     rentDate: "06 Mar", returnDate: "08 Mar", status: "terlambat",    amount: 250000 },
  { id: "SW-024", customer: "Risa Amalia",     item: "Dress Batik Premium",    rentDate: "09 Mar", returnDate: "11 Mar", status: "dipinjam",     amount: 180000 },
];

// Dipakai di: NotifPanel
export const NOTIFICATIONS: Notification[] = [
  { id: 1, message: "Booking baru dari Dewi Kusuma – Makeup & Rias",    time: "5 menit lalu",  type: "booking", unread: true  },
  { id: 2, message: "Pembayaran Rp 300.000 dari Nurul Fadilah berhasil", time: "23 menit lalu", type: "payment", unread: true  },
  { id: 3, message: "SW-023 terlambat dikembalikan oleh Yuni Kartika",   time: "1 jam lalu",    type: "return",  unread: true  },
  { id: 4, message: "Review bintang 5 dari Siti Rahayu",                 time: "2 jam lalu",    type: "review",  unread: false },
  { id: 5, message: "Booking baru dari Layla Hanum – Hair Treatment",    time: "3 jam lalu",    type: "booking", unread: false },
];

// Dipakai di: TodaySchedule
export const TODAY_SCHEDULE: ScheduleItem[] = [
  { time: "09:00", name: "Layla Hanum",  service: "Hair Treatment", status: "upcoming" },
  { time: "10:00", name: "Siti Rahayu",  service: "Hair Treatment", status: "ongoing"  },
  { time: "13:00", name: "Dewi Kusuma",  service: "Makeup & Rias",  status: "upcoming" },
  { time: "14:30", name: "Rina Aprilia", service: "Nail Care",      status: "upcoming" },
];

// Dipakai di: TopServices
export const SERVICE_BREAKDOWN: ServiceBreakdown[] = [
  { name: "Makeup & Rias",  pct: 82, count: 42 },
  { name: "Hair Treatment", pct: 68, count: 35 },
  { name: "Persewaan Baju", pct: 55, count: 28 },
  { name: "Facial",         pct: 40, count: 21 },
];