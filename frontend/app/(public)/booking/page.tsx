"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { createBooking, getSalonServices } from "@/actions/booking";
import type { SalonService } from "@/actions/booking";

// ── Types ──────────────────────────────────────────────────────────────────

interface SelectedService {
  serviceId: number;
  serviceName: string;
  price: number;
  hourDuration: number;
  isVariable: boolean;
  date: string;
  time: string;
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

function StepIndicator({
  current,
  onChangeStep,
  isStepClickable,
}: {
  current: number;
  onChangeStep?: (step: number) => void;
  isStepClickable?: (step: number) => boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "40px" }}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        const isLast = i === STEPS.length - 1;
        const clickable = isStepClickable ? isStepClickable(i) : i <= current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div
              onClick={() => { if (clickable && onChangeStep) onChangeStep(i); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: clickable ? "pointer" : "not-allowed" }}
            >
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: done ? "#6B3A2A" : active ? "#C9922A" : "transparent",
                border: `2px solid ${done ? "#6B3A2A" : active ? "#C9922A" : "#EDD8CC"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done || active ? "white" : "#C4A882",
                fontSize: done ? "0.75rem" : "0.8rem", fontWeight: 600,
                transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
                opacity: clickable ? 1 : 0.5,
                transform: active ? "scale(1.05)" : "scale(1)",
                boxShadow: active ? "0 4px 10px rgba(201,146,42,0.2)" : "none",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: "0.68rem", fontFamily: "'DM Sans', sans-serif",
                color: active ? "#6B3A2A" : done ? "#C9922A" : "#C4A882",
                fontWeight: active ? 600 : 400, whiteSpace: "nowrap",
                opacity: clickable ? 1 : 0.6,
              }}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div style={{ width: "60px", height: "2px", background: done ? "#6B3A2A" : "#EDD8CC", marginBottom: "22px", transition: "background 0.3s", opacity: clickable ? 1 : 0.6 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Pilih Layanan (Multi-Select) ───────────────────────────────────

function Step1({
  selectedServices, onToggle, services, loading,
}: {
  selectedServices: SelectedService[];
  onToggle: (svc: SalonService) => void;
  services: SalonService[];
  loading: boolean;
}) {
  const ICONS: Record<string, string> = {
    "Hair Treatment": "✂️",
    "Makeup & Rias": "💄",
    "Nail Care": "💅",
    "Facial & Skincare": "🌸",
    "Rebonding": "💫",
  };

  const selectedIds = new Set(selectedServices.map((s) => s.serviceId));
  const maxReached = selectedServices.length >= 5;

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
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#8B6A5A", marginBottom: "8px" }}>
        Pilih satu atau lebih layanan (maks. 5). Tiap layanan bisa dijadwalkan di hari/jam berbeda.
      </p>

      {selectedServices.length > 0 && (
        <div style={{ background: "rgba(201,146,42,0.08)", border: "1px solid rgba(201,146,42,0.25)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#8B6A5A" }}>
          ✓ <strong style={{ color: "#6B3A2A" }}>{selectedServices.length} layanan</strong> dipilih
          {maxReached && <span style={{ color: "#C9922A", marginLeft: "8px" }}>— batas maksimum tercapai</span>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {services.map((svc) => {
          const isSelected = selectedIds.has(svc.id);
          const isDisabled = !isSelected && maxReached;
          return (
            <button
              key={svc.id}
              onClick={() => onToggle(svc)}
              disabled={isDisabled}
              style={{
                background: isSelected ? "#FDF0E6" : isDisabled ? "#F5F0EB" : "white",
                border: `2px solid ${isSelected ? "#C9922A" : "#EDD8CC"}`,
                padding: "18px", textAlign: "left", cursor: isDisabled ? "not-allowed" : "pointer",
                borderRadius: "8px", transition: "all 0.2s", position: "relative",
                opacity: isDisabled ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (!isSelected && !isDisabled) e.currentTarget.style.borderColor = "#C9922A"; }}
              onMouseLeave={(e) => { if (!isSelected && !isDisabled) e.currentTarget.style.borderColor = "#EDD8CC"; }}
            >
              {isSelected && (
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

// ── Step 2: Pilih Jadwal Per Layanan ───────────────────────────────────────

function Step2({
  selectedServices, onUpdateSchedule,
}: {
  selectedServices: SelectedService[];
  onUpdateSchedule: (serviceId: number, field: "date" | "time", value: string) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [slotDataMap, setSlotDataMap] = useState<Record<number, SlotData | null>>({});
  const [slotLoadingMap, setSlotLoadingMap] = useState<Record<number, boolean>>({});

  const activeSvc = selectedServices[activeIdx];

  useEffect(() => {
    if (!activeSvc?.date) return;
    setSlotLoadingMap((prev) => ({ ...prev, [activeSvc.serviceId]: true }));
    fetch(`/api/bookings/slots?date=${activeSvc.date}`)
      .then((r) => r.json())
      .then((data) => setSlotDataMap((prev) => ({
        ...prev,
        [activeSvc.serviceId]: {
          available: data.available ?? [],
          booked: data.booked ?? [],
          closed: data.closed ?? false,
          message: data.message,
        },
      })))
      .catch(() => setSlotDataMap((prev) => ({ ...prev, [activeSvc.serviceId]: null })))
      .finally(() => setSlotLoadingMap((prev) => ({ ...prev, [activeSvc.serviceId]: false })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSvc?.date, activeSvc?.serviceId]);

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>
        Atur Jadwal Tiap Layanan
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#8B6A5A", marginBottom: "20px" }}>
        Tiap layanan bisa dijadwalkan di tanggal dan jam yang berbeda.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {selectedServices.map((svc, i) => {
          const done = svc.date && svc.time;
          return (
            <button
              key={svc.serviceId}
              onClick={() => setActiveIdx(i)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: `2px solid ${activeIdx === i ? "#C9922A" : done ? "#6B3A2A" : "#EDD8CC"}`,
                background: activeIdx === i ? "#FDF0E6" : done ? "rgba(107,58,42,0.06)" : "white",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: activeIdx === i ? "#6B3A2A" : done ? "#6B3A2A" : "#8B6A5A",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {done ? "✓ " : `${i + 1}. `}{svc.serviceName}
            </button>
          );
        })}
      </div>

      {/* Active service schedule form */}
      {activeSvc && (
        <div style={{ background: "#FDFAF7", border: "1px solid #EDD8CC", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "16px" }}>
            Jadwal: {activeSvc.serviceName}
          </div>

          {/* Tanggal */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Tanggal
            </label>
            <input
              type="date"
              value={activeSvc.date}
              min={getTodayString()}
              max={getMaxDateString()}
              onChange={(e) => {
                onUpdateSchedule(activeSvc.serviceId, "date", e.target.value);
                onUpdateSchedule(activeSvc.serviceId, "time", "");
              }}
              style={{ width: "100%", padding: "11px 14px", border: "1px solid #EDD8CC", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#2C1A0E", background: "white", outline: "none" }}
            />
          </div>

          {/* Slot jam */}
          <div>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Jam Tersedia
            </label>
            {slotLoadingMap[activeSvc.serviceId] && (
              <div style={{ padding: "20px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}>
                Memuat slot waktu...
              </div>
            )}
            {!slotLoadingMap[activeSvc.serviceId] && !activeSvc.date && (
              <div style={{ padding: "16px", background: "white", border: "1px dashed #EDD8CC", borderRadius: "8px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}>
                Pilih tanggal terlebih dahulu
              </div>
            )}
            {!slotLoadingMap[activeSvc.serviceId] && slotDataMap[activeSvc.serviceId]?.closed && (
              <div style={{ padding: "16px", background: "rgba(192,80,96,0.06)", border: "1px solid rgba(192,80,96,0.2)", borderRadius: "8px", textAlign: "center", color: "#C05060", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}>
                🚫 {slotDataMap[activeSvc.serviceId]?.message ?? "Salon tidak beroperasi pada tanggal ini"}
              </div>
            )}
            {!slotLoadingMap[activeSvc.serviceId] && activeSvc.date && slotDataMap[activeSvc.serviceId] && !slotDataMap[activeSvc.serviceId]?.closed && (
              <>
                {(slotDataMap[activeSvc.serviceId]?.available?.length ?? 0) === 0 ? (
                  <div style={{ padding: "16px", background: "rgba(192,80,96,0.06)", border: "1px solid rgba(192,80,96,0.2)", borderRadius: "8px", textAlign: "center", color: "#C05060", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}>
                    Semua slot sudah penuh untuk tanggal ini
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    {slotDataMap[activeSvc.serviceId]?.available?.map((slot) => {
                      // Helper to convert "HH:MM" to minutes from midnight
                      const toMins = (t: string) => {
                        const [h, m] = t.split(":").map(Number);
                        return h * 60 + m;
                      };

                      const activeStart = toMins(slot);
                      const activeEnd = activeStart + (activeSvc.hourDuration || 0.5) * 60;

                      const isOverlapping = selectedServices.some((svc) => {
                        if (svc.serviceId === activeSvc.serviceId || svc.date !== activeSvc.date || !svc.time) {
                          return false;
                        }
                        const otherStart = toMins(svc.time);
                        const otherEnd = otherStart + (svc.hourDuration || 0.5) * 60;
                        return activeStart < otherEnd && otherStart < activeEnd;
                      });

                      return (
                        <button
                          key={slot}
                          disabled={isOverlapping}
                          title={isOverlapping ? "Dipilih di keranjang" : undefined}
                          onClick={() => !isOverlapping && onUpdateSchedule(activeSvc.serviceId, "time", slot)}
                          style={{
                            padding: "10px 6px",
                            border: isOverlapping 
                              ? "1px dashed #D4B8C0"
                              : `2px solid ${activeSvc.time === slot ? "#C9922A" : "#EDD8CC"}`,
                            background: isOverlapping
                              ? "rgba(220, 200, 205, 0.2)"
                              : activeSvc.time === slot ? "#FDF0E6" : "white",
                            borderRadius: "8px",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "0.8rem",
                            fontWeight: activeSvc.time === slot ? 600 : 400,
                            color: isOverlapping
                              ? "#A08088"
                              : activeSvc.time === slot ? "#6B3A2A" : "#2C1A0E",
                            cursor: isOverlapping ? "not-allowed" : "pointer",
                            textDecoration: isOverlapping ? "line-through" : "none",
                            opacity: isOverlapping ? 0.6 : 1,
                            transition: "all 0.15s",
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                    {slotDataMap[activeSvc.serviceId]?.booked?.map((slot) => (
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
                  ✦ Slot yang dicoret sudah dipesan atau dipilih di keranjang
                </p>
              </>
            )}
          </div>

          {/* Navigation hint */}
          {activeIdx < selectedServices.length - 1 && activeSvc.date && activeSvc.time && (
            <button
              onClick={() => setActiveIdx((i) => i + 1)}
              style={{ marginTop: "16px", padding: "10px 20px", background: "#6B3A2A", color: "white", border: "none", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
            >
              Layanan Berikutnya →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Catatan ────────────────────────────────────────────────────────

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
      <div style={{ background: "rgba(201,146,42,0.06)", border: "1px solid rgba(201,146,42,0.2)", borderRadius: "8px", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #6B3A2A, #C9922A)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>
          {userName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#2C1A0E" }}>{userName}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: "#8B6A5A" }}>{userEmail}</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#C9922A", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
          ✓ Terverifikasi
        </div>
      </div>
      <div>
        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
          Catatan untuk Salon <span style={{ color: "#8B6A5A", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opsional)</span>
        </label>
        <textarea
          value={notes}
          placeholder="Contoh: ada alergi tertentu, request khusus, dll..."
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", padding: "11px 14px", border: "1px solid #EDD8CC", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#2C1A0E", background: "#FDFAF7", outline: "none", resize: "vertical", lineHeight: 1.6 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
        />
      </div>
    </div>
  );
}

// ── Step 4: Konfirmasi ─────────────────────────────────────────────────────

function Step4({
  selectedServices, notes, submitting, onSubmit, error, userName, userPhone,
}: {
  selectedServices: SelectedService[];
  notes: string;
  submitting: boolean;
  onSubmit: () => void;
  error: string;
  userName: string;
  userPhone: string;
}) {
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const hasVariable = selectedServices.some((s) => s.isVariable);

  const formatDateTime = (date: string, time: string) => {
    const d = new Date(`${date}T${time}:00`);
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + ` – ${time} WIB`;
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>
        Konfirmasi Booking
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#8B6A5A", marginBottom: "24px" }}>
        Periksa kembali detail booking kamu
      </p>

      {/* Services List */}
      <div style={{ background: "#FDFAF7", border: "1px solid #EDD8CC", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
        {selectedServices.map((svc, i) => (
          <div key={svc.serviceId} style={{ padding: "14px 18px", borderBottom: i < selectedServices.length - 1 ? "1px solid #EDD8CC" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", fontWeight: 600, color: "#2C1A0E" }}>
                {svc.serviceName}
              </span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "#6B3A2A", whiteSpace: "nowrap", marginLeft: "12px" }}>
                {svc.isVariable ? "Mulai " : ""}{formatRupiah(svc.price)}
              </span>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: "#8B6A5A" }}>
              📅 {formatDateTime(svc.date, svc.time)} · ⏱ {svc.hourDuration} jam
            </div>
          </div>
        ))}
      </div>

      {/* Customer Info */}
      <div style={{ background: "#FDFAF7", border: "1px solid #EDD8CC", borderRadius: "8px", padding: "0 18px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #EDD8CC" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#8B6A5A", textTransform: "uppercase", letterSpacing: "0.06em" }}>Nama</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#2C1A0E", fontWeight: 500 }}>{userName}</span>
        </div>
        {userPhone && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #EDD8CC" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#8B6A5A", textTransform: "uppercase", letterSpacing: "0.06em" }}>WhatsApp</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#2C1A0E", fontWeight: 500 }}>{userPhone}</span>
          </div>
        )}
        {notes && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #EDD8CC" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#8B6A5A", textTransform: "uppercase", letterSpacing: "0.06em" }}>Catatan</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#2C1A0E", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{notes}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#8B6A5A", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pembayaran</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#5A9E7A", fontWeight: 600 }}>QRIS Statis</span>
        </div>
      </div>

      {/* Total */}
      <div style={{ background: "#6B3A2A", padding: "14px 18px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
          {hasVariable ? "Estimasi Total (Mulai Dari)" : "Estimasi Total"}
        </span>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: "#F5D49A" }}>
          {formatRupiah(total)}
        </span>
      </div>

      {hasVariable && (
        <div style={{ background: "rgba(201,146,42,0.08)", border: "1px solid rgba(201,146,42,0.25)", borderRadius: "8px", padding: "11px 14px", marginBottom: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#8B6A5A", lineHeight: 1.6 }}>
          <strong>Catatan:</strong> Terdapat layanan dengan harga bervariasi. Harga final ditentukan di salon setelah konsultasi selesai.
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(192,80,96,0.07)", border: "1px solid rgba(192,80,96,0.2)", borderRadius: "8px", padding: "11px 14px", marginBottom: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#C05060" }}>
          ⚠️ {error}
        </div>
      )}

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
        {submitting ? "Memproses..." : `Konfirmasi ${selectedServices.length} Booking`}
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function BookingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [step, setStep]             = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [notes, setNotes]           = useState("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

  const [services, setServices]           = useState<SalonService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    getSalonServices().then((res) => {
      if (res.success && res.data) setServices(res.data);
      setServicesLoading(false);
    });
  }, []);

  function toggleService(svc: SalonService) {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.serviceId === svc.id);
      if (exists) return prev.filter((s) => s.serviceId !== svc.id);
      if (prev.length >= 5) return prev;
      return [...prev, {
        serviceId: svc.id,
        serviceName: svc.service_name,
        price: svc.price,
        hourDuration: svc.hour_duration,
        isVariable: !!svc.is_price_variable,
        date: "",
        time: "",
      }];
    });
  }

  function updateSchedule(serviceId: number, field: "date" | "time", value: string) {
    setSelectedServices((prev) =>
      prev.map((s) => s.serviceId === serviceId ? { ...s, [field]: value } : s)
    );
  }

  function allSchedulesFilled() {
    return selectedServices.every((s) => s.date && s.time);
  }

  function canProceed(): boolean {
    if (step === 0) return selectedServices.length > 0;
    if (step === 1) return allSchedulesFilled();
    if (step === 2) return true;
    return true;
  }

  async function handleSubmit() {
    if (!allSchedulesFilled()) return;
    setSubmitting(true);
    setError("");

    const service_schedules = selectedServices.map((s) => ({
      service_id: s.serviceId,
      booking_datetime: `${s.date}T${s.time}:00+07:00`,
    }));

    try {
      const result = await createBooking({
        service_schedules,
        payment_method: "qris",
      });

      if (result.success && result.data) {
        if (result.data.transactionId) {
          router.push(`/invoice/${result.data.transactionId}`);
        }
      } else {
        setError(result.error ?? "Gagal membuat booking. Silakan coba lagi.");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isPending) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#8B6A5A" }}>
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
            <button style={{ background: "transparent", color: "#6B3A2A", border: "1.5px solid #6B3A2A", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: "8px" }}>
              Daftar Akun
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const userName  = session.user.name ?? "";
  const userEmail = session.user.email ?? "";
  const userPhone = (session.user as { phone_number?: string }).phone_number ?? "";

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

        <StepIndicator
          current={step}
          onChangeStep={(s) => setStep(s)}
          isStepClickable={(i) => {
            if (i === 0) return true;
            if (i === 1) return selectedServices.length > 0;
            if (i === 2) return selectedServices.length > 0 && allSchedulesFilled();
            if (i === 3) return selectedServices.length > 0 && allSchedulesFilled();
            return false;
          }}
        />

        {/* Card */}
        <div style={{ background: "white", border: "1px solid #EDD8CC", borderRadius: "12px", padding: "32px", boxShadow: "0 4px 24px rgba(107,58,42,0.06)" }}>
          {step === 0 && (
            <Step1
              selectedServices={selectedServices}
              onToggle={toggleService}
              services={services}
              loading={servicesLoading}
            />
          )}
          {step === 1 && (
            <Step2
              selectedServices={selectedServices}
              onUpdateSchedule={updateSchedule}
            />
          )}
          {step === 2 && (
            <Step3
              notes={notes}
              onChange={setNotes}
              userName={userName}
              userEmail={userEmail}
            />
          )}
          {step === 3 && (
            <Step4
              selectedServices={selectedServices}
              notes={notes}
              submitting={submitting}
              onSubmit={handleSubmit}
              error={error}
              userName={userName}
              userPhone={userPhone}
            />
          )}

          {/* Navigasi */}
          {step < 3 && (
            <div style={{ display: "flex", justifyContent: step === 0 ? "flex-end" : "space-between", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #EDD8CC" }}>
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  style={{ background: "transparent", border: "1px solid #EDD8CC", color: "#8B6A5A", padding: "10px 22px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", cursor: "pointer", borderRadius: "8px" }}
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