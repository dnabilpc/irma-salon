"use client";

import { useState } from "react";

interface PaymentProofUploadProps {
  bookingId?: number;
  rentalId?: number;
  transactionId?: number;
  initialProofSent?: boolean;
  onSuccess?: () => void;
}

export default function PaymentProofUpload({
  bookingId,
  rentalId,
  transactionId,
  initialProofSent = false,
  onSuccess,
}: PaymentProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(initialProofSent);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // Limit to image files
      if (!selectedFile.type.startsWith("image/")) {
        setError("Format file harus berupa gambar (JPG, PNG, dll).");
        setFile(null);
        return;
      }
      // Limit to 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Ukuran file maksimal adalah 5MB.");
        setFile(null);
        return;
      }
      setError("");
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Silakan pilih file screenshot bukti transfer terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("screenshot", file);
      if (bookingId) formData.append("bookingId", String(bookingId));
      if (rentalId) formData.append("rentalId", String(rentalId));
      if (transactionId) formData.append("transactionId", String(transactionId));

      const res = await fetch("/api/payments/upload-proof", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah bukti pembayaran.");
      }

      setSuccess(true);
      setFile(null);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat mengunggah bukti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "rgba(253, 248, 245, 0.6)",
        border: "1px solid #EDD8CC",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "16px",
        marginBottom: "16px",
        textAlign: "center",
        boxSizing: "border-box",
        width: "100%",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <h3
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1rem",
          fontWeight: 700,
          color: "#6B3A2A",
          margin: "0 0 8px 0",
        }}
      >
        Kirim Bukti Transfer QRIS
      </h3>

      {success ? (
        <div style={{ color: "#1A7A4A", fontSize: "0.85rem", padding: "10px 0" }}>
          <span style={{ fontSize: "1.5rem", display: "block", marginBottom: "6px" }}>✓</span>
          <strong>Bukti Pembayaran Terkirim!</strong>
          <p style={{ margin: "4px 0 0", color: "#8B6A5A", fontSize: "0.8rem", lineHeight: 1.5 }}>
            WhatsApp bukti transfer telah dikirimkan ke Admin. Admin sedang memverifikasi pembayaran Anda di sistem.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <p style={{ fontSize: "0.78rem", color: "#8B6A5A", margin: 0, lineHeight: 1.5 }}>
            Unggah screenshot bukti pembayaran QRIS Anda untuk mempercepat verifikasi oleh Admin.
          </p>

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "white",
              border: "1px dashed #C9922A",
              color: "#C9922A",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
              width: "100%",
              maxWidth: "240px",
              transition: "all 0.2s",
              boxSizing: "border-box",
            }}
          >
            📁 {file ? file.name : "Pilih Bukti Transfer"}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>

          {file && (
            <div style={{ fontSize: "0.75rem", color: "#2C1A0E" }}>
              Ukuran: {(file.size / 1024).toFixed(1)} KB
            </div>
          )}

          {error && (
            <div style={{ color: "#D94060", fontSize: "0.75rem", fontWeight: 500, margin: 0 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            style={{
              background: loading || !file ? "#EDD8CC" : "linear-gradient(135deg, #8B503A, #6B3A2A)",
              color: loading || !file ? "#A08070" : "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: loading || !file ? "not-allowed" : "pointer",
              width: "100%",
              maxWidth: "240px",
              transition: "all 0.2s",
              boxShadow: loading || !file ? "none" : "0 4px 12px rgba(107, 58, 42, 0.15)",
            }}
          >
            {loading ? "Mengirim Bukti..." : "Kirim Bukti Pembayaran"}
          </button>
        </div>
      )}
    </div>
  );
}
