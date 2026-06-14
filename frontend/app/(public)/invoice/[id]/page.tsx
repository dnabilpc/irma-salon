"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PaymentProofUpload from "@/components/payment/PaymentProofUpload";

interface Transaction {
  id: number;
  total_amount: number;
  subtotal: number;
  payment_method: string;
  created_at: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  payment_proof_sent?: boolean;
  booking_datetime?: string;
  start_date?: string;
  duration_days?: number;
  outfit_name?: string;
}

interface Item {
  name: string;
  price: number;
}

export default function InvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<{ transaction: Transaction; items: Item[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/invoice/${id}`)
      .then((res) => {
        if (res.status === 401) {
          router.push(`/login?callbackUrl=/invoice/${id}`);
          return null;
        }
        if (!res.ok) {
          return res.json().then((d) => {
            throw new Error(d.error ?? "Gagal memuat invoice.");
          });
        }
        return res.json();
      })
      .then((d) => {
        if (d) {
          setData(d);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#8B6A5A" }}>
        Memuat invoice...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#C05060", gap: "10px" }}>
        <span>⚠️ {error || "Invoice tidak dapat ditampilkan."}</span>
        <button onClick={() => router.push("/dashboard")} style={{ padding: "8px 16px", background: "#6B3A2A", border: "none", color: "white", borderRadius: "6px", cursor: "pointer" }}>Kembali ke Dashboard</button>
      </div>
    );
  }

  const { transaction, items } = data;
  const isLunas = transaction.status === "lunas";

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div
      style={{
        background: "#FAF6F4",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Action panel above invoice */}
      <div
        className="no-print"
        style={{
          width: "100%",
          maxWidth: "540px",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "none",
            border: "1px solid #EDD8CC",
            color: "#6B3A2A",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.82rem",
            fontWeight: 500,
          }}
        >
          ← Dashboard
        </button>
        <button
          onClick={() => window.print()}
          style={{
            background: "#6B3A2A",
            border: "none",
            color: "white",
            padding: "8px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.82rem",
            fontWeight: 600,
            boxShadow: "0 4px 10px rgba(107, 58, 42, 0.15)",
          }}
        >
          🖨️ Cetak Invoice
        </button>
      </div>

      {/* Invoice Card */}
      <div
        style={{
          background: "white",
          border: "1px solid #EDD8CC",
          borderRadius: "12px",
          padding: "40px",
          width: "100%",
          maxWidth: "540px",
          boxShadow: "0 8px 30px rgba(107, 58, 42, 0.06)",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Lunas Stamp */}
        {isLunas ? (
          <div
            style={{
              position: "absolute",
              top: "35px",
              right: "35px",
              border: "3px solid #1A7A4A",
              color: "#1A7A4A",
              padding: "6px 14px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              textTransform: "uppercase",
              borderRadius: "8px",
              transform: "rotate(-10deg)",
              background: "rgba(26, 122, 74, 0.05)",
            }}
          >
            LUNAS
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              top: "35px",
              right: "35px",
              border: "3px solid #C9922A",
              color: "#C9922A",
              padding: "6px 14px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              textTransform: "uppercase",
              borderRadius: "8px",
              transform: "rotate(-10deg)",
              background: "rgba(201, 146, 42, 0.05)",
            }}
          >
            PENDING
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.6rem", fontWeight: "bold", color: "#6B3A2A", marginBottom: "4px" }}>
            Rumah Cantik Irma
          </div>
          <div style={{ fontSize: "0.72rem", letterSpacing: "0.2em", color: "#C9922A", textTransform: "uppercase", marginBottom: "15px" }}>
            Wedding Salon & Sewa Baju
          </div>
          <div style={{ fontSize: "0.8rem", color: "#8B6A5A", lineHeight: 1.5 }}>
            Graha Suko Indah B-1, Sukodono, Sidoarjo<br />
            WhatsApp: 085174481660 | Email: info@salonirma.com
          </div>
        </div>

        <div style={{ height: "1px", background: "#EDD8CC", margin: "20px 0" }} />

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "0.82rem", marginBottom: "25px" }}>
          <div>
            <div style={{ color: "#8B6A5A", marginBottom: "3px" }}>NO. INVOICE</div>
            <div style={{ fontWeight: 500, color: "#2C1A0E", fontFamily: "'DM Mono', monospace" }}>INV/2026/{transaction.id}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#8B6A5A", marginBottom: "3px" }}>TANGGAL</div>
            <div style={{ fontWeight: 500, color: "#2C1A0E" }}>{formatDate(transaction.created_at)}</div>
          </div>
          <div>
            <div style={{ color: "#8B6A5A", marginBottom: "3px" }}>PELANGGAN</div>
            <div style={{ fontWeight: 500, color: "#2C1A0E" }}>{transaction.customer_name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#8B6A5A", marginBottom: "3px" }}>METODE BAYAR</div>
            <div style={{ fontWeight: 500, color: "#2C1A0E" }}>{transaction.payment_method === "qris" ? "QRIS Statis" : "Bayar Di Tempat (Cash)"}</div>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "0.85rem" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 0", borderBottom: "2px solid #EDD8CC", color: "#8B6A5A", fontWeight: 600 }}>Deskripsi Layanan / Item</th>
              <th style={{ textAlign: "right", padding: "8px 0", borderBottom: "2px solid #EDD8CC", color: "#8B6A5A", fontWeight: 600 }}>Harga</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: "12px 0", borderBottom: "1px solid #FAF0E6", color: "#2C1A0E" }}>{item.name}</td>
                <td style={{ padding: "12px 0", borderBottom: "1px solid #FAF0E6", textAlign: "right", color: "#2C1A0E", fontFamily: "'DM Mono', monospace" }}>{formatRupiah(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Summary */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", fontSize: "0.85rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "220px" }}>
            <span style={{ color: "#8B6A5A" }}>Subtotal:</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>{formatRupiah(transaction.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "220px", fontWeight: 700, color: "#6B3A2A", fontSize: "1.05rem", marginTop: "5px", borderTop: "1px solid #EDD8CC", paddingTop: "8px" }}>
            <span>Total Lunas:</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>{formatRupiah(transaction.total_amount)}</span>
          </div>
        </div>

        {/* Payment Proof Upload for QRIS pending */}
        {transaction.payment_method === "qris" && !isLunas && (
          <div className="no-print">
            <PaymentProofUpload 
              transactionId={transaction.id} 
              initialProofSent={transaction.payment_proof_sent} 
            />
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: "0.78rem", color: "#B09080", marginTop: "40px" }}>
          Terima kasih atas kunjungan Anda di Rumah Cantik Irma! ✨
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          div[style*="max-width: 540px"] {
            border: none !important;
            box-shadow: none !important;
            padding: 20px !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
