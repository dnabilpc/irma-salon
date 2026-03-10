"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

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

    const { error: authError } = await signIn.email({
      email,
      password,
      callbackURL: "/admin/dashboard",
    });

    if (authError) {
      setError("Email atau password salah. Silakan coba lagi.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
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
          Admin Panel
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
        {/* Email */}
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
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@salonirma.com"
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
