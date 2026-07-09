"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { createBooking, getSalonServices } from "@/actions/booking";
import type { SalonService } from "@/actions/booking";
import PaymentProofUpload from "@/components/payment/PaymentProofUpload";

// ── Types ──────────────────────────────────────────────────────────────────

interface BookingForm {
  serviceId: number | null;
  date: string;
  time: string;
  notes: string;
}

interface SlotData {
  available: string[];
  booked: string[];
  closed: boolean;
  message?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getMaxDateString() {
  const date = new Date();
  date.setDate(date.getDate() + 21);
  return date.toISOString().split("T")[0];
}

// ── Step Indicator ─────────────────────────────────────────────────────────

const STEPS = ["Layanan", "Jadwal", "Catatan", "Konfirmasi"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "40px" }}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: done ? "#6B3A2A" : active ? "#C9922A" : "transparent",
                border: `2px solid ${done ? "#6B3A2A" : active ? "#C9922A" : "#EDD8CC"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done || active ? "white" : "#C4A882",
                fontSize: done ? "0.75rem" : "0.8rem", fontWeight: 600,
                transition: "all 0.3s", fontFamily: "'DM Sans', sans-serif",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: "0.68rem", fontFamily: "'DM Sans', sans-serif",
                color: active ? "#6B3A2A" : done ? "#C9922A" : "#C4A882",
                fontWeight: active ? 600 : 400, whiteSpace: "nowrap",
              }}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div style={{ width: "60px", height: "2px", background: done ? "#6B3A2A" : "#EDD8CC", marginBottom: "22px", transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Pilih Layanan ──────────────────────────────────────────────────

function Step1({
  selectedId, onSelect, services, loading,
}: {
  selectedId: number | null;
  onSelect: (id: number) => void;
  services: SalonService[];
  loading: boolean;
}) {
  const ICONS: Record<string, string> = {
    "Hair Treatment": "✂️",
    "Makeup & Rias":  "💄",
    "Nail Care":      "💅",
    "Facial & Skincare": "🌸",
    "Rebonding":      "💫",
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
        Memuat layanan...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>
        Pilih Layanan
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#8B6A5A", marginBottom: "24px" }}>
        Pilih layanan yang ingin kamu booking
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {services.map((svc) => {
          const selected = selectedId === svc.id;
          return (
            <button
              key={svc.id}
              onClick={() => onSelect(svc.id)}
              style={{
                background: selected ? "#FDF0E6" : "white",
                border: `2px solid ${selected ? "#C9922A" : "#EDD8CC"}`,
                padding: "18px", textAlign: "left", cursor: "pointer",
                borderRadius: "8px", transition: "all 0.2s", position: "relative",
              }}
              onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "#C9922A"; }}
              onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "#EDD8CC"; }}
            >
              {selected && (
                <div style={{ position: "absolute", top: "10px", right: "10px", width: "20px", height: "20px", borderRadius: "50%", background: "#C9922A", color: "white", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  ✓
                </div>
              )}
              <div style={{ fontSize: "1.6rem", marginBottom: "8px" }}>
                {ICONS[svc.service_name] ?? "✨"}
              </div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.9rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "10px" }}>
                {svc.service_name}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #EDD8CC" }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#6B3A2A" }}>
                  {svc.is_price_variable ? "Mulai dari " : ""}{formatRupiah(svc.price)}
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "#8B6A5A" }}>
                  ⏱ {svc.hour_duration} jam
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Pilih Jadwal ───────────────────────────────────────────────────

function Step2({
  date, time, onDateChange, onTimeChange, slotData, slotLoading,
}: {
  date: string;
  time: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  slotData: SlotData | null;
  slotLoading: boolean;
}) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>
        Pilih Jadwal
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#8B6A5A", marginBottom: "24px" }}>
        Pilih tanggal dan jam kunjungan kamu
      </p>

      {/* Tanggal */}
      <div style={{ marginBottom: "24px" }}>
        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
          Tanggal
        </label>
        <input
          type="date"
          value={date}
          min={getTodayString()}
          max={getMaxDateString()}
          onChange={(e) => { onDateChange(e.target.value); onTimeChange(""); }}
          style={{ width: "100%", padding: "11px 14px", border: "1px solid #EDD8CC", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#2C1A0E", background: "#FDFAF7", outline: "none" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
        />
      </div>

      {/* Slot jam */}
      <div>
        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
          Jam Tersedia
        </label>

        {slotLoading && (
          <div style={{ padding: "20px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}>
            Memuat slot waktu...
          </div>
        )}

        {!slotLoading && !date && (
          <div style={{ padding: "20px", background: "#FDFAF7", border: "1px dashed #EDD8CC", borderRadius: "8px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}>
            Pilih tanggal terlebih dahulu
          </div>
        )}

        {!slotLoading && slotData?.closed && (
          <div style={{ padding: "16px", background: "rgba(192,80,96,0.06)", border: "1px solid rgba(192,80,96,0.2)", borderRadius: "8px", textAlign: "center", color: "#C05060", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}>
            🚫 {slotData.message ?? "Salon tidak beroperasi pada tanggal ini"}
          </div>
        )}

        {!slotLoading && date && slotData && !slotData.closed && (
          <>
            {slotData.available.length === 0 ? (
              <div style={{ padding: "16px", background: "rgba(192,80,96,0.06)", border: "1px solid rgba(192,80,96,0.2)", borderRadius: "8px", textAlign: "center", color: "#C05060", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}>
                Semua slot sudah penuh untuk tanggal ini
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {slotData.available.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => onTimeChange(slot)}
                    style={{
                      padding: "10px 6px",
                      border: `2px solid ${time === slot ? "#C9922A" : "#EDD8CC"}`,
                      background: time === slot ? "#FDF0E6" : "white",
                      borderRadius: "8px",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.8rem",
                      fontWeight: time === slot ? 600 : 400,
                      color: time === slot ? "#6B3A2A" : "#2C1A0E",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {slot}
                  </button>
                ))}
                {slotData.booked.map((slot) => (
                  <button
                    key={`booked-${slot}`}
                    disabled
                    style={{ padding: "10px 6px", border: "1px solid #EDD8CC", background: "#F5F0EB", borderRadius: "8px", fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", color: "#C4A882", cursor: "not-allowed", textDecoration: "line-through" }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "#B09080", marginTop: "8px" }}>
              ✦ Slot yang dicoret sudah dipesan
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Step 3: Catatan Tambahan ───────────────────────────────────────────────

function Step3({
  notes, onChange, userName, userEmail,
}: {
  notes: string;
  onChange: (notes: string) => void;
  userName: string;
  userEmail: string;
}) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>
        Catatan Tambahan
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#8B6A5A", marginBottom: "24px" }}>
        Booking akan tercatat atas nama akunmu
      </p>

      {/* Info akun */}
      <div style={{ background: "rgba(201,146,42,0.06)", border: "1px solid rgba(201,146,42,0.2)", borderRadius: "8px", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #6B3A2A, #C9922A)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>
          {userName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#2C1A0E" }}>
            {userName}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: "#8B6A5A" }}>
            {userEmail}
          </div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#C9922A", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
          ✓ Terverifikasi
        </div>
      </div>

      {/* Catatan */}
      <div>
        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
          Catatan untuk Salon <span style={{ color: "#8B6A5A", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opsional)</span>
        </label>
        <textarea
          value={notes}
          placeholder="Contoh: ada alergi tertentu, request khusus, dll..."
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", padding: "11px 14px", border: "1px solid #EDD8CC", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#2C1A0E", background: "#FDFAF7", outline: "none", resize: "vertical", lineHeight: 1.6, transition: "border-color 0.2s" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
        />
      </div>
    </div>
  );
}

// ── ConfirmRow (di luar Step4) ─────────────────────────────────────────────

function ConfirmRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #EDD8CC" }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#8B6A5A", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: accent ? "#6B3A2A" : "#2C1A0E", fontWeight: accent ? 700 : 500, textAlign: "right", maxWidth: "65%" }}>
        {value}
      </span>
    </div>
  );
}

// ── Step 4: Konfirmasi ─────────────────────────────────────────────────────

function Step4({
  form, submitting, onSubmit, services, error, userName, userPhone, paymentMethod
}: {
  form: BookingForm;
  submitting: boolean;
  onSubmit: () => void;
  services: SalonService[];
  error: string;
  userName: string;
  userPhone: string;
  paymentMethod: "qris";
}) {
  const service = services.find((s) => s.id === form.serviceId);
  const isVariable = !!service?.is_price_variable;
  const subtotal = service?.price ?? 0;
  const totalAmount = subtotal;

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>
        Konfirmasi Booking
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#8B6A5A", marginBottom: "24px" }}>
        Periksa kembali detail booking kamu
      </p>

      {/* Detail */}
      <div style={{ background: "#FDFAF7", border: "1px solid #EDD8CC", borderRadius: "8px", padding: "0 18px", marginBottom: "18px" }}>
        <ConfirmRow label="Layanan" value={service?.service_name ?? "-"} />
        <ConfirmRow label="Durasi"  value={`${service?.hour_duration ?? "-"} jam`} />
        <ConfirmRow
          label="Tanggal"
          value={new Date(form.date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        />
        <ConfirmRow label="Jam"   value={`${form.time} WIB`} />
        <ConfirmRow label="Nama"  value={userName} />
        {userPhone && <ConfirmRow label="WhatsApp" value={userPhone} />}
        {form.notes && <ConfirmRow label="Catatan" value={form.notes} />}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#8B6A5A", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Pembayaran
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#5A9E7A", fontWeight: 600 }}>
            QRIS Statis
          </span>
        </div>
      </div>

      {/* Pilihan Metode Pembayaran (Locked to QRIS Statis) */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
          Metode Pembayaran
        </label>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 14px",
          background: "#FDF0E6",
          border: "2px solid #C9922A",
          borderRadius: "8px",
        }}>
          <span style={{ fontSize: "1.4rem" }}>📱</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.85rem", fontWeight: 700, color: "#2C1A0E" }}>QRIS Statis</div>
            <div style={{ fontSize: "0.72rem", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif", marginTop: "2px" }}>Pembayaran via scan QRIS Rumah Cantik Irma</div>
          </div>
          <div style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            border: "2px solid #C9922A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#C9922A"
          }}>
            <span style={{ color: "white", fontSize: "0.6rem" }}>✓</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div style={{ background: "#6B3A2A", padding: "14px 18px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
          {isVariable ? "Estimasi Total (Mulai Dari)" : "Estimasi Total"}
        </span>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: "#F5D49A" }}>
          {formatRupiah(totalAmount)}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(192,80,96,0.07)", border: "1px solid rgba(192,80,96,0.2)", borderRadius: "8px", padding: "11px 14px", marginBottom: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#C05060" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Catatan harga variabel */}
      {isVariable && (
        <div style={{ 
          background: "rgba(201,146,42,0.08)", 
          border: "1px solid rgba(201,146,42,0.25)", 
          borderRadius: "8px", 
          padding: "11px 14px", 
          marginBottom: "18px", 
          fontFamily: "'DM Sans', sans-serif", 
          fontSize: "0.78rem", 
          color: "#8B6A5A", 
          lineHeight: 1.6 
        }}>
          <strong>Catatan:</strong> Anda memilih layanan dengan harga bervariasi (<strong>{service?.service_name}</strong>). Estimasi total di atas adalah harga minimum. Harga final akan ditentukan di salon setelah konsultasi/layanan selesai.
        </div>
      )}

      {/* Info */}
      <div style={{ background: "rgba(90,158,122,0.07)", border: "1px solid rgba(90,158,122,0.2)", borderRadius: "8px", padding: "11px 14px", marginBottom: "18px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#3A9B6A", lineHeight: 1.6 }}>
        ✓ Booking akan dikonfirmasi oleh admin setelah Anda menyelesaikan pembayaran via scan QRIS Statis.
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        style={{ width: "100%", background: submitting ? "#B8896A" : "#6B3A2A", color: "white", border: "none", padding: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: submitting ? "not-allowed" : "pointer", borderRadius: "8px", transition: "background 0.2s" }}
        onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#C9922A"; }}
        onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = "#6B3A2A"; }}
      >
        {submitting ? "Memproses..." : "Konfirmasi Booking"}
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function BookingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [error, setError]         = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"qris">("qris");
  const [redirectUrl, setRedirectUrl]     = useState<string | null>(null);
  const [qrisImageError, setQrisImageError] = useState(false);

  const [services, setServices]           = useState<SalonService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [slotData, setSlotData]           = useState<SlotData | null>(null);
  const [slotLoading, setSlotLoading]     = useState(false);

  const [form, setForm] = useState<BookingForm>({
    serviceId: null,
    date: "",
    time: "",
    notes: "",
  });

  // Fetch layanan dari DB
  useEffect(() => {
    getSalonServices().then((res) => {
      if (res.success && res.data) setServices(res.data);
      setServicesLoading(false);
    });
  }, []);

  // Fetch slot saat tanggal berubah
  useEffect(() => {
    if (!form.date) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlotLoading(true);
    fetch(`/api/bookings/slots?date=${form.date}`)
      .then((r) => r.json())
      .then((data) => setSlotData({
        available: data.available ?? [],
        booked:    data.booked ?? [],
        closed:    data.closed ?? false,
        message:   data.message,
      }))
      .catch(() => setSlotData(null))
      .finally(() => setSlotLoading(false));
  }, [form.date]);

  function updateForm<K extends keyof BookingForm>(key: K, value: BookingForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    if (step === 0) return form.serviceId !== null;
    if (step === 1) return form.date !== "" && form.time !== "";
    if (step === 2) return true; // catatan opsional, selalu bisa lanjut
    return true;
  }

  async function handleSubmit() {
    if (!form.serviceId || !form.date || !form.time) return;
    setSubmitting(true);
    setError("");

    const booking_datetime = `${form.date}T${form.time}:00+07:00`;

    try {
      const result = await createBooking({
        booking_datetime,
        service_ids: [form.serviceId],
        payment_method: paymentMethod,
      });

      if (result.success && result.data) {
        setBookingId(result.data.bookingId);
        setRedirectUrl(result.data.redirect_url || null);
        setSuccess(true);
      } else {
        setError(result.error ?? "Gagal membuat booking. Silakan coba lagi.");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──

  if (isPending) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#8B6A5A" }}>
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
          Kamu perlu memiliki akun untuk melakukan booking layanan salon.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => router.push("/login?callbackUrl=/booking")}
            style={{ background: "#6B3A2A", color: "white", border: "none", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: "8px" }}
          >
            Login
          </button>
          <Link href="/register">
            <button
              style={{ background: "transparent", color: "#6B3A2A", border: "1.5px solid #6B3A2A", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: "8px" }}
            >
              Daftar Akun
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Sukses ──

  if (success) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🎉</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.8rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "12px" }}>
          Booking Berhasil!
        </h1>
        {bookingId && (
          <div style={{ background: "rgba(201,146,42,0.1)", border: "1px solid rgba(201,146,42,0.3)", borderRadius: "8px", padding: "8px 20px", marginBottom: "14px", fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", color: "#C9922A" }}>
            ID Booking: #{bookingId}
          </div>
        )}
        
        <>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#8B6A5A", maxWidth: "440px", lineHeight: 1.7, marginBottom: "8px" }}>
            Booking kamu sudah diterima dan menunggu konfirmasi admin. Silakan lakukan pembayaran via scan QRIS Statis di bawah ini dan tunjukkan bukti transaksi kepada petugas saat kedatangan.
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
          
          <PaymentProofUpload bookingId={Number(bookingId)} />
          
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "#8B6A5A", maxWidth: "400px", lineHeight: 1.7, marginBottom: "32px" }}>
            Silakan lakukan pembayaran sesuai dengan total biaya booking di atas menggunakan QRIS Statis, lalu simpan bukti pembayaran Anda untuk ditunjukkan ke salon saat kedatangan.
          </p>
        </>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => router.push("/")}
            style={{ background: "#6B3A2A", color: "white", border: "none", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: "8px" }}
          >
            Kembali ke Beranda
          </button>
          <button
            onClick={() => {
              setSuccess(false);
              setStep(0);
              setForm({ serviceId: null, date: "", time: "", notes: "" });
              setError("");
              setPaymentMethod("qris");
              setRedirectUrl(null);
            }}
            style={{ background: "transparent", color: "#6B3A2A", border: "1.5px solid #6B3A2A", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: "8px" }}
          >
            Booking Lagi
          </button>
        </div>
      </div>
    );
  }

  const userName  = session.user.name ?? "";
  const userEmail = session.user.email ?? "";
  const userPhone = (session.user as { phone_number?: string }).phone_number ?? "";

  // ── Form ──

  return (
    <div style={{ minHeight: "100vh", paddingTop: "100px", paddingBottom: "80px", background: "#FDF8F3" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", letterSpacing: "0.22em", color: "#C9922A", textTransform: "uppercase", marginBottom: "8px" }}>
            Booking Online
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "8px" }}>
            Reservasi Layanan
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
            <div style={{ width: "40px", height: "1px", background: "#EDD8CC" }} />
            <span style={{ color: "#C9922A" }}>✦</span>
            <div style={{ width: "40px", height: "1px", background: "#EDD8CC" }} />
          </div>
        </div>

        <StepIndicator current={step} />

        {/* Card */}
        <div style={{ background: "white", border: "1px solid #EDD8CC", borderRadius: "12px", padding: "32px", boxShadow: "0 4px 24px rgba(107,58,42,0.06)" }}>
          {step === 0 && (
            <Step1
              selectedId={form.serviceId}
              onSelect={(id) => updateForm("serviceId", id)}
              services={services}
              loading={servicesLoading}
            />
          )}
          {step === 1 && (
            <Step2
              date={form.date}
              time={form.time}
              onDateChange={(d) => {
                updateForm("date", d);
                if (!d) setSlotData(null);
              }}
              onTimeChange={(t) => updateForm("time", t)}
              slotData={slotData}
              slotLoading={slotLoading}
            />
          )}
          {step === 2 && (
            <Step3
              notes={form.notes}
              onChange={(notes) => updateForm("notes", notes)}
              userName={userName}
              userEmail={userEmail}
            />
          )}
          {step === 3 && (
            <Step4
              form={form}
              submitting={submitting}
              onSubmit={handleSubmit}
              services={services}
              error={error}
              userName={userName}
              userPhone={userPhone}
              paymentMethod={paymentMethod}
            />
          )}

          {/* Navigasi */}
          {step < 3 && (
            <div style={{ display: "flex", justifyContent: step === 0 ? "flex-end" : "space-between", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #EDD8CC" }}>
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  style={{ background: "transparent", border: "1px solid #EDD8CC", color: "#8B6A5A", padding: "10px 22px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", cursor: "pointer", borderRadius: "8px", transition: "border-color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
                >
                  ← Kembali
                </button>
              )}
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                style={{ background: canProceed() ? "#6B3A2A" : "#D4C4B8", color: "white", border: "none", padding: "10px 26px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.06em", cursor: canProceed() ? "pointer" : "not-allowed", borderRadius: "8px", transition: "background 0.2s" }}
                onMouseEnter={(e) => { if (canProceed()) e.currentTarget.style.background = "#C9922A"; }}
                onMouseLeave={(e) => { if (canProceed()) e.currentTarget.style.background = "#6B3A2A"; }}
              >
                Lanjut →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}