"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient, signIn } from "@/lib/auth-client";
import { AppUser } from "@/types";
import { resolveLoginIdentifier } from "@/actions/authActions";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

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
      setError("Akun kamu masih menunggu persetujuan admin. Kami akan kirimkan notifikasi WhatsApp setelah disetujui.");
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
          {error}
        </div>
      )}

      {/* Form */}
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

      {/* Belum punya akun? */}
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

      {/* Kembali ke homepage */}
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
    </div>
  );
}
