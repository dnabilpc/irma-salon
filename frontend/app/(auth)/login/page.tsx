"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient, signIn } from "@/lib/auth-client";
import { AppUser } from "@/types";
import { resolveLoginIdentifier, sendRegistrationOTP, verifyRegistrationOTP } from "@/actions/authActions";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", textAlign: "center" }}>Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredSuccess = searchParams.get("registered") === "success";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // OTP States
  const [showVerifyOption, setShowVerifyOption] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [step, setStep] = useState<"login" | "otp">("login");
  const [otpCode, setOtpCode] = useState<string>("");
  const [timer, setTimer] = useState<number>(0);
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Terjemahkan nomor telepon ke email jika diinput nomor HP
    const resolution = await resolveLoginIdentifier(email);
    if (!resolution.success || !resolution.email) {
      setError(resolution.error || "Email atau nomor WhatsApp tidak terdaftar.");
      setLoading(false);
      return;
    }

    const { error: authError } = await signIn.email({
      email: resolution.email,
      password,
    });

    if (authError) {
      setError("Email atau password salah. Silakan coba lagi.");
      setLoading(false);
      return;
    }

    // ambil session
    const result = await authClient.getSession();

    if (!result.data) {
      setError("Gagal mengambil session.");
      setLoading(false);
      return;
    }

    const user = result.data.user as unknown as AppUser;

    // Block pending / rejected accounts
    if (user.status === "PENDING") {
      await authClient.signOut();
      setError("Akun Anda belum diverifikasi. Silakan verifikasi nomor Anda via WhatsApp.");
      setPendingEmail(resolution.email);
      setShowVerifyOption(true);
      setLoading(false);
      return;
    }

    if (user.status === "REJECTED") {
      await authClient.signOut();
      setError("Pendaftaran akunmu ditolak. Silakan hubungi admin untuk informasi lebih lanjut.");
      setLoading(false);
      return;
    }

    if (user.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleTriggerVerify() {
    setError("");
    setLoading(true);
    const res = await sendRegistrationOTP(pendingEmail);
    setLoading(false);
    if (res.success) {
      setStep("otp");
      setTimer(60);
      setOtpCode("");
    } else {
      setError(res.error || "Gagal mengirimkan kode OTP.");
    }
  }

  async function handleVerifyOTP(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (otpCode.length !== 6) {
      setError("Kode OTP harus terdiri dari 6 digit angka.");
      return;
    }

    setLoading(true);
    const result = await verifyRegistrationOTP(pendingEmail, otpCode);

    if (!result.success) {
      setError(result.error || "Verifikasi gagal. Silakan coba lagi.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("login");
    setShowVerifyOption(false);
    alert("Akun Anda berhasil diverifikasi! Silakan login.");
  }

  async function handleResendOTP() {
    setError("");
    setResendLoading(true);
    const result = await sendRegistrationOTP(pendingEmail);
    setResendLoading(false);
    if (result.success) {
      setTimer(60);
      alert("Kode OTP baru telah berhasil dikirim ke nomor WhatsApp Anda.");
    } else {
      setError(result.error || "Gagal mengirim ulang OTP.");
    }
  }

  return (
    <div
      style={{
        background: "white",
        padding: "48px 40px",
        border: "1px solid #EDD8CC",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 20px 60px rgba(107,58,42,0.1)",
      }}>
      {/* Logo */}
      <div style={{ textAlign: "center" as const, marginBottom: "36px" }}>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#6B3A2A",
            marginBottom: "4px",
          }}>
          Rumah Cantik Irma
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.72rem",
            letterSpacing: "0.18em",
            color: "#C9922A",
            textTransform: "uppercase" as const,
          }}>
          Login Page
        </div>

        {/* Ornament divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "16px",
          }}>
          <div style={{ flex: 1, height: "1px", background: "#EDD8CC" }} />
          <span style={{ color: "#C9922A", fontSize: "0.9rem" }}>+</span>
          <div style={{ flex: 1, height: "1px", background: "#EDD8CC" }} />
        </div>
      </div>

      {/* Success Banner */}
      {registeredSuccess && !error && (
        <div
          style={{
            background: "rgba(26,122,74,0.08)",
            border: "1px solid rgba(26,122,74,0.2)",
            color: "#1A7A4A",
            padding: "12px 16px",
            fontSize: "0.82rem",
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: "20px",
            borderRadius: "2px",
          }}>
          Pendaftaran berhasil! Akun Anda telah dibuat. Silakan masuk menggunakan email dan password terdaftar.
        </div>
      )}

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
          }}>
          <div>{error}</div>
          {showVerifyOption && step === "login" && (
            <button
              type="button"
              onClick={handleTriggerVerify}
              disabled={loading}
              style={{
                background: "#C9922A",
                color: "white",
                border: "none",
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: 600,
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "8px",
                fontFamily: "'DM Sans', sans-serif",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#6B3A2A")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#C9922A")}
            >
              {loading ? "Mengirim OTP..." : "Verifikasi Sekarang"}
            </button>
          )}
        </div>
      )}

      {/* Conditionally Render Form or OTP */}
      {step === "otp" ? (
        <form
          onSubmit={handleVerifyOTP}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ background: "rgba(201,146,42,0.07)", border: "1px solid rgba(201,146,42,0.25)", borderRadius: "6px", padding: "10px 14px", marginBottom: "8px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>🔑</span>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#7A5A1A", margin: 0, lineHeight: 1.5 }}>
              Kode OTP telah dikirimkan ke WhatsApp Anda. Silakan masukkan kode tersebut di bawah ini.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#6B3A2A",
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
              }}>
              Kode OTP 6-Digit
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              required
              style={{
                padding: "12px 16px",
                border: "1px solid #EDD8CC",
                outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1.2rem",
                color: "#2C1A0E",
                background: "#FDFAF7",
                transition: "border-color 0.2s",
                borderRadius: "2px",
                textAlign: "center",
                letterSpacing: "0.3em",
                fontWeight: 700
              }}
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
              textTransform: "uppercase" as const,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              borderRadius: "2px",
              marginTop: "4px",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#C9922A"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#6B3A2A"; }}
          >
            {loading ? "Memverifikasi..." : "Verifikasi OTP"}
          </button>

          {/* Resend button */}
          <div style={{ textAlign: "center", marginTop: "12px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#8B6A5A" }}>
            Belum menerima kode?{" "}
            {timer > 0 ? (
              <span style={{ color: "#8B6A5A", fontWeight: 600 }}>
                Kirim ulang dalam {timer} detik
              </span>
            ) : (
              <button
                type="button"
                disabled={resendLoading}
                onClick={handleResendOTP}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6B3A2A",
                  fontWeight: 600,
                  cursor: resendLoading ? "not-allowed" : "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#C9922A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B3A2A")}
              >
                {resendLoading ? "Mengirim..." : "Kirim Ulang OTP"}
              </button>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => setStep("login")}
              style={{
                background: "none",
                border: "none",
                color: "#8B6A5A",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontFamily: "'DM Sans', sans-serif",
                padding: 0
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6B3A2A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8B6A5A")}
            >
              ← Kembali ke Login
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Email atau No HP */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="email"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#6B3A2A",
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
              }}>
              Email atau Nomor WhatsApp
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com atau 08xxxxxxxxxx"
              required
              style={{
                padding: "12px 16px",
                border: "1px solid #EDD8CC",
                outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9rem",
                color: "#2C1A0E",
                background: "#FDFAF7",
                transition: "border-color 0.2s",
                borderRadius: "2px",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label
                htmlFor="password"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "#6B3A2A",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                }}>
                Password
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.72rem",
                  color: "#8B6A5A",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#6B3A2A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8B6A5A")}>
                Lupa Password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                padding: "12px 16px",
                border: "1px solid #EDD8CC",
                outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9rem",
                color: "#2C1A0E",
                background: "#FDFAF7",
                transition: "border-color 0.2s",
                borderRadius: "2px",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
            />
          </div>

          {/* Submit button */}
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
              textTransform: "uppercase" as const,
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
            }}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      )}

      {/* Belum punya akun? */}
      {step === "login" && (
        <div style={{ textAlign: "center" as const, marginTop: "20px" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#8B6A5A" }}>
            Belum punya akun?{" "}
            <Link
              href="/register"
              style={{
                color: "#6B3A2A",
                fontWeight: 600,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C9922A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B3A2A")}>
              Daftar di sini
            </Link>
          </span>
        </div>
      )}

      {/* Kembali ke homepage */}
      {step === "login" && (
        <div style={{ textAlign: "center" as const, marginTop: "24px" }}>
          <Link
            href="/"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.78rem",
              color: "#8B6A5A",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#6B3A2A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8B6A5A")}>
            Kembali ke halaman utama
          </Link>
        </div>
      )}
    </div>
  );
}
