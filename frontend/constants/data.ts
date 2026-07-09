// constants/data.ts
// Semua static & mock data untuk seluruh project
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
    desc: "Coba baju secara virtual sebelum menyewa via AI",
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
  }
];

// Dipakai di Navbar
export const NAV_ITEMS: NavLink[] = [
  {label: "Beranda", href: "/#beranda"},
  {label: "Layanan", href: "/#layanan"},
  {label: "Katalog Baju", href: "/#katalog"},
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