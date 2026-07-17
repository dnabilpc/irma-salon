// app/admin/rentals/page.tsx
import type { Metadata } from "next";
import AdminRentalsClient from "./AdminRentalsClient";

export const metadata: Metadata = {
  title: "Manajemen Sewa Baju",
};

export default function RentalsPage() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  return <AdminRentalsClient backendUrl={backendUrl} />;
}