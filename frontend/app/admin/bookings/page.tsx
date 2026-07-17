// app/admin/bookings/page.tsx
import type { Metadata } from "next";
import AdminBookingsClient from "./AdminBookingsClient";

export const metadata: Metadata = {
  title: "Manajemen Booking",
};

export default function BookingsPage() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  return <AdminBookingsClient backendUrl={backendUrl} />;
}