// app/layout.tsx
// Root layout — dibungkus semua halaman di seluruh aplikasi
// Hanya berisi metadata global dan tag <html> + <body>
// Styling per-section ditangani oleh masing-masing layout:
//   app/(public)/layout.tsx  → PUBLIC_STYLES
//   app/(auth)/layout.tsx    → PUBLIC_STYLES
//   app/admin/layout.tsx     → ADMIN_STYLES

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Salon Rumah Cantik Irma",
    template: "%s | Salon Rumah Cantik Irma",
  },
  description:
    "Salon kecantikan & persewaan baju dengan Virtual Try-On berbasis AI. Booking online mudah & cepat. Berlokasi di Sukodono, Sidoarjo.",
  keywords: [
    "salon",
    "kecantikan",
    "sewa baju",
    "virtual try-on",
    "booking online",
    "Sidoarjo",
    "Sukodono",
  ],
  authors: [{ name: "Diandra Nabil Putra Cahyono" }],
  openGraph: {
    title: "Salon Rumah Cantik Irma",
    description: "Salon kecantikan & persewaan baju dengan Virtual Try-On berbasis AI.",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}