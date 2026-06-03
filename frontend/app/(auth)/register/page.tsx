"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerCustomer } from "@/actions/authActions";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [phone, setPhone]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);

    const result = await registerCustomer(name, email, phone, password);

    if (!result.success) {
      setError(result.error || "Pendaftaran gagal. Silakan coba lagi.");
      setLoading(false);
      return;
    }

    // Redirect to pending approval page
    router.push("/pending-approval");
  }

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    border: "1px solid #EDD8CC",
    borderRadius: "6px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.88rem",
    color: "#2C1A0E",
    background: "#FDFAF7",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.72rem",
    fontWeight: 600,
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
        padding: "40px 36px",
        border: "1px solid #EDD8CC",
        width: "100%",
        maxWidth: "440px",
        boxShadow: "0 20px 60px rgba(107,58,42,0.08)",
        borderRadius: "4px",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#6B3A2A", marginBottom: "4px" }}>
          Rumah Cantik Irma
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", letterSpacing: "0.18em", color: "#C9922A", textTransform: "uppercase" }}>
          Daftar Akun Pelanggan
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "14px" }}>
          <div style={{ flex: 1, height: "1px", background: "#EDD8CC" }} />
          <span style={{ color: "#C9922A", fontSize: "0.8rem" }}>✦</span>
          <div style={{ flex: 1, height: "1px", background: "#EDD8CC" }} />
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background: "rgba(201,146,42,0.07)", border: "1px solid rgba(201,146,42,0.25)", borderRadius: "6px", padding: "10px 14px", marginBottom: "18px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>ℹ️</span>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#7A5A1A", margin: 0, lineHeight: 1.5 }}>
          Pendaftaran memerlukan persetujuan admin. Setelah mendaftar, akun Anda akan diverifikasi terlebih dahulu.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(192,80,96,0.07)", border: "1px solid rgba(192,80,96,0.2)", color: "#C05060", padding: "10px 14px", fontSize: "0.8rem", fontFamily: "'DM Sans', sans-serif", marginBottom: "18px", borderRadius: "6px" }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Nama */}
        <div>
          <label style={labelStyle}>Nama Lengkap</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkapmu"
            required
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
          />
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
            required
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
          />
        </div>

        {/* No. HP */}
        <div>
          <label style={labelStyle}>Nomor WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            required
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
          />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "#8B6A5A", marginTop: "4px" }}>
            Digunakan untuk konfirmasi booking dan notifikasi persetujuan via WhatsApp
          </p>
        </div>

        {/* Password */}
        <div>
          <label style={labelStyle}>Password</label>
          <input
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

        {/* Konfirmasi password */}
        <div>
          <label style={labelStyle}>Konfirmasi Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password"
            required
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#B8896A" : "#6B3A2A",
            color: "white",
            border: "none",
            padding: "13px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
            borderRadius: "6px",
            marginTop: "4px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#C9922A"; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#6B3A2A"; }}
        >
          {loading ? "Mendaftar..." : "Daftar Sekarang"}
        </button>
      </form>

      {/* Link ke login */}
      <div style={{ textAlign: "center", marginTop: "20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#8B6A5A" }}>
        Sudah punya akun?{" "}
        <Link
          href="/login"
          style={{ color: "#6B3A2A", fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#C9922A")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6B3A2A")}
        >
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}