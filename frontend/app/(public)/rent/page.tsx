"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import PaymentProofUpload from "@/components/payment/PaymentProofUpload";
import { ChevronLeft, ChevronRight, ShoppingBag, Trash2, Edit2, X } from "lucide-react";
import { createRentalCart } from "@/actions/rental";

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
  target_gender?: string;
  target_age?: string;
}

interface Category {
  id: number;
  category_name: string;
}

export interface RentalCartItem {
  id: string;
  outfitId: number;
  outfitName: string;
  categoryName: string;
  imageUrl: string | null;
  pricePerDay: number;
  startDate: string;
  durationDays: number;
  subtotal: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n);
}

function getTodayString() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function getEndDate(start: string, days: number): string {
  if (!start || !days) return "-";
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// ── Outfit Card with gallery ────────────────────────────────────────────────

function OutfitCard({
  outfit,
  countInCart,
  onAddToCartClick,
  onImageClick,
}: {
  outfit: Outfit;
  countInCart: number;
  onAddToCartClick: () => void;
  onImageClick: (url: string) => void;
}) {
  const allImages = [outfit.image_url, ...(outfit.additional_image_urls ?? [])].filter(Boolean) as string[];
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #EDD8CC",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(107,58,42,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Gambar utama */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", background: "#FDF8F3" }}>
        {allImages.length > 0 ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={allImages[activeImgIdx]}
            alt={`${outfit.outfit_name} - ${activeImgIdx + 1}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
            onClick={() => onImageClick(allImages[activeImgIdx])}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
            👗
          </div>
        )}

        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveImgIdx((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
              style={{
                position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.75)", border: "none", borderRadius: "50%",
                width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", backdropFilter: "blur(4px)",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setActiveImgIdx((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
              style={{
                position: "absolute", top: "50%", right: "8px", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.75)", border: "none", borderRadius: "50%",
                width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", backdropFilter: "blur(4px)",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Thumbnail dots */}
        {allImages.length > 1 && (
          <div style={{ position: "absolute", bottom: "8px", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "4px" }}>
            {allImages.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setActiveImgIdx(idx)}
                style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: idx === activeImgIdx ? "#6B3A2A" : "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail info */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "0.72rem", color: "#C9922A", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
            {outfit.category_name} {outfit.size && `· Size ${outfit.size}`}
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "8px" }}>
            {outfit.outfit_name}
          </div>
        </div>

        <button
          onClick={onAddToCartClick}
          style={{
            width: "100%",
            background: countInCart > 0 ? "#FDF0E6" : "#6B3A2A",
            color: countInCart > 0 ? "#6B3A2A" : "white",
            border: `1.5px solid ${countInCart > 0 ? "#C9922A" : "#6B3A2A"}`,
            padding: "10px",
            borderRadius: "8px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
        >
          <ShoppingBag size={15} />
          {countInCart > 0 ? `+ Tambah Lagi (${countInCart} di Cart)` : "+ Tambah ke Keranjang"}
        </button>
      </div>
    </div>
  );
}

// ── Configure Item Modal ───────────────────────────────────────────────────

function ConfigureModal({
  outfit,
  existingItem,
  onClose,
  onAddToCart
}: {
  outfit: Outfit;
  existingItem?: RentalCartItem;
  onClose: () => void;
  onAddToCart: (item: RentalCartItem) => void;
}) {
  const [startDate, setStartDate] = useState(existingItem?.startDate || getTodayString());
  const [durationDays, setDurationDays] = useState(existingItem?.durationDays || 1);

  const pricePerDay = parseFloat(outfit.price as any);
  const total = pricePerDay * durationDays;

  function handleSave() {
    onAddToCart({
      id: existingItem?.id || Math.random().toString(36).substring(2, 9),
      outfitId: outfit.id,
      outfitName: outfit.outfit_name,
      categoryName: outfit.category_name,
      imageUrl: outfit.image_url,
      pricePerDay,
      startDate,
      durationDays,
      subtotal: total,
    });
    onClose();
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", overflowY: "auto" }}
      onClick={onClose}
    >
      {/* Sembunyikan native spinner arrows untuk input number */}
      <style>{`
        .rent-duration-input::-webkit-inner-spin-button,
        .rent-duration-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .rent-duration-input { -moz-appearance: textfield; appearance: textfield; }
      `}</style>
      <div
        style={{ background: "white", border: "1px solid #EDD8CC", borderRadius: "12px", width: "100%", maxWidth: "440px", boxShadow: "0 24px 64px rgba(107,58,42,0.15)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #EDD8CC", background: "linear-gradient(135deg, #FDF8F3, #FDF0E8)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E" }}>
              Atur Detail Sewa
            </div>
            <div style={{ fontSize: "0.78rem", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
              {outfit.outfit_name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#6B3A2A", cursor: "pointer" }}><X size={20} /></button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Tanggal mulai */}
          <div>
            <label style={{ fontSize: "0.78rem", color: "#6B3A2A", fontWeight: 600, display: "block", marginBottom: "6px" }}>
              Tanggal Mulai Sewa
            </label>
            <input
              type="date"
              min={getTodayString()}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #EDD8CC", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {/* Durasi sewa */}
          <div>
            <label style={{ fontSize: "0.78rem", color: "#6B3A2A", fontWeight: 600, display: "block", marginBottom: "6px" }}>
              Durasi Sewa (Hari)
              <span style={{ fontWeight: 400, color: "#B09080", marginLeft: "6px" }}>(maks. 10 hari)</span>
            </label>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1.5px solid ${durationDays < 1 || durationDays > 10 ? "#C05060" : "#EDD8CC"}`,
              borderRadius: "8px", overflow: "hidden", background: "white",
            }}>
              <button
                type="button"
                disabled={durationDays <= 1}
                onClick={() => setDurationDays(Math.max(1, durationDays - 1))}
                style={{
                  width: "42px", height: "42px", flexShrink: 0,
                  background: "none", border: "none", borderRight: "1px solid #EDD8CC",
                  fontSize: "1.2rem", color: durationDays <= 1 ? "#D4B8AE" : "#6B3A2A",
                  cursor: durationDays <= 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (durationDays > 1) e.currentTarget.style.background = "#FDF0E6"; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                −
              </button>
              <input
                type="number"
                className="rent-duration-input"
                min={1}
                max={10}
                value={durationDays}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") { setDurationDays(1); return; }
                  const v = parseInt(raw, 10);
                  if (!isNaN(v)) setDurationDays(Math.min(10, Math.max(1, v)));
                }}
                onBlur={() => setDurationDays(Math.min(10, Math.max(1, durationDays)))}
                style={{
                  flex: 1, textAlign: "center", border: "none", outline: "none",
                  fontFamily: "'DM Mono', monospace", fontSize: "1rem",
                  fontWeight: 700, color: "#2C1A0E", background: "transparent",
                  padding: "8px 4px",
                }}
              />
              <button
                type="button"
                disabled={durationDays >= 10}
                onClick={() => setDurationDays(Math.min(10, durationDays + 1))}
                style={{
                  width: "42px", height: "42px", flexShrink: 0,
                  background: "none", border: "none", borderLeft: "1px solid #EDD8CC",
                  fontSize: "1.2rem", color: durationDays >= 10 ? "#D4B8AE" : "#6B3A2A",
                  cursor: durationDays >= 10 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (durationDays < 10) e.currentTarget.style.background = "#FDF0E6"; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                +
              </button>
            </div>
            {/* Pesan error validasi */}
            {(durationDays < 1 || durationDays > 10) && (
              <div style={{ fontSize: "0.72rem", color: "#C05060", marginTop: "4px", fontFamily: "'DM Sans', sans-serif" }}>
                ⚠️ Durasi sewa harus antara 1–10 hari.
              </div>
            )}
            {/* Tanggal pengembalian */}
            {startDate && durationDays >= 1 && durationDays <= 10 && (
              <div style={{ fontSize: "0.72rem", color: "#8B6A5A", marginTop: "5px", fontFamily: "'DM Sans', sans-serif" }}>
                📅 Pengembalian: <strong style={{ color: "#6B3A2A" }}>{getEndDate(startDate, durationDays)}</strong>
              </div>
            )}
          </div>

          {/* Total */}
          <div style={{ borderTop: "1px solid #EDD8CC", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#8B6A5A" }}>Total Estimasi:</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1rem", fontWeight: 700, color: "#6B3A2A" }}>
              {formatRupiah(total)}
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={durationDays < 1 || durationDays > 10}
            style={{
              width: "100%",
              background: durationDays < 1 || durationDays > 10 ? "#C4A882" : "#6B3A2A",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: durationDays < 1 || durationDays > 10 ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {existingItem ? "Simpan Perubahan" : "Masukkan ke Keranjang"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cart Panel ─────────────────────────────────────────────────────────────

function CartPanel({
  cartItems,
  onRemoveItem,
  onEditItem,
  onClose,
  onCheckoutSuccess
}: {
  cartItems: RentalCartItem[];
  onRemoveItem: (cartItemId: string) => void;
  onEditItem: (item: RentalCartItem) => void;
  onClose: () => void;
  onCheckoutSuccess: (transactionId: number) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("qris");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const grandTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  async function handleCheckout() {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        items: cartItems.map((i) => ({
          outfit_catalogues_id: i.outfitId,
          start_date: i.startDate,
          duration_days: i.durationDays,
        })),
        payment_method: paymentMethod,
        notes,
      };

      const res = await createRentalCart(payload);
      if (res.success && res.data) {
        onCheckoutSuccess(res.data.transactionId);
      } else {
        setError(res.error ?? "Gagal memproses sewa.");
      }
    } catch {
      setError("Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", width: "100%", maxWidth: "480px", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(107,58,42,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #EDD8CC", background: "linear-gradient(135deg, #FDF8F3, #FDF0E8)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "#2C1A0E" }}>
              Keranjang Sewa ({cartItems.length})
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#6B3A2A", cursor: "pointer" }}><X size={22} /></button>
        </div>

        {/* Cart items list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p>Keranjang sewa kamu masih kosong.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                style={{ background: "#FDFAF7", border: "1px solid #EDD8CC", borderRadius: "10px", padding: "14px", display: "flex", gap: "12px", alignItems: "center" }}
              >
                <div style={{ width: "60px", height: "60px", background: "white", border: "1px solid #EDD8CC", borderRadius: "8px", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.imageUrl} alt={item.outfitName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span>👗</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.9rem", fontWeight: 700, color: "#2C1A0E" }}>
                    {item.outfitName}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
                    📅 {item.startDate} ({item.durationDays} hari)
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: "#6B3A2A", marginTop: "2px" }}>
                    {formatRupiah(item.subtotal)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => onEditItem(item)}
                    style={{ background: "transparent", border: "none", color: "#6B3A2A", cursor: "pointer", padding: "6px" }}
                    title="Edit jadwal baju ini"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    style={{ background: "transparent", border: "none", color: "#C05060", cursor: "pointer", padding: "6px" }}
                    title="Hapus baju ini"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}

          {cartItems.length > 0 && (
            <>
              {/* Payment method */}
              <div style={{ marginTop: "12px" }}>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Metode Pembayaran
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { id: "qris", title: "QRIS Statis", desc: "Scan QRIS Rumah Cantik Irma", icon: "📱" },
                    { id: "cash", title: "Bayar di Tempat (Cash)", desc: "Wajib bayar di salon maks. 3 jam setelah checkout", icon: "💵" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: `2px solid ${paymentMethod === m.id ? "#C9922A" : "#EDD8CC"}`,
                        background: paymentMethod === m.id ? "#FDF0E6" : "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>{m.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.82rem", fontWeight: 700, color: "#2C1A0E" }}>{m.title}</div>
                        <div style={{ fontSize: "0.68rem", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>{m.desc}</div>
                      </div>
                      {paymentMethod === m.id && <span style={{ color: "#C9922A", fontWeight: 700 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Catatan Tambahan (opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Request khusus..."
                  rows={2}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #EDD8CC", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}
                />
              </div>

              {error && (
                <div style={{ background: "rgba(192,80,96,0.07)", border: "1px solid rgba(192,80,96,0.2)", borderRadius: "8px", padding: "10px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#C05060" }}>
                  ⚠️ {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / Total */}
        {cartItems.length > 0 && (
          <div style={{ padding: "20px 24px", borderTop: "1px solid #EDD8CC", background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#8B6A5A" }}>Total Keseluruhan:</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, color: "#6B3A2A" }}>
                {formatRupiah(grandTotal)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              style={{
                width: "100%", background: submitting ? "#B8896A" : "#6B3A2A", color: "white", border: "none", padding: "14px",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 600, letterSpacing: "0.05em",
                cursor: submitting ? "not-allowed" : "pointer", borderRadius: "8px", transition: "background 0.2s"
              }}
            >
              {submitting ? "Memproses Checkout..." : `Checkout ${cartItems.length} Baju →`}
            </button>
          </div>
        )}
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

  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterAge, setFilterAge] = useState<"all" | "dewasa" | "anak_anak">("all");
  const [showAllGenders, setShowAllGenders] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState<RentalCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [configuringOutfit, setConfiguringOutfit] = useState<Outfit | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<RentalCartItem | null>(null);

  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [transformOrigin, setTransformOrigin] = useState("center center");

  const userGender = (session?.user as any)?.gender || "unspecified";

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("irma_rental_cart");
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Sync cart to localStorage
  function updateCart(action: RentalCartItem[] | ((prev: RentalCartItem[]) => RentalCartItem[])) {
    setCartItems((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      try {
        localStorage.setItem("irma_rental_cart", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function handleAddToCart(item: RentalCartItem) {
    updateCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === item.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = item;
        return updated;
      }
      if (prev.length >= 5) return prev;
      return [...prev, item];
    });
  }

  function handleRemoveItem(cartItemId: string) {
    updateCart(cartItems.filter((i) => i.id !== cartItemId));
  }

  function handleEditItem(item: RentalCartItem) {
    const outfit = outfits.find((o) => o.id === item.outfitId);
    if (outfit) {
      setEditingCartItem(item);
      setConfiguringOutfit(outfit);
      setIsCartOpen(false);
    }
  }

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

    // Filter Target Umur
    const outfitAge = o.target_age || "semua_umur";
    const matchAge  = filterAge === "all" || outfitAge === "semua_umur" || outfitAge === filterAge;

    // Filter Gender
    let matchGender = true;
    if (!showAllGenders && userGender && userGender !== "unspecified") {
      const outfitGen = o.target_gender || "unisex";
      matchGender = outfitGen === "unisex" || outfitGen === userGender;
    }

    return matchSearch && matchCat && matchAge && matchGender;
  });

  if (isPending) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
        Memuat...
      </div>
    );
  }

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
            Pilih baju favoritmu dan sewa hingga 5 baju sekaligus dalam satu transaksi.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
            <div style={{ width: "40px", height: "1px", background: "#EDD8CC" }} />
            <span style={{ color: "#C9922A" }}>✦</span>
            <div style={{ width: "40px", height: "1px", background: "#EDD8CC" }} />
          </div>
        </div>

        {/* Filter + Search */}
        <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Baris 1: Search + Kategori */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#C9922A", pointerEvents: "none" }}>🔍</span>
              <input
                type="text"
                placeholder="Cari nama baju..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", background: "white", border: "1px solid #EDD8CC", borderRadius: "8px", padding: "11px 14px 11px 40px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#2C1A0E", outline: "none", boxShadow: "0 1px 4px rgba(107,58,42,0.06)" }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => setFilterCat("all")}
                style={{ padding: "10px 18px", border: `1.5px solid ${filterCat === "all" ? "#6B3A2A" : "#EDD8CC"}`, background: filterCat === "all" ? "#6B3A2A" : "white", color: filterCat === "all" ? "white" : "#6B3A2A", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer" }}
              >
                Semua
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCat(String(c.id))}
                  style={{ padding: "10px 18px", border: `1.5px solid ${filterCat === String(c.id) ? "#6B3A2A" : "#EDD8CC"}`, background: filterCat === String(c.id) ? "#6B3A2A" : "white", color: filterCat === String(c.id) ? "white" : "#6B3A2A", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer" }}
                >
                  {c.category_name}
                </button>
              ))}
            </div>
          </div>

          {/* Baris 2: Filter Umur + Checkbox Gender */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", background: "white", border: "1px solid #EDD8CC", borderRadius: "8px", padding: "10px 16px", boxShadow: "0 1px 4px rgba(107,58,42,0.04)" }}>

            {/* Filter Umur */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>Umur:</span>
              {([
                { id: "all",      label: "🌐 Semua" },
                { id: "dewasa",   label: "🧑 Dewasa" },
                { id: "anak_anak", label: "🧒 Anak" },
              ] as { id: "all" | "dewasa" | "anak_anak"; label: string }[]).map((age) => (
                <button
                  key={age.id}
                  onClick={() => setFilterAge(age.id)}
                  style={{
                    padding: "5px 12px",
                    border: `1.5px solid ${filterAge === age.id ? "#C9922A" : "#EDD8CC"}`,
                    background: filterAge === age.id ? "#FDF0E6" : "white",
                    color: filterAge === age.id ? "#6B3A2A" : "#8B6A5A",
                    borderRadius: "6px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.78rem",
                    fontWeight: filterAge === age.id ? 700 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {age.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "20px", background: "#EDD8CC", flexShrink: 0 }} />

            {/* Checkbox Semua Gender */}
            <label style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.78rem", color: "#6B3A2A", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
              <input
                type="checkbox"
                checked={showAllGenders}
                onChange={(e) => setShowAllGenders(e.target.checked)}
                style={{ accentColor: "#C9922A", width: "15px", height: "15px" }}
              />
              Tampilkan Semua Gender
            </label>

            {/* Hint gender aktif */}
            {!showAllGenders && userGender && userGender !== "unspecified" && (
              <span style={{ fontSize: "0.72rem", color: "#C9922A", fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>
                💡 Rekomendasi untuk {userGender === "wanita" ? "Wanita 👩" : "Pria 👨"} &amp; Unisex
              </span>
            )}
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
            {filtered.map((outfit) => {
              const countInCart = cartItems.filter((i) => i.outfitId === outfit.id).length;
              return (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  countInCart={countInCart}
                  onAddToCartClick={() => {
                    setEditingCartItem(null);
                    setConfiguringOutfit(outfit);
                  }}
                  onImageClick={(url) => setZoomImageUrl(url)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            background: "#6B3A2A",
            color: "white",
            border: "2px solid #C9922A",
            borderRadius: "50px",
            padding: "14px 24px",
            boxShadow: "0 10px 30px rgba(107,58,42,0.3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 900,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "0.95rem",
          }}
        >
          <ShoppingBag size={20} />
          <span>Lihat Keranjang</span>
          <span style={{ background: "#C9922A", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "0.78rem" }}>
            {cartItems.length}
          </span>
        </button>
      )}

      {/* Configure Item Modal */}
      {configuringOutfit && (
        <ConfigureModal
          outfit={configuringOutfit}
          existingItem={editingCartItem || undefined}
          onClose={() => {
            setConfiguringOutfit(null);
            setEditingCartItem(null);
          }}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Panel */}
      {isCartOpen && (
        <CartPanel
          cartItems={cartItems}
          onRemoveItem={handleRemoveItem}
          onEditItem={handleEditItem}
          onClose={() => setIsCartOpen(false)}
          onCheckoutSuccess={(txId: number) => {
            updateCart([]);
            setIsCartOpen(false);
            router.push(`/invoice/${txId}`);
          }}
        />
      )}

      {/* Zoom Image Modal */}
      {zoomImageUrl && (
        <div
          onClick={() => { setZoomImageUrl(null); setZoomScale(1); setTransformOrigin("center center"); }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: "20px" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxHeight: "90vh", maxWidth: "90vw" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomImageUrl}
              alt="Preview baju"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                if (zoomScale === 1) {
                  setTransformOrigin(`${x}% ${y}%`); setZoomScale(2.5);
                } else {
                  setZoomScale(1); setTransformOrigin("center center");
                }
              }}
              style={{ maxHeight: "80vh", maxWidth: "100%", objectFit: "contain", transform: `scale(${zoomScale})`, transformOrigin, transition: "transform 0.25s ease", borderRadius: "8px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}