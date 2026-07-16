// types/index.ts

// ── Public / Homepage ──

export interface Service {
  id: number;
  name: string;
  desc: string;
  price: string;
  image: string;
  duration: string;
  isNew?: boolean;
}

export interface Testimonial {
  name: string;
  text: string;
  rating: number;
  avatar: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface FooterColumn {
  title: string;
  items: NavLink[];
}

// ── Auth ──

export type UserRole = "admin" | "customer";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';
  emailVerified: boolean;
  phone_number?: string;
  image?: string;
  gender?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Admin / Dashboard ──

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
export type PaymentStatus = "paid" | "pending" | "refunded";
export type RentalStatus  = "dipinjam" | "dikembalikan" | "terlambat";
export type NotifType     = "booking" | "payment" | "review" | "return";
export type NavItem       = "dashboard" | "bookings" | "rentals" | "customers" | "payments" | "settings" | "services-catalogue" | "clothes-catalogue";

export interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  accent: string;
}

export interface Booking {
  id: string;
  customer: string;
  service: string;
  date: string;
  time: string;
  status: BookingStatus;
  payment: PaymentStatus;
  amount: number;
}

export interface Rental {
  id: string;
  customer: string;
  item: string;
  rentDate: string;
  returnDate: string;
  status: RentalStatus;
  amount: number;
}

export interface ChartBar {
  day: string;
  bookings: number;
  revenue: number;
}

export interface Notification {
  id: number;
  message: string;
  time: string;
  type: NotifType;
  unread: boolean;
}

export interface NavItemConfig {
  icon: string;
  label: string;
  id: NavItem;
  badge?: number;
}

export interface ScheduleItem {
  time: string;
  name: string;
  service: string;
  status: "upcoming" | "ongoing";
}

export interface ServiceBreakdown {
  name: string;
  pct: number;
  count: number;
}

export interface NavLink {
    label: string;
    href: string;
}

export interface VtoStatus {
  usage: number;
  limit: number;
  base_limit?: number;
  bonus_limit?: number;
  completed_rentals?: number;
  days_inactive?: number;
  is_bonus_expired?: boolean;
  bonus_expiry_days?: number;
  remaining: number;
  next_reset: string;
  can_use: boolean;
}