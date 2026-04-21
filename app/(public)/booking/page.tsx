"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

// ── Types ──────────────────────────────────────────────────────────────────

interface BookingService {
  id: number;
  name: string;
  price: number;
  priceLabel: string;
  duration: string;
  icon: string;
  desc: string;
}

interface BookingForm {
  serviceId: number | null;
  date: string;
  time: string;
  name: string;
  phone: string;
  notes: string;
}

// ── Data ───────────────────────────────────────────────────────────────────

const BOOKABLE_SERVICES: BookingService[] = [
  {
    id: 1,
    name: "Hair Treatment",
    price: 85000,
    priceLabel: "Mulai Rp 85.000",
    duration: "60 menit",
    icon: "✂️",
    desc: "Perawatan rambut profesional dengan produk premium",
  },
  {
    id: 2,
    name: "Makeup & Rias",
    price: 150000,
    priceLabel: "Mulai Rp 150.000",
    duration: "90 menit",
    icon: "💄",
    desc: "Rias wajah untuk berbagai acara spesial kamu",
  },
  {
    id: 3,
    name: "Nail Care",
    price: 60000,
    priceLabel: "Mulai Rp 60.000",
    duration: "45 menit",
    icon: "💅",
    desc: "Perawatan kuku manicure & pedicure terlengkap",
  },
  {
    id: 4,
    name: "Facial & Skincare",
    price: 120000,
    priceLabel: "Mulai Rp 120.000",
    duration: "75 menit",
    icon: "🌸",
    desc: "Perawatan kulit wajah dengan teknologi terkini",
  },
];

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

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

// ── Step indicator ─────────────────────────────────────────────────────────

const STEPS = ["Layanan", "Jadwal", "Data Diri", "Konfirmasi"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "40px",
        gap: 0,
      }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {/* Circle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: done
                    ? "#6B3A2A"
                    : active
                      ? "#C9922A"
                      : "transparent",
                  border: done
                    ? "2px solid #6B3A2A"
                    : active
                      ? "2px solid #C9922A"
                      : "2px solid #EDD8CC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: done || active ? "white" : "#C4A882",
                  fontSize: done ? "0.75rem" : "0.8rem",
                  fontWeight: 600,
                  transition: "all 0.3s",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                {done ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontFamily: "'DM Sans', sans-serif",
                  color: active ? "#6B3A2A" : done ? "#C9922A" : "#C4A882",
                  fontWeight: active ? 600 : 400,
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}>
                {label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                style={{
                  width: "60px",
                  height: "2px",
                  background: done ? "#6B3A2A" : "#EDD8CC",
                  marginBottom: "22px",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Pilih Layanan ──────────────────────────────────────────────────

function Step1({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#2C1A0E",
          marginBottom: "6px",
        }}>
        Pilih Layanan
      </h2>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.85rem",
          color: "#8B6A5A",
          marginBottom: "24px",
        }}>
        Pilih layanan yang ingin kamu booking
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}>
        {BOOKABLE_SERVICES.map((svc) => {
          const selected = selectedId === svc.id;
          return (
            <button
              key={svc.id}
              onClick={() => onSelect(svc.id)}
              style={{
                background: selected ? "#FDF0E6" : "white",
                border: `2px solid ${selected ? "#C9922A" : "#EDD8CC"}`,
                padding: "20px",
                textAlign: "left" as const,
                cursor: "pointer",
                borderRadius: "4px",
                transition: "all 0.2s",
                position: "relative",
              }}>
              {/* Selected checkmark */}
              {selected && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#C9922A",
                    color: "white",
                    fontSize: "0.65rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}>
                  ✓
                </div>
              )}

              <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>
                {svc.icon}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#2C1A0E",
                  marginBottom: "4px",
                }}>
                {svc.name}
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  color: "#8B6A5A",
                  lineHeight: 1.5,
                  marginBottom: "12px",
                }}>
                {svc.desc}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#6B3A2A",
                  }}>
                  {svc.priceLabel}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.7rem",
                    color: "#8B6A5A",
                  }}>
                  ⏱ {svc.duration}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Pilih Tanggal & Waktu ─────────────────────────────────────────

