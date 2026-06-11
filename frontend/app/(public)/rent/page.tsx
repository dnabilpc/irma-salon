"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Outfit {
  id: number;
  outfit_name: string;
  description: string | null;
  price: number;
  size: string | null;
  image_url: string | null;
  additional_image_urls: string[] | null;
  model_2d_file_link: string | null;
  outfit_category_id: number;
  category_name: string;
}

interface Category {
  id: number;
  category_name: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n);
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getEndDate(start: string, days: number): string {
  if (!start || !days) return "-";
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// ── Outfit Card with gallery ────────────────────────────────────────────────

function OutfitCard({ outfit, onRentClick }: { outfit: Outfit; onRentClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const allImages = [outfit.image_url, ...(outfit.additional_image_urls ?? [])].filter(Boolean) as string[];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (allImages.length > 1) {
      setActiveImgIdx((prev) => (prev + 1) % allImages.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (allImages.length > 1) {
      setActiveImgIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setActiveImgIdx(0);
      }}
      style={{
        background: "white",
        border: "1px solid #EDD8CC",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: hovered
          ? "0 12px 32px rgba(107,58,42,0.12)"
          : "0 2px 12px rgba(107,58,42,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.25s",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Gambar Container */}
      <div
        style={{
          height: "220px",
          background: "linear-gradient(135deg, #FDF0E8, #FDF8F3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {allImages.length > 0 ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={allImages[activeImgIdx]}
            alt={`${outfit.outfit_name} - ${activeImgIdx + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: hovered ? "scale(1.03)" : "scale(1)",
              transition: "transform 0.5s ease",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span style={{ fontSize: "4rem" }}>👗</span>
        )}

        {/* Navigation Arrows for Card Gallery */}
        {hovered && allImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.85)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#6B3A2A",
                zIndex: 2,
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={nextImage}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.85)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#6B3A2A",
                zIndex: 2,
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
              aria-label="Foto berikutnya"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}

        {/* Gallery Dots Indicators inside Card */}
        {allImages.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "4px",
              zIndex: 2,
              background: "rgba(0,0,0,0.3)",
              padding: "2px 6px",
              borderRadius: "8px",
              backdropFilter: "blur(1px)",
            }}
          >
            {allImages.map((_, i) => (
              <span
                key={i}
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: activeImgIdx === i ? "white" : "rgba(255,255,255,0.4)",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        )}

        {/* Badge kategori */}
        <div style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(107,58,42,0.85)", color: "white", fontSize: "0.62rem", fontWeight: 600, padding: "3px 10px", borderRadius: "6px", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif", zIndex: 1 }}>
          {outfit.category_name}
        </div>

        {/* Badge VTO */}
        {outfit.model_2d_file_link && (
          <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(201,146,42,0.9)", color: "white", fontSize: "0.62rem", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", letterSpacing: "0.06em", zIndex: 1 }}>
            Try-On AI
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
          {outfit.outfit_name}
        </div>
        {outfit.description && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#8B6A5A", marginBottom: "10px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {outfit.description}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", marginTop: "auto" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1rem", fontWeight: 700, color: "#6B3A2A" }}>
              {formatRupiah(outfit.price)}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", color: "#8B6A5A" }}>per hari</div>
          </div>
          {outfit.size && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: "#8B6A5A", background: "#F5EDE0", padding: "3px 10px", borderRadius: "6px" }}>
              {outfit.size}
            </span>
          )}
        </div>

        <button
          onClick={onRentClick}
          style={{ width: "100%", background: "#6B3A2A", color: "white", border: "none", padding: "11px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.06em", cursor: "pointer", borderRadius: "8px", transition: "background 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#C9922A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#6B3A2A")}
        >
          Sewa Baju Ini
        </button>
      </div>
    </div>
  );
}

// ── Rent Modal ─────────────────────────────────────────────────────────────

function RentModal({
  outfit,
  onClose,
  onSuccess,
}: {
  outfit: Outfit;
  onClose: () => void;
  onSuccess: (rentalId: number, method: "cash" | "qris", redirectUrl?: string | null) => void;
}) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [startDate, setStartDate]     = useState("");
  const [durationDays, setDurationDays] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");
  const allImages = [outfit.image_url, ...(outfit.additional_image_urls ?? [])].filter(Boolean) as string[];

  const totalHarga = outfit.price * durationDays;
  const totalBayar = totalHarga;

  async function handleSubmit() {
    if (!startDate) { setError("Pilih tanggal mulai sewa."); return; }
    if (durationDays < 1) { setError("Durasi minimal 1 hari."); return; }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outfit_catalogues_id: outfit.id,
          start_date: startDate,
          duration_days: durationDays,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat pesanan sewa.");

      onSuccess(data.rentalId, paymentMethod, data.redirect_url || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", border: "1px solid #EDD8CC", borderRadius: "12px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(107,58,42,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #EDD8CC", background: "linear-gradient(135deg, #FDF8F3, #FDF0E8)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
              Sewa Baju
            </div>
            <div style={{ fontSize: "0.78rem", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
              {outfit.outfit_name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(107,58,42,0.08)", border: "1px solid #EDD8CC", color: "#6B3A2A", cursor: "pointer", width: "30px", height: "30px", borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Foto Slider Premium */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#FDFAF7", border: "1px solid #EDD8CC", borderRadius: "10px", padding: "14px" }}>
            <div style={{ position: "relative", width: "100%", height: "200px", background: "linear-gradient(135deg, #FDF0E8, #FDF8F3)", borderRadius: "8px", overflow: "hidden", border: "1px solid #EDD8CC", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {allImages.length > 0 ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={allImages[activeImgIdx]} alt={outfit.outfit_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>👗</div>
              )}
              
              {/* Navigasi Gambar */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImgIdx((prev) => (prev - 1 + allImages.length) % allImages.length)}
                    style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B3A2A", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", zIndex: 2 }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImgIdx((prev) => (prev + 1) % allImages.length)}
                    style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B3A2A", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", zIndex: 2 }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </>
              )}
              
              {/* Titik Indikator */}
              {allImages.length > 1 && (
                <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px", background: "rgba(0,0,0,0.25)", padding: "2px 6px", borderRadius: "8px", zIndex: 2 }}>
                  {allImages.map((_, i) => (
                    <span key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: activeImgIdx === i ? "white" : "rgba(255,255,255,0.5)", transition: "all 0.2s" }} />
                  ))}
                </div>
              )}
            </div>
            
            {/* Detail Baju */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "4px" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", fontWeight: 700, color: "#2C1A0E" }}>{outfit.outfit_name}</div>
                <div style={{ fontSize: "0.75rem", color: "#8B6A5A", marginTop: "2px" }}>{outfit.category_name} {outfit.size && `· Size ${outfit.size}`}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9rem", fontWeight: 700, color: "#6B3A2A" }}>{formatRupiah(outfit.price)}</div>
                <div style={{ fontSize: "0.65rem", color: "#8B6A5A" }}>per hari</div>
              </div>
            </div>
          </div>

          {/* Tanggal mulai */}
          <div>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Tanggal Mulai Sewa
            </label>
            <input
              type="date"
              value={startDate}
              min={getTodayString()}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #EDD8CC", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#2C1A0E", background: "#FDFAF7", outline: "none" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
            />
          </div>

          {/* Durasi */}
          <div>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Durasi Sewa (hari)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setDurationDays((d) => Math.max(1, d - 1))}
                style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #EDD8CC", background: "white", color: "#6B3A2A", fontSize: "1.1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >−</button>
              <div style={{ flex: 1, textAlign: "center", fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "#2C1A0E" }}>
                {durationDays}
              </div>
              <button
                onClick={() => setDurationDays((d) => Math.min(30, d + 1))}
                style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #EDD8CC", background: "white", color: "#6B3A2A", fontSize: "1.1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >+</button>
            </div>
            {startDate && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: "#8B6A5A", marginTop: "6px", textAlign: "center" }}>
                Pengembalian: <strong>{getEndDate(startDate, durationDays)}</strong>
              </p>
            )}
          </div>

          {/* Pilihan Metode Pembayaran */}
          <div>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Metode Pembayaran
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {([
                { id: "cash", title: "Bayar Di Tempat", desc: "Bayar biaya sewa di salon saat ambil baju (Tunai / QRIS Statis)", icon: "💵" },
                { id: "qris", title: "QRIS Statis", desc: "Bayar biaya sewa via scan QRIS Statis Rumah Cantik Irma", icon: "📱" }
              ] as const).map((m) => {
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      background: active ? "#FDF0E6" : "white",
                      border: `2px solid ${active ? "#C9922A" : "#EDD8CC"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      width: "100%"
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.8rem", fontWeight: 700, color: "#2C1A0E" }}>{m.title}</div>
                      <div style={{ fontSize: "0.68rem", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>{m.desc}</div>
                    </div>
                    <div style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      border: `2px solid ${active ? "#C9922A" : "#EDD8CC"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: active ? "#C9922A" : "transparent"
                    }}>
                      {active && <span style={{ color: "white", fontSize: "0.5rem" }}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ringkasan harga */}
          <div style={{ background: "#FDFAF7", border: "1px solid #EDD8CC", borderRadius: "8px", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#8B6A5A" }}>
                {formatRupiah(outfit.price)} × {durationDays} hari
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", color: "#2C1A0E" }}>
                {formatRupiah(totalHarga)}
              </span>
            </div>
            <div style={{ borderTop: "1px solid #EDD8CC", paddingTop: "10px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#2C1A0E" }}>
                Total Bayar
              </span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, color: "#6B3A2A" }}>
                {formatRupiah(totalBayar)}
              </span>
            </div>
          </div>

          {/* Info */}
          <div style={{ background: "rgba(201,146,42,0.07)", border: "1px solid rgba(201,146,42,0.2)", borderRadius: "8px", padding: "10px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#A07010", lineHeight: 1.6 }}>
            <div>✦ Jaminan sewa berupa KTP asli atau uang jaminan diserahkan langsung di salon saat pengambilan baju.</div>
            <div style={{ marginTop: "4px" }}>
              {paymentMethod === "qris"
                ? "✦ Silakan lakukan transfer QRIS terlebih dahulu atau scan QRIS setelah konfirmasi sewa."
                : "✦ Biaya sewa dilunasi langsung di salon saat pengambilan baju (Tunai / QRIS Statis)."
              }
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "rgba(192,80,96,0.07)", border: "1px solid rgba(192,80,96,0.2)", borderRadius: "8px", padding: "10px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#C05060" }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #EDD8CC", display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid #EDD8CC", color: "#8B6A5A", padding: "11px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", cursor: "pointer", borderRadius: "8px" }}>
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 2, background: submitting ? "#B8896A" : "#6B3A2A", color: "white", border: "none", padding: "11px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", borderRadius: "8px", transition: "background 0.2s" }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#C9922A"; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = "#6B3A2A"; }}
          >
            {submitting ? "Memproses..." : "Konfirmasi Sewa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function SewaBajuPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [outfits, setOutfits]       = useState<Outfit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<string>("all");
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [successRentalId, setSuccessRentalId] = useState<number | null>(null);
  const [successRedirectUrl, setSuccessRedirectUrl] = useState<string | null>(null);
  const [successPaymentMethod, setSuccessPaymentMethod] = useState<"cash" | "qris">("cash");
  const [qrisImageError, setQrisImageError] = useState(false);

  useEffect(() => {
    fetch("/api/outfits")
      .then((r) => r.json())
      .then((data) => {
        setOutfits(data.outfits ?? []);
        setCategories(data.categories ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = outfits.filter((o) => {
    const matchSearch = !search || o.outfit_name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = filterCat === "all" || String(o.outfit_category_id) === filterCat;
    return matchSearch && matchCat;
  });

  // ── Loading ──

  if (isPending) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
        Memuat...
      </div>
    );
  }

  // ── Belum login ──

  if (!session) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "12px" }}>
          Login Diperlukan
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#8B6A5A", marginBottom: "28px", maxWidth: "360px", lineHeight: 1.7 }}>
          Kamu perlu login untuk menyewa baju.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => router.push("/login?callbackUrl=/rent")}
            style={{ background: "#6B3A2A", color: "white", border: "none", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: "8px" }}
          >
            Login
          </button>
          <button
            onClick={() => router.push("/register")}
            style={{ background: "transparent", color: "#6B3A2A", border: "1.5px solid #6B3A2A", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: "8px" }}
          >
            Daftar Akun
          </button>
        </div>
      </div>
    );
  }

  // ── Sukses ──

  if (successRentalId) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🎉</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.8rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "12px" }}>
          Pesanan Sewa Berhasil!
        </h1>
        <div style={{ background: "rgba(201,146,42,0.1)", border: "1px solid rgba(201,146,42,0.3)", borderRadius: "8px", padding: "8px 20px", marginBottom: "16px", fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", color: "#C9922A" }}>
          ID Sewa: #{successRentalId}
        </div>
        
        {successPaymentMethod === "qris" ? (
          <>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#8B6A5A", maxWidth: "440px", lineHeight: 1.7, marginBottom: "8px" }}>
              Pesanan sewamu sudah diterima dan menunggu konfirmasi admin. Silakan lakukan pembayaran via scan QRIS Statis di bawah ini dan tunjukkan bukti transaksi kepada kasir/admin saat pengambilan baju.
            </p>
            
            {/* QRIS Card */}
            <div style={{ 
              background: "white", 
              border: "2px solid #EDD8CC", 
              borderRadius: "12px", 
              padding: "16px", 
              margin: "12px auto 20px", 
              maxWidth: "280px",
              boxShadow: "0 8px 24px rgba(107,58,42,0.08)",
              textAlign: "center"
            }}>
              <div style={{ background: "#004b7b", color: "white", padding: "6px", borderRadius: "6px 6px 0 0", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em" }}>
                QRIS
              </div>
              <div style={{ border: "1px solid #EDD8CC", borderTop: "none", padding: "16px 12px 12px", borderRadius: "0 0 6px 6px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
                  RUMAH CANTIK IRMA
                </div>
                <div style={{ fontSize: "0.6rem", color: "#8B6A5A", marginBottom: "14px" }}>
                  NMID: ID1020304050607
                </div>
                {!qrisImageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src="/qris.png" 
                    alt="QRIS Rumah Cantik Irma" 
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
                    {/* Position detection patterns (corners) */}
                    <div style={{ position: "absolute", top: "2px", left: "2px", width: "36px", height: "36px", border: "8px solid #2C1A0E", background: "white", boxSizing: "border-box" }} />
                    <div style={{ position: "absolute", top: "2px", right: "2px", width: "36px", height: "36px", border: "8px solid #2C1A0E", background: "white", boxSizing: "border-box" }} />
                    <div style={{ position: "absolute", bottom: "2px", left: "2px", width: "36px", height: "36px", border: "8px solid #2C1A0E", background: "white", boxSizing: "border-box" }} />
                    {/* Center branding box */}
                    <div style={{ background: "white", padding: "4px 8px", border: "2px solid #2C1A0E", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700, color: "#C9922A", zIndex: 5 }}>
                      IRMA
                    </div>
                  </div>
                )}
                <div style={{ fontSize: "0.68rem", color: "#8B6A5A", fontWeight: 500 }}>
                  Scan dengan E-Wallet atau Mobile Banking
                </div>
              </div>
            </div>
            
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "#8B6A5A", maxWidth: "400px", lineHeight: 1.7, marginBottom: "32px" }}>
              Silakan lakukan pembayaran sesuai dengan total biaya sewa menggunakan QRIS Statis, lalu simpan bukti pembayaran Anda untuk ditunjukkan ke salon saat pengambilan baju.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#8B6A5A", maxWidth: "440px", lineHeight: 1.7, marginBottom: "8px" }}>
              Pesanan sewamu sudah diterima dan menunggu konfirmasi admin. Pelunasan biaya sewa dilakukan langsung di salon saat kamu mengambil baju (Tunai / QRIS Statis).
            </p>
            
            {/* QRIS Card */}
            <div style={{ 
              background: "white", 
              border: "2px solid #EDD8CC", 
              borderRadius: "12px", 
              padding: "16px", 
              margin: "12px auto 20px", 
              maxWidth: "280px",
              boxShadow: "0 8px 24px rgba(107,58,42,0.08)",
              textAlign: "center"
            }}>
              <div style={{ background: "#004b7b", color: "white", padding: "6px", borderRadius: "6px 6px 0 0", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em" }}>
                QRIS
              </div>
              <div style={{ border: "1px solid #EDD8CC", borderTop: "none", padding: "16px 12px 12px", borderRadius: "0 0 6px 6px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
                  RUMAH CANTIK IRMA
                </div>
                <div style={{ fontSize: "0.6rem", color: "#8B6A5A", marginBottom: "14px" }}>
                  NMID: ID1020304050607
                </div>
                {!qrisImageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src="/qris.png" 
                    alt="QRIS Rumah Cantik Irma" 
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
                    {/* Position detection patterns (corners) */}
                    <div style={{ position: "absolute", top: "2px", left: "2px", width: "36px", height: "36px", border: "8px solid #2C1A0E", background: "white", boxSizing: "border-box" }} />
                    <div style={{ position: "absolute", top: "2px", right: "2px", width: "36px", height: "36px", border: "8px solid #2C1A0E", background: "white", boxSizing: "border-box" }} />
                    <div style={{ position: "absolute", bottom: "2px", left: "2px", width: "36px", height: "36px", border: "8px solid #2C1A0E", background: "white", boxSizing: "border-box" }} />
                    {/* Center branding box */}
                    <div style={{ background: "white", padding: "4px 8px", border: "2px solid #2C1A0E", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700, color: "#C9922A", zIndex: 5 }}>
                      IRMA
                    </div>
                  </div>
                )}
                <div style={{ fontSize: "0.68rem", color: "#8B6A5A", fontWeight: 500 }}>
                  Scan dengan E-Wallet atau Mobile Banking
                </div>
              </div>
            </div>
            
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "#8B6A5A", maxWidth: "400px", lineHeight: 1.7, marginBottom: "32px" }}>
              Jaminan sewa (KTP asli) diserahkan langsung di salon saat pengambilan baju. Biaya sewa dapat dibayar tunai di tempat atau via scan QRIS di atas terlebih dahulu dengan menunjukkan bukti transfer.
            </p>
          </>
        )}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => router.push("/")}
            style={{ background: "#6B3A2A", color: "white", border: "none", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: "8px" }}
          >
            Kembali ke Beranda
          </button>
          <button
            onClick={() => {
              setSuccessRentalId(null);
              setSuccessRedirectUrl(null);
              setSuccessPaymentMethod("cash");
            }}
            style={{ background: "transparent", color: "#6B3A2A", border: "1.5px solid #6B3A2A", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: "8px" }}
          >
            Sewa Lagi
          </button>
        </div>
      </div>
    );
  }

  // ── Main ──

  return (
    <div style={{ minHeight: "100vh", paddingTop: "100px", paddingBottom: "80px", background: "#FDF8F3" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", letterSpacing: "0.22em", color: "#C9922A", textTransform: "uppercase", marginBottom: "8px" }}>
            Koleksi Baju Sewaan
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.2rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "12px" }}>
            Katalog Sewa Baju
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#8B6A5A", maxWidth: "480px", margin: "0 auto 20px", lineHeight: 1.7 }}>
            Pilih baju favoritmu dan sewa dengan mudah. Tersedia berbagai koleksi untuk berbagai acara spesialmu.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
            <div style={{ width: "40px", height: "1px", background: "#EDD8CC" }} />
            <span style={{ color: "#C9922A" }}>✦</span>
            <div style={{ width: "40px", height: "1px", background: "#EDD8CC" }} />
          </div>
        </div>

        {/* Filter + Search */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#C9922A", pointerEvents: "none" }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama baju..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", background: "white", border: "1px solid #EDD8CC", borderRadius: "8px", padding: "11px 14px 11px 40px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#2C1A0E", outline: "none", boxShadow: "0 1px 4px rgba(107,58,42,0.06)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
            />
          </div>

          {/* Filter kategori */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setFilterCat("all")}
              style={{ padding: "10px 18px", border: `1.5px solid ${filterCat === "all" ? "#6B3A2A" : "#EDD8CC"}`, background: filterCat === "all" ? "#6B3A2A" : "white", color: filterCat === "all" ? "white" : "#6B3A2A", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
            >
              Semua
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCat(String(c.id))}
                style={{ padding: "10px 18px", border: `1.5px solid ${filterCat === String(c.id) ? "#6B3A2A" : "#EDD8CC"}`, background: filterCat === String(c.id) ? "#6B3A2A" : "white", color: filterCat === String(c.id) ? "white" : "#6B3A2A", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
              >
                {c.category_name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid baju */}
        {loading ? (
          <div style={{ padding: "80px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
            Memuat koleksi...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "80px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
            Tidak ada baju yang ditemukan
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
            {filtered.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onRentClick={() => setSelectedOutfit(outfit)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Rent Modal */}
      {selectedOutfit && (
        <RentModal
          outfit={selectedOutfit}
          onClose={() => setSelectedOutfit(null)}
          onSuccess={(rentalId, method, redirectUrl) => {
            setSelectedOutfit(null);
            setSuccessRentalId(rentalId);
            setSuccessPaymentMethod(method);
            setSuccessRedirectUrl(redirectUrl || null);
          }}
        />
      )}
    </div>
  );
}