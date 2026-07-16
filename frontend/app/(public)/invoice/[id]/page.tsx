"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PaymentProofUpload from "@/components/payment/PaymentProofUpload";
import QRCode from "qrcode";
import { generateDynamicQrisPayload, parseQrisPayloadInfo } from "@/lib/qris";

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
  const [qrisPayloadDataUrl, setQrisPayloadDataUrl] = useState<string>("");
  const [qrisMerchantName, setQrisMerchantName] = useState<string>("Irma Wedding Salon");
  const [qrisNmid, setQrisNmid] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/invoice/${id}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.push(`/login?callbackUrl=/invoice/${id}`);
          return null;
        }

        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        if (!res.ok) {
          const errorMsg = isJson 
            ? (await res.json()).error 
            : `HTTP Error ${res.status}: ${res.statusText}`;
          throw new Error(errorMsg || "Gagal memuat invoice.");
        }

        if (!isJson) {
          throw new Error("Respon dari server tidak valid (bukan JSON).");
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

  // Fetch settings & Generate Dynamic QRIS
  useEffect(() => {
    if (!data || !data.transaction) return;

    fetch("/api/settings")
      .then((res) => res.json())
      .then((settings) => {
        const staticPayload = settings.qris_payload || "";
        const parsed = parseQrisPayloadInfo(staticPayload);
        if (parsed.merchantName) setQrisMerchantName(parsed.merchantName);
        if (parsed.nmid) setQrisNmid(parsed.nmid);

        const dynamicPayload = generateDynamicQrisPayload(staticPayload, Number(data.transaction.total_amount));

        QRCode.toDataURL(dynamicPayload, {
          margin: 1,
          width: 300,
          color: { dark: "#2C1A0E", light: "#FFFFFF" },
        })
          .then((url) => setQrisPayloadDataUrl(url))
          .catch((err) => console.error("Error generating QRIS DataURL:", err));
      })
      .catch((err) => {
        console.error("Error fetching settings for QRIS:", err);
        const dynamicPayload = generateDynamicQrisPayload("", Number(data.transaction.total_amount));
        const parsed = parseQrisPayloadInfo("");
        if (parsed.merchantName) setQrisMerchantName(parsed.merchantName);
        if (parsed.nmid) setQrisNmid(parsed.nmid);

        QRCode.toDataURL(dynamicPayload, { margin: 1, width: 300 })
          .then((url) => setQrisPayloadDataUrl(url))
          .catch(() => {});
      });
  }, [data]);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [qrisImageError, setQrisImageError] = useState(false);

  useEffect(() => {
    if (!data || !data.transaction) return;
    const { transaction } = data;

    if (transaction.payment_method !== "qris" || transaction.status !== "pending" || transaction.payment_proof_sent) {
      return;
    }

    const calculateTimeLeft = () => {
      const createdAt = new Date(transaction.created_at).getTime();
      const expiresAt = createdAt + 15 * 60 * 1000;
      const diff = expiresAt - Date.now();
      return diff > 0 ? diff : 0;
    };

    // Use setTimeout(0) to avoid synchronous setState inside effect body
    const initTimeout = setTimeout(() => setTimeLeft(calculateTimeLeft()), 0);

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 1000);

    return () => {
      clearTimeout(initTimeout);
      clearInterval(timer);
    };
  }, [data]);

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

  const formatTimeLeft = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div
      className="invoice-wrapper"
      style={{
        background: "#FAF6F4",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "112px 20px 40px 20px",
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
          overflow: "hidden",
        }}
      >
        {/* Watermark for unpaid status */}
        {transaction.status === "pending" && (
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-30deg)",
              fontSize: "4.2rem",
              fontWeight: 800,
              color: "rgba(192, 80, 96, 0.09)",
              border: "6px double rgba(192, 80, 96, 0.09)",
              padding: "10px 24px",
              borderRadius: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              pointerEvents: "none",
              userSelect: "none",
              zIndex: 0,
              whiteSpace: "nowrap",
            }}
          >
            BELUM LUNAS
          </div>
        )}

        {/* Status Stamp */}
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
        ) : transaction.status === "gagal" || transaction.status === "cancelled" ? (
          <div
            style={{
              position: "absolute",
              top: "35px",
              right: "35px",
              border: "3px solid #C05060",
              color: "#C05060",
              padding: "6px 14px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              textTransform: "uppercase",
              borderRadius: "8px",
              transform: "rotate(-10deg)",
              background: "rgba(192, 80, 96, 0.05)",
            }}
          >
            BATAL
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
            Irma Wedding Salon
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

        {/* Countdown Timer Banner */}
        {transaction.payment_method === "qris" && transaction.status === "pending" && !transaction.payment_proof_sent && timeLeft !== null && (
          <div
            className="no-print"
            style={{
              background: timeLeft > 3 * 60 * 1000 ? "rgba(201, 146, 42, 0.08)" : "rgba(192, 80, 96, 0.08)",
              border: timeLeft > 3 * 60 * 1000 ? "1px solid rgba(201, 146, 42, 0.25)" : "1px solid rgba(192, 80, 96, 0.25)",
              borderRadius: "8px",
              padding: "12px 16px",
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.1rem" }}>{timeLeft > 3 * 60 * 1000 ? "⚠️" : "🚨"}</span>
              <div style={{ fontSize: "0.82rem", color: timeLeft > 3 * 60 * 1000 ? "#B57B18" : "#A63F4B", fontWeight: 500 }}>
                {timeLeft > 0 ? "Selesaikan pembayaran dalam:" : "Waktu pembayaran habis!"}
              </div>
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: timeLeft > 3 * 60 * 1000 ? "#C9922A" : "#C05060",
              }}
            >
              {timeLeft > 0 ? formatTimeLeft(timeLeft) : "00:00"}
            </div>
          </div>
        )}

        {/* Payment Proof Upload for QRIS pending */}
        {transaction.payment_method === "qris" && !isLunas && (
          <div className="no-print" style={{ marginTop: "20px" }}>
            {transaction.status === "gagal" || transaction.status === "cancelled" ? (
              <div
                style={{
                  background: "rgba(192, 80, 96, 0.08)",
                  border: "1px solid rgba(192, 80, 96, 0.2)",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "center",
                  color: "#C05060",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                ⚠️ Batas waktu pembayaran 15 menit telah habis. Booking ini telah dibatalkan secara otomatis oleh sistem. Silakan buat booking baru.
              </div>
            ) : (
              <>
                {/* QRIS Card */}
                <div 
                  style={{ 
                    background: "white", 
                    border: "2px solid #EDD8CC", 
                    borderRadius: "12px", 
                    padding: "16px", 
                    margin: "0 auto 20px", 
                    maxWidth: "280px",
                    boxShadow: "0 8px 24px rgba(107,58,42,0.08)",
                    textAlign: "center"
                  }}
                >
                  <div style={{ background: "#004b7b", color: "white", padding: "6px", borderRadius: "6px 6px 0 0", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em" }}>
                    QRIS
                  </div>
                  <div style={{ border: "1px solid #EDD8CC", borderTop: "none", padding: "16px 12px 12px", borderRadius: "0 0 6px 6px" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
                      {qrisMerchantName}
                    </div>
                    {qrisNmid && (
                      <div style={{ fontSize: "0.6rem", color: "#8B6A5A", marginBottom: "14px" }}>
                        NMID: {qrisNmid}
                      </div>
                    )}
                    {qrisPayloadDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={qrisPayloadDataUrl} 
                        alt="QRIS" 
                        style={{ width: "190px", height: "190px", objectFit: "contain", margin: "0 auto 10px", display: "block", borderRadius: "8px" }} 
                      />
                    ) : !qrisImageError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src="/qris.png" 
                        alt="QRIS" 
                        onError={() => setQrisImageError(true)}
                        style={{ width: "180px", height: "180px", objectFit: "contain", margin: "0 auto 12px", display: "block" }} 
                      />
                    ) : (
                      /* Mock QR Pattern in pure CSS */
                      <div style={{ 
                        width: "180px", 
                        height: "180px", 
                        background: "radial-gradient(circle, #2C1A0E 10%, transparent 11%), repeating-linear-gradient(45deg, #2C1A0E 0px, #2C1A0E 2px, transparent 2px, transparent 10px)", 
                        border: "6px solid #2C1A0E", 
                        borderRadius: "8px",
                        margin: "0 auto 12px", 
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <div style={{ position: "absolute", top: "2px", left: "2px", width: "36px", height: "36px", border: "8px solid #2C1A0E", background: "white", boxSizing: "border-box" }} />
                        <div style={{ position: "absolute", top: "2px", right: "2px", width: "36px", height: "36px", border: "8px solid #2C1A0E", background: "white", boxSizing: "border-box" }} />
                        <div style={{ position: "absolute", bottom: "2px", left: "2px", width: "36px", height: "36px", border: "8px solid #2C1A0E", background: "white", boxSizing: "border-box" }} />
                        <div style={{ background: "white", padding: "4px 8px", border: "2px solid #2C1A0E", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700, color: "#C9922A", zIndex: 5 }}>
                          IRMA
                        </div>
                      </div>
                    )}
                    <div style={{ background: "rgba(42,140,90,0.08)", border: "1px solid rgba(42,140,90,0.25)", color: "#1A7A4A", padding: "6px 10px", borderRadius: "8px", fontSize: "0.72rem", fontWeight: 600, margin: "0 auto 8px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span>Total: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(transaction.total_amount)}</span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#8B6A5A", fontWeight: 500 }}>
                      Scan dengan E-Wallet atau Mobile Banking (Nominal Terisi Otomatis)
                    </div>
                  </div>
                </div>

                <PaymentProofUpload 
                  transactionId={transaction.id} 
                  initialProofSent={transaction.payment_proof_sent} 
                  onSuccess={() => {
                    // Automatically reload the page after 2.5 seconds to refresh the state and remove the timer
                    setTimeout(() => {
                      window.location.reload();
                    }, 2500);
                  }}
                />
              </>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: "0.78rem", color: "#B09080", marginTop: "40px" }}>
          Terima kasih atas kunjungan Anda di Irma Wedding Salon! ✨
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .invoice-wrapper {
            padding: 0 !important;
          }
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