function Step2({
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  date: string;
  time: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
}) {
  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#2C1A0E",
          marginBottom: "6px",
        }}>
        Pilih Jadwal
      </h2>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.85rem",
          color: "#8B6A5A",
          marginBottom: "24px",
        }}>
        Pilih tanggal dan jam kunjungan kamu
      </p>

      {/* Pilih tanggal */}
      <div style={{ marginBottom: "28px" }}>
        <label
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#6B3A2A",
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            display: "block",
            marginBottom: "8px",
          }}>
          Tanggal
        </label>
        <input
          type="date"
          value={date}
          min={getTodayString()}
          onChange={(e) => onDateChange(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "1px solid #EDD8CC",
            borderRadius: "4px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.9rem",
            color: "#2C1A0E",
            background: "#FDFAF7",
            outline: "none",
            cursor: "pointer",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
        />
      </div>

      {/* Pilih jam */}
      <div>
        <label
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#6B3A2A",
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            display: "block",
            marginBottom: "8px",
          }}>
          Jam (09.00 – 18.00)
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}>
          {TIME_SLOTS.map((slot) => {
            const selected = time === slot;
            return (
              <button
                key={slot}
                onClick={() => onTimeChange(slot)}
                style={{
                  padding: "12px",
                  border: `2px solid ${selected ? "#C9922A" : "#EDD8CC"}`,
                  background: selected ? "#FDF0E6" : "white",
                  borderRadius: "4px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.85rem",
                  fontWeight: selected ? 600 : 400,
                  color: selected ? "#6B3A2A" : "#8B6A5A",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                {slot}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Data Diri ──────────────────────────────────────────────────────

function Step3({
  name,
  phone,
  notes,
  onChange,
}: {
  name: string;
  phone: string;
  notes: string;
  onChange: (field: "name" | "phone" | "notes", value: string) => void;
}) {
  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #EDD8CC",
    borderRadius: "4px",
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
    fontWeight: 600,
    color: "#6B3A2A",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    display: "block",
    marginBottom: "8px",
  };

  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#2C1A0E",
          marginBottom: "6px",
        }}>
        Data Diri
      </h2>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.85rem",
          color: "#8B6A5A",
          marginBottom: "24px",
        }}>
        Isi data diri kamu untuk konfirmasi booking
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Nama */}
        <div>
          <label style={labelStyle}>Nama Lengkap</label>
          <input
            type="text"
            value={name}
            placeholder="Nama lengkap kamu"
            onChange={(e) => onChange("name", e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
          />
        </div>

        {/* No. WhatsApp */}
        <div>
          <label style={labelStyle}>Nomor WhatsApp</label>
          <input
            type="tel"
            value={phone}
            placeholder="08xxxxxxxxxx"
            onChange={(e) => onChange("phone", e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
          />
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.72rem",
              color: "#8B6A5A",
              marginTop: "4px",
            }}>
            Konfirmasi booking akan dikirim via WhatsApp
          </p>
        </div>

        {/* Catatan */}
        <div>
          <label style={labelStyle}>Catatan (opsional)</label>
          <textarea
            value={notes}
            placeholder="Ada permintaan khusus? Tulis di sini..."
            rows={3}
            onChange={(e) => onChange("notes", e.target.value)}
            style={{
              ...inputStyle,
              resize: "vertical" as const,
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Konfirmasi ─────────────────────────────────────────────────────

function Step4({
  form,
  submitting,
  onSubmit,
}: {
  form: BookingForm;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const service = BOOKABLE_SERVICES.find((s) => s.id === form.serviceId);

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "14px 0",
    borderBottom: "1px solid #EDD8CC",
  };

  const labelStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#8B6A5A",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  };

  const valueStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.9rem",
    color: "#2C1A0E",
    fontWeight: 500,
    textAlign: "right" as const,
  };

  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#2C1A0E",
          marginBottom: "6px",
        }}>
        Konfirmasi Booking
      </h2>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.85rem",
          color: "#8B6A5A",
          marginBottom: "24px",
        }}>
        Periksa kembali detail booking kamu
      </p>

      {/* Detail booking */}
      <div
        style={{
          background: "#FDFAF7",
          border: "1px solid #EDD8CC",
          borderRadius: "4px",
          padding: "0 20px",
          marginBottom: "24px",
        }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Layanan</span>
          <span style={valueStyle}>
            {service?.icon} {service?.name}
          </span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Durasi</span>
          <span style={valueStyle}>{service?.duration}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Tanggal</span>
          <span style={valueStyle}>
            {new Date(form.date).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Jam</span>
          <span style={valueStyle}>{form.time} WIB</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Nama</span>
          <span style={valueStyle}>{form.name}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>WhatsApp</span>
          <span style={valueStyle}>{form.phone}</span>
        </div>
        {form.notes && (
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <span style={labelStyle}>Catatan</span>
            <span style={{ ...valueStyle, maxWidth: "60%" }}>{form.notes}</span>
          </div>
        )}
        {!form.notes && (
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <span style={labelStyle}>Pembayaran</span>
            <span style={{ ...valueStyle, color: "#4CAF82" }}>
              Bayar di Tempat
            </span>
          </div>
        )}
      </div>

      {/* Total harga */}
      <div
        style={{
          background: "#6B3A2A",
          padding: "16px 20px",
          borderRadius: "4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.7)",
          }}>
          Estimasi Total
        </span>
        <span
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.2rem",
            fontWeight: 700,
            color: "#F5D49A",
          }}>
          {service ? formatRupiah(service.price) : "-"}
        </span>
      </div>

      {/* Info bayar di tempat */}
      <div
        style={{
          background: "rgba(76,175,130,0.08)",
          border: "1px solid rgba(76,175,130,0.2)",
          borderRadius: "4px",
          padding: "12px 16px",
          marginBottom: "24px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.8rem",
          color: "#3A9B6A",
          lineHeight: 1.6,
        }}>
        ✓ Pembayaran dilakukan di tempat saat kedatangan. Konfirmasi booking
        akan dikirim ke WhatsApp kamu.
      </div>

      {/* Tombol konfirmasi */}
      <button
        onClick={onSubmit}
        disabled={submitting}
        style={{
          width: "100%",
          background: submitting ? "#B8896A" : "#6B3A2A",
          color: "white",
          border: "none",
          padding: "16px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.9rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          cursor: submitting ? "not-allowed" : "pointer",
          borderRadius: "4px",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!submitting) e.currentTarget.style.background = "#C9922A";
        }}
        onMouseLeave={(e) => {
          if (!submitting) e.currentTarget.style.background = "#6B3A2A";
        }}>
        {submitting ? "Memproses..." : "Konfirmasi Booking"}
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function BookingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [step, setStep] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const [form, setForm] = useState<BookingForm>({
    serviceId: null,
    date: "",
    time: "",
    name: session?.user?.name ?? "",
    phone: "",
    notes: "",
  });

  function updateForm<K extends keyof BookingForm>(
    key: K,
    value: BookingForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Validasi per step
  function canProceed(): boolean {
    if (step === 0) return form.serviceId !== null;
    if (step === 1) return form.date !== "" && form.time !== "";
    if (step === 2) return form.name.trim() !== "" && form.phone.trim() !== "";
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    // TODO: Kirim ke API route POST /api/bookings
    // Simulasi delay network
    await new Promise((res) => setTimeout(res, 1500));
    setSubmitting(false);
    setSuccess(true);
  }

  // Loading state
  if (isPending) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          color: "#8B6A5A",
        }}>
        Memuat...
      </div>
    );
  }

  // Halaman sukses
  if (success) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          textAlign: "center" as const,
        }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🎉</div>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#2C1A0E",
            marginBottom: "12px",
          }}>
          Booking Berhasil!
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.9rem",
            color: "#8B6A5A",
            maxWidth: "380px",
            lineHeight: 1.7,
            marginBottom: "32px",
          }}>
          Booking kamu sudah tercatat. Konfirmasi akan dikirim ke WhatsApp{" "}
          <strong>{form.phone}</strong> dalam beberapa menit.
        </p>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "#6B3A2A",
            color: "white",
            border: "none",
            padding: "13px 32px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.875rem",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            cursor: "pointer",
            borderRadius: "4px",
          }}>
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: "100px",
        paddingBottom: "80px",
        background: "#FDF8F3",
      }}>
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "0 24px",
        }}>
        {/* Header */}
        <div style={{ textAlign: "center" as const, marginBottom: "40px" }}>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.22em",
              color: "#C9922A",
              textTransform: "uppercase" as const,
              marginBottom: "8px",
            }}>
            Booking Online
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "2rem",
              fontWeight: 700,
              color: "#2C1A0E",
              marginBottom: "8px",
            }}>
            Reservasi Layanan
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              justifyContent: "center",
            }}>
            <div
              style={{ width: "40px", height: "1px", background: "#EDD8CC" }}
            />
            <span style={{ color: "#C9922A" }}>+</span>
            <div
              style={{ width: "40px", height: "1px", background: "#EDD8CC" }}
            />
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Card */}
        <div
          style={{
            background: "white",
            border: "1px solid #EDD8CC",
            borderRadius: "8px",
            padding: "32px",
            boxShadow: "0 4px 24px rgba(107,58,42,0.06)",
          }}>
          {step === 0 && (
            <Step1
              selectedId={form.serviceId}
              onSelect={(id) => updateForm("serviceId", id)}
            />
          )}
          {step === 1 && (
            <Step2
              date={form.date}
              time={form.time}
              onDateChange={(d) => updateForm("date", d)}
              onTimeChange={(t) => updateForm("time", t)}
            />
          )}
          {step === 2 && (
            <Step3
              name={form.name}
              phone={form.phone}
              notes={form.notes}
              onChange={(field, value) => updateForm(field, value)}
            />
          )}
          {step === 3 && (
            <Step4
              form={form}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          )}

          {/* Navigasi antar step */}
          {step < 3 && (
            <div
              style={{
                display: "flex",
                justifyContent: step === 0 ? "flex-end" : "space-between",
                marginTop: "28px",
                paddingTop: "20px",
                borderTop: "1px solid #EDD8CC",
              }}>
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  style={{
                    background: "transparent",
                    border: "1px solid #EDD8CC",
                    color: "#8B6A5A",
                    padding: "11px 24px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    borderRadius: "4px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#C9922A")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#EDD8CC")
                  }>
                  ← Kembali
                </button>
              )}
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                style={{
                  background: canProceed() ? "#6B3A2A" : "#D4C4B8",
                  color: "white",
                  border: "none",
                  padding: "11px 28px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  cursor: canProceed() ? "pointer" : "not-allowed",
                  borderRadius: "4px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (canProceed())
                    e.currentTarget.style.background = "#C9922A";
                }}
                onMouseLeave={(e) => {
                  if (canProceed())
                    e.currentTarget.style.background = "#6B3A2A";
                }}>
                Lanjut →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
