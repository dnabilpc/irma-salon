"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { updateUserProfile } from "@/actions/authActions";
import Link from "next/link";

interface UserType {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  phone_number?: string;
  gender?: string;
}

function ProfileForm({ user }: { user: UserType }) {
  const router = useRouter();

  const phoneNumber = user.phone_number ?? "";
  const email = user.email ?? "";

  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(phoneNumber);
  const [gender, setGender] = useState(user.gender || "unspecified");
  const [imagePreview, setImagePreview] = useState<string | null>(user.image ?? null);
  const [imageChanged, setImageChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Ukuran file terlalu besar (maksimal 2MB)." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setImageChanged(true);
    };
    reader.readAsDataURL(file);
  };

  // Trigger file browser
  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setImagePreview(null);
    setImageChanged(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // If image changed, pass imagePreview (base64 string or null if cleared)
      // If image did not change, pass undefined (controller won't touch DB image column)
      const imageToSend = imageChanged ? imagePreview : undefined;

      const result = await updateUserProfile(name, phone, imageToSend, gender);

      if (result.success) {
        setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
        
        // Force refresh session context
        await (authClient as unknown as { session?: { forceRefresh?: () => Promise<void> } }).session?.forceRefresh?.();
        
        // Refresh page & redirect after 1.5 seconds
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2000);
      } else {
        setMessage({ type: "error", text: result.error || "Gagal memperbarui profil." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan sistem. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: "100px",
        paddingBottom: "80px",
        background: "#FDF8F3",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "540px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        {/* Back Link */}
        <div style={{ marginBottom: "24px" }}>
          <Link
            href="/dashboard"
            style={{
              color: "#8B6A5A",
              textDecoration: "none",
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#6B3A2A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8B6A5A")}
          >
            ← Kembali ke Dashboard
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: "white",
            border: "1px solid #EDD8CC",
            borderRadius: "12px",
            padding: "36px",
            boxShadow: "0 4px 20px rgba(107,58,42,0.06)",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.7rem",
                fontWeight: 700,
                color: "#2C1A0E",
                marginBottom: "8px",
              }}
            >
              Edit Profil Anda
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#8B6A5A" }}>
              Perbarui informasi pribadi dan foto profil Anda.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Avatar Upload */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                {/* Photo Preview Container */}
                <div
                  onClick={triggerFileBrowser}
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    border: "2px solid #E8A89C",
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                    background: "#F5E6E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(107,58,42,0.1)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview || "/avatar_placeholder.png"}
                    alt="Foto Profil"
                   style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {/* Hover Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0, left: 0, right: 0,
                      background: "rgba(107,58,42,0.6)",
                      color: "white",
                      fontSize: "0.65rem",
                      textAlign: "center",
                      padding: "4px 0",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    UBAH FOTO
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={triggerFileBrowser}
                  style={{
                    background: "transparent",
                    border: "1px solid #EDD8CC",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "0.75rem",
                    color: "#6B3A2A",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FDF8F3")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Pilih Foto
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(220,80,80,0.2)",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "0.75rem",
                      color: "#DC5050",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,80,80,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Hapus
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
                style={{ display: "none" }}
              />
              <span style={{ fontSize: "0.7rem", color: "#8B6A5A" }}>
                Mendukung JPG, JPEG, PNG (Maks 2MB)
              </span>
            </div>

            {/* Email (Readonly) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "#6B3A2A" }}>
                Email (Tidak dapat diubah)
              </label>
              <input
                type="text"
                value={email}
                disabled
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #EDD8CC",
                  background: "#F5EDE7",
                  color: "#8B6A5A",
                  fontSize: "0.85rem",
                  outline: "none",
                  cursor: "not-allowed",
                }}
              />
            </div>

            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "#6B3A2A" }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #EDD8CC",
                  fontSize: "0.85rem",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6B3A2A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
              />
            </div>

            {/* Phone */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "#6B3A2A" }}>
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #EDD8CC",
                  fontSize: "0.85rem",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6B3A2A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
              />
            </div>

            {/* Gender */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "#6B3A2A" }}>
                Gender / Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #EDD8CC",
                  background: "#FFF",
                  color: "#333",
                  fontSize: "0.85rem",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6B3A2A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
              >
                <option value="unspecified">Belum Ditentukan / Bebas</option>
                <option value="wanita">Wanita</option>
                <option value="pria">Pria</option>
              </select>
            </div>

            {/* Status Messages */}
            {message && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  background: message.type === "success" ? "rgba(42,140,90,0.08)" : "rgba(220,80,80,0.08)",
                  border: `1px solid ${message.type === "success" ? "#2A8C5A" : "#DC5050"}`,
                  color: message.type === "success" ? "#2A8C5A" : "#DC5050",
                }}
              >
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#6B3A2A",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "14px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginTop: "12px",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#C9922A";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#6B3A2A";
                }
              }}
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Redirect if not logged in
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?callbackUrl=/profile");
    }
  }, [session, isPending, router]);

  if (isPending || !session) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          color: "#8B6A5A",
          fontSize: "0.9rem",
          background: "#FDF8F3",
        }}
      >
        Memuat profil...
      </div>
    );
  }

  return <ProfileForm user={session.user} />;
}
