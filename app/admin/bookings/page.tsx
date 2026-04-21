// app/admin/bookings/page.tsx
import type { Metadata } from "next";
import AdminBookingsClient from "./AdminBookingsClient";

export const metadata: Metadata = {
  title: "Manajemen Booking",
};

export default function BookingsPage() {
  return <AdminBookingsClient />;
}