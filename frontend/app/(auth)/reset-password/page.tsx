// frontend/app/(auth)/reset-password/page.tsx
"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordOTP } from "@/actions/authActions";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!phone) {
      setError("Nomor WhatsApp tidak terdeteksi. Silakan ajukan ulang reset password.");
      return;
    }
    if (otp.length !== 6 || isNaN(Number(otp))) {
      setError("Kode OTP harus terdiri dari 6 digit angka.");
      return;
    }
    if (password.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password baru dan konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    const res = await resetPasswordOTP(phone, otp, password);
    if (!res.success) {
      setError(res.error || "Gagal mereset password.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #EDD8CC",
    borderRadius: "2px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.9rem",
    color: "#2C1A0E",
    background: "#FDFAF7",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#6B3A2A",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    display: "block",
    marginBottom: "6px",
  };

  return (
    <div
      style={{
        background: "white",
        padding: "48px 40px",
        border: "1px solid #EDD8CC",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 20px 60px rgba(107,58,42,0.1)",
      }}
    >
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#6B3A2A",
            marginBottom: "4px",
          }}
        >
          Rumah Cantik Irma
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.72rem",
            letterSpacing: "0.18em",
            color: "#C9922A",
            textTransform: "uppercase",
          }}
        >
          Reset Password
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#EDD8CC" }} />
          <span style={{ color: "#C9922A", fontSize: "0.9rem" }}>✦</span>
          <div style={{ flex: 1, height: "1px", background: "#EDD8CC" }} />
        </div>
      </div>

      {success ? (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              background: "rgba(37,211,102,0.08)",
              border: "1px solid rgba(37,211,102,0.2)",
              color: "#25D366",
              padding: "16px",
              borderRadius: "4px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.85rem",
              marginBottom: "20px",
              lineHeight: "1.6",
            }}
          >
            <strong>Password Berhasil Direset! 🎉</strong>
            <br />
            Password Anda telah diperbarui. Halaman akan dialihkan ke halaman masuk dalam 3 detik.
          </div>
          <Link
            href="/login"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.85rem",
              color: "#6B3A2A",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Masuk Sekarang
          </Link>
        </div>
      ) : (
        <>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.82rem",
              color: "#8B6A5A",
              textAlign: "center",
              lineHeight: "1.5",
              marginBottom: "24px",
            }}
          >
            Masukkan kode OTP yang telah dikirim ke WhatsApp Anda dan tentukan password baru Anda.
          </p>

          {/* Error message */}
          {error && (
            <div
              style={{
                background: "rgba(220,80,80,0.08)",
                border: "1px solid rgba(220,80,80,0.2)",
                color: "#DC5050",
                padding: "12px 16px",
                fontSize: "0.82rem",
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: "20px",
                borderRadius: "2px",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Phone (Readonly) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="phone" style={labelStyle}>
                Nomor WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                required
                style={{ ...inputStyle, background: "#F5ECE5", color: "#6B4A3A", border: "1px solid #D5C2B5" }}
                readOnly={!!searchParams.get("phone")}
              />
            </div>

            {/* OTP Code */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="otp" style={labelStyle}>
                Kode OTP WhatsApp (6 Digit)
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.substring(0, 6))}
                placeholder="123456"
                required
                style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.5em", fontWeight: 700, fontSize: "1.1rem" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
              />
            </div>

            {/* New Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="password" style={labelStyle}>
                Password Baru
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
              />
            </div>

            {/* Confirm New Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="confirmPassword" style={labelStyle}>
                Ulangi Password Baru
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#B8896A" : "#6B3A2A",
                color: "white",
                border: "none",
                padding: "14px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                borderRadius: "2px",
                marginTop: "4px",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#C9922A";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#6B3A2A";
              }}
            >
              {loading ? "Memproses..." : "Reset Password"}
            </button>
          </form>
        </>
      )}

      {/* Back to Login */}
      <div style={{ textAlign: "center", marginTop: "24px" }}>
        <Link
          href="/login"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.78rem",
            color: "#8B6A5A",
            textDecoration: "none",
            transition: "color 0.2s",
            fontWeight: 600,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#6B3A2A")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8B6A5A")}
        >
          Kembali ke Halaman Masuk
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "50px" }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#8B6A5A" }}>Memuat halaman...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
