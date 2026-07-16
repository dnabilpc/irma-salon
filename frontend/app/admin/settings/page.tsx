"use client";

// app/admin/settings/page.tsx

import { useState, useEffect, useCallback } from "react";

interface Settings {
  // VTO
  vto_limit_default: string;
  vto_reset_interval_days: string;
  vto_milestones_config: string;
  vto_bonus_expiry_days: string;
  // Salon info
  salon_name: string;
  salon_whatsapp: string;
  salon_instagram: string;
  salon_facebook: string;
  salon_tiktok: string;
  salon_email: string;
  salon_address: string;
  salon_maps_url: string;
  salon_open_description: string;
  // QRIS
  qris_payload: string;
}

interface MilestoneTier {
  rentals_count: number;
  bonus_limit: number;
}

interface WeeklySchedule {
  day_of_week: string;
  open_time: string;
  close_time: string;
  isOpen: boolean;
}

interface ClosingTime {
  id: number;
  start_datetime: string;
  end_datetime: string;
  reason: string;
}

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu"
};

const DEFAULT_SETTINGS: Settings = {
  vto_limit_default: "5",
  vto_reset_interval_days: "14",
  vto_milestones_config: JSON.stringify([
    { rentals_count: 1, bonus_limit: 2 },
    { rentals_count: 3, bonus_limit: 4 },
    { rentals_count: 6, bonus_limit: 6 },
    { rentals_count: 10, bonus_limit: 10 }
  ]),
  vto_bonus_expiry_days: "30",
  salon_name: "",
  salon_whatsapp: "",
  salon_instagram: "",
  salon_facebook: "",
  salon_tiktok: "",
  salon_email: "",
  salon_address: "",
  salon_maps_url: "",
  salon_open_description: "",
  qris_payload: "00020101021126580016ID.CO.QRIS.WWW01189360091400000000005204599953033605802ID5918RUMAH CANTIK IRMA6008SURABAYA6304B76B",
};

function SectionTitle({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "#3A1A28" }}>
          {title}
        </span>
      </div>
      <p style={{ fontSize: "12px", color: "#B08090", fontFamily: "'DM Sans', sans-serif", marginLeft: "28px" }}>
        {sub}
      </p>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder = "", hint = "", prefix = "", readOnly = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; hint?: string; prefix?: string; readOnly?: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: prefix ? "9px 12px 9px 0" : "9px 12px",
    border: "none", outline: "none",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem",
    color: readOnly ? "#8B6A5A" : "#2C1A0E", background: "transparent",
  };

  return (
    <div>
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", fontWeight: 600, color: "#7A2848", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #F0D9E0", borderRadius: "8px", background: readOnly ? "#FAF3F5" : "white", overflow: "hidden" }}
        onFocus={(e) => { if (!readOnly) e.currentTarget.style.borderColor = "#C4728E"; }}
        onBlur={(e) => { if (!readOnly) e.currentTarget.style.borderColor = "#F0D9E0"; }}
      >
        {prefix && (
          <span style={{ padding: "9px 10px 9px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "#B08090", flexShrink: 0, borderRight: "1px solid #F0D9E0", marginRight: "0" }}>
            {prefix}
          </span>
        )}
        {type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            disabled={readOnly}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, paddingLeft: "12px" }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            disabled={readOnly}
            style={{ ...inputStyle, paddingLeft: prefix ? "10px" : "12px" }}
          />
        )}
      </div>
      {hint && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "#B08090", marginTop: "4px" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

import QRCode from "qrcode";
import { generateDynamicQrisPayload } from "@/lib/qris";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"vto" | "salon" | "schedule" | "qris">("vto");

  // QRIS dynamic preview test states
  const [testAmount, setTestAmount] = useState<string>("150000");
  const [testQrDataUrl, setTestQrDataUrl] = useState<string>("");
  const [testDynamicPayload, setTestDynamicPayload] = useState<string>("");

  // Weekly Schedules & Holidays
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [closingTimes, setClosingTimes] = useState<ClosingTime[]>([]);
  const [newClosing, setNewClosing] = useState({ start_date: "", end_date: "", reason: "" });
  const [addingClosing, setAddingClosing] = useState(false);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadSettingsData = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings((prev) => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => { setLoading(false); showToast("Gagal memuat settings.", false); });

    // Fetch dynamic description of open hours
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.salon_open_description) {
          setSettings((prev) => ({ ...prev, salon_open_description: data.salon_open_description }));
        }
      })
      .catch((err) => console.error("Failed to load dynamic open description:", err));
  }, [showToast]);

  const loadScheduleData = useCallback(async () => {
    setLoadingSchedule(true);
    try {
      // 1. Fetch weekly schedules
      const openRes = await fetch("/api/admin/opening-time");
      const openData = await openRes.json();
      
      const mappedSchedules = DAYS_OF_WEEK.map((day) => {
        const row = openData.find((r: any) => r.day_of_week === day);
        const formatTime = (t: string | undefined) => {
          if (!t) return "09:00";
          const parts = t.split("+")[0].split(":");
          return `${parts[0]}:${parts[1]}`;
        };
        return {
          day_of_week: day,
          open_time: formatTime(row?.open_time),
          close_time: formatTime(row?.close_time),
          isOpen: !!row,
        };
      });
      setWeeklySchedules(mappedSchedules);

      // 2. Fetch custom closing times
      const closeRes = await fetch("/api/admin/closing-time");
      const closeData = await closeRes.json();
      setClosingTimes(closeData);
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat jadwal & hari libur.", false);
    } finally {
      setLoadingSchedule(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  useEffect(() => {
    if (activeTab === "schedule") {
      loadScheduleData();
    }
  }, [activeTab, loadScheduleData]);

  function update(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    // Validate VTO settings
    if (!/^\d+$/.test(settings.vto_limit_default)) {
      showToast("Batas VTO per User harus berupa angka bulat positif", false);
      return;
    }
    if (!/^\d+$/.test(settings.vto_reset_interval_days)) {
      showToast("Periode Reset Kuota VTO harus berupa angka bulat positif", false);
      return;
    }

    const vtoLimitVal = parseInt(settings.vto_limit_default, 10);
    const vtoDaysVal = parseInt(settings.vto_reset_interval_days, 10);

    if (vtoLimitVal < 1 || vtoLimitVal > 10000) {
      showToast("Batas VTO per User harus bernilai antara 1 dan 10000", false);
      return;
    }

    if (vtoDaysVal < 1 || vtoDaysVal > 30) {
      showToast("Periode Reset Kuota VTO harus bernilai antara 1 dan 30 hari", false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");
      showToast("Pengaturan berhasil disimpan!", true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal menyimpan.", false);
    } finally {
      setSaving(false);
    }
  }

  // Weekly Schedule Updates
  const handleScheduleChange = (day: string, field: "isOpen" | "open_time" | "close_time", val: any) => {
    setWeeklySchedules((prev) =>
      prev.map((s) => (s.day_of_week === day ? { ...s, [field]: val } : s))
    );
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const schedules = weeklySchedules
        .filter((s) => s.isOpen)
        .map((s) => ({
          day_of_week: s.day_of_week,
          open_time: `${s.open_time}:00+07`,
          close_time: `${s.close_time}:00+07`,
        }));

      const res = await fetch("/api/admin/opening-time", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan jadwal.");
      showToast("Jadwal operasional berhasil diperbarui!", true);
      
      // Update dynamic schedule description on Info Salon tab
      const dynRes = await fetch("/api/settings");
      const dynData = await dynRes.json();
      if (dynData.salon_open_description) {
        setSettings((prev) => ({ ...prev, salon_open_description: dynData.salon_open_description }));
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal menyimpan jadwal.", false);
    } finally {
      setSavingSchedule(false);
    }
  };

  // Holidays
  const handleAddClosing = async () => {
    if (!newClosing.start_date || !newClosing.end_date || !newClosing.reason) {
      showToast("Lengkapi data libur (tanggal mulai, selesai, dan alasan).", false);
      return;
    }
    if (newClosing.end_date < newClosing.start_date) {
      showToast("Tanggal selesai tidak boleh sebelum tanggal mulai.", false);
      return;
    }
    setAddingClosing(true);
    try {
      const res = await fetch("/api/admin/closing-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClosing),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambahkan.");
      showToast("Hari libur ditambahkan & pengumuman WA dikirim!", true);
      setNewClosing({ start_date: "", end_date: "", reason: "" });
      loadScheduleData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal menambahkan.", false);
    } finally {
      setAddingClosing(false);
    }
  };

  const handleDeleteClosing = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus hari libur ini? Pelanggan tidak akan menerima notifikasi pembatalan libur.")) return;
    try {
      const res = await fetch(`/api/admin/closing-time/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus.");
      showToast("Hari libur berhasil dihapus.", true);
      loadScheduleData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal menghapus.", false);
    }
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "72px", right: "24px", zIndex: 2000,
          background: "white", border: `1.5px solid ${toast.ok ? "rgba(90,158,122,0.5)" : "rgba(192,80,96,0.5)"}`,
          color: toast.ok ? "#3D7A5A" : "#C05060",
          padding: "12px 20px", borderRadius: "10px",
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600,
          boxShadow: "0 8px 24px rgba(196,114,142,0.15)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
            Pengaturan
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#B09080" }}>Konfigurasi Virtual Try-On, informasi salon, dan jadwal operasional</p>
        </div>
        {activeTab !== "schedule" && (
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              background: saving ? "#C4A882" : "#C4788A", color: "white", border: "none",
              padding: "10px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem",
              fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", borderRadius: "10px", transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#A85070"; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#C4788A"; }}
          >
            {saving ? "Menyimpan..." : "💾 Simpan Pengaturan"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #F0D9E0" }}>
        {([
          { key: "vto", label: "⚙️ Virtual Try-On" },
          { key: "salon", label: "🏪 Info Salon" },
          { key: "schedule", label: "📅 Jadwal & Hari Libur" },
          { key: "qris", label: "📱 QRIS Dinamis" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              background: "none", border: "none",
              borderBottom: activeTab === key ? "2px solid #C4788A" : "2px solid transparent",
              color: activeTab === key ? "#C4788A" : "#B09080",
              padding: "10px 20px",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem",
              fontWeight: activeTab === key ? 600 : 400,
              cursor: "pointer", transition: "all 0.2s", marginBottom: "-1px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#C4788A", fontFamily: "'DM Sans', sans-serif" }}>
          Memuat pengaturan...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", maxWidth: "720px" }}>

          {/* ── Tab: VTO ── */}
          {activeTab === "vto" && (
            <div className="admin-card" style={{ padding: "24px" }}>
              <SectionTitle icon="✨" title="Konfigurasi Virtual Try-On & Benefit Sewa" sub="Atur limit kuota dasar, periode reset, serta reward bonus VTO dari penyelesaian sewa baju" />

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <Field
                  label="Batas VTO Dasar per User"
                  value={settings.vto_limit_default}
                  onChange={(v) => update("vto_limit_default", v)}
                  type="number"
                  placeholder="5"
                  hint="Jumlah maksimal penggunaan Virtual Try-On dasar per user dalam satu periode reset."
                />
                <Field
                  label="Interval Reset (hari)"
                  value={settings.vto_reset_interval_days}
                  onChange={(v) => update("vto_reset_interval_days", v)}
                  type="number"
                  placeholder="14"
                  hint="Setiap berapa hari kuota VTO direset secara otomatis. Default: 14 hari (2 minggu)."
                />
                <Field
                  label="Batas Hari Inaktif Reset Bonus VTO (hari)"
                  value={settings.vto_bonus_expiry_days}
                  onChange={(v) => update("vto_bonus_expiry_days", v)}
                  type="number"
                  placeholder="30"
                  hint="Durasi (hari) pelanggan tidak melakukan sewa baru sebelum bonus VTO hangus/reset ke limit dasar. (Misal: 30 hari). Isi 0 untuk menonaktifkan masa hangus."
                />

                {/* Section Milestone Tiers */}
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#3A1A28", fontFamily: "'DM Sans', sans-serif" }}>
                        🎁 Tier Benefit Bonus Limit VTO (Berdasarkan Penyelesaian Sewa)
                      </label>
                      <p style={{ fontSize: "0.76rem", color: "#B08090", margin: "2px 0 0 0" }}>
                        Pengaturan bertahap tambahan kuota VTO berdasarkan total transaksi penyewaan baju berstatus selesai/lunas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const list = JSON.parse(settings.vto_milestones_config || "[]");
                          const lastRent = list.length > 0 ? list[list.length - 1].rentals_count + 3 : 1;
                          const lastBonus = list.length > 0 ? list[list.length - 1].bonus_limit + 2 : 2;
                          list.push({ rentals_count: lastRent, bonus_limit: lastBonus });
                          update("vto_milestones_config", JSON.stringify(list));
                        } catch {
                          update("vto_milestones_config", JSON.stringify([{ rentals_count: 1, bonus_limit: 2 }]));
                        }
                      }}
                      style={{
                        background: "rgba(196,114,142,0.12)",
                        border: "1px solid rgba(196,114,142,0.3)",
                        color: "#7A2848",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ➕ Tambah Tier Milestone
                    </button>
                  </div>

                  <div style={{ border: "1px solid #F0D9E0", borderRadius: "10px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                      <thead>
                        <tr style={{ background: "#FDF8FA", borderBottom: "1px solid #F0D9E0", textAlign: "left", color: "#7A2848", fontWeight: 600 }}>
                          <th style={{ padding: "10px 14px", width: "80px" }}>Tier #</th>
                          <th style={{ padding: "10px 14px" }}>Minimal Penyelesaian Sewa (kali)</th>
                          <th style={{ padding: "10px 14px" }}>Tambahan Bonus Limit VTO (+ Limit)</th>
                          <th style={{ padding: "10px 14px", width: "70px", textAlign: "center" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let milestones: MilestoneTier[] = [];
                          try {
                            milestones = JSON.parse(settings.vto_milestones_config || "[]");
                          } catch {}
                          if (!Array.isArray(milestones) || milestones.length === 0) {
                            milestones = [
                              { rentals_count: 1, bonus_limit: 2 },
                              { rentals_count: 3, bonus_limit: 4 },
                              { rentals_count: 6, bonus_limit: 6 },
                              { rentals_count: 10, bonus_limit: 10 }
                            ];
                          }
                          return milestones.map((m, idx) => (
                            <tr key={idx} style={{ borderBottom: idx < milestones.length - 1 ? "1px solid #F0D9E0" : "none" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 700, color: "#C4728E" }}>
                                Tier {idx + 1}
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <input
                                  type="number"
                                  min={1}
                                  value={m.rentals_count}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                    const updated = milestones.map((item, i) => i === idx ? { ...item, rentals_count: val } : item);
                                    update("vto_milestones_config", JSON.stringify(updated));
                                  }}
                                  style={{ width: "90px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #E8C0D0", fontSize: "0.82rem", fontWeight: 600 }}
                                />
                                <span style={{ marginLeft: "8px", color: "#B08090", fontSize: "0.78rem" }}>sewa selesai</span>
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <input
                                  type="number"
                                  min={1}
                                  value={m.bonus_limit}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                    const updated = milestones.map((item, i) => i === idx ? { ...item, bonus_limit: val } : item);
                                    update("vto_milestones_config", JSON.stringify(updated));
                                  }}
                                  style={{ width: "90px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #E8C0D0", fontSize: "0.82rem", fontWeight: 700, color: "#1A7A4A" }}
                                />
                                <span style={{ marginLeft: "8px", color: "#1A7A4A", fontWeight: 600, fontSize: "0.78rem" }}>+ limit kuota VTO</span>
                              </td>
                              <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = milestones.filter((_, i) => i !== idx);
                                    update("vto_milestones_config", JSON.stringify(updated));
                                  }}
                                  style={{ background: "none", border: "none", color: "#D94060", cursor: "pointer", fontSize: "1rem" }}
                                  title="Hapus Tier"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Preview info */}
                <div style={{ background: "rgba(196,120,138,0.06)", border: "1px solid #F0D9E0", borderRadius: "10px", padding: "14px 16px", marginTop: "10px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#7A2848", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginBottom: "8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Preview Kebijakan VTO & Benefit
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#8A4060", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, margin: 0 }}>
                    Setiap user baru mendapat kuota dasar <strong>{settings.vto_limit_default || "5"} kali</strong> per <strong>{settings.vto_reset_interval_days || "14"} hari</strong>.
                    Setiap kali user menyelesaikan transaksi sewa baju, mereka memperoleh tambahan bonus kuota VTO sesuai tingkatan milestone yang dicapai.
                    Jika pelanggan inaktif sewa lebih dari <strong>{settings.vto_bonus_expiry_days || "30"} hari</strong>, bonus kuota VTO akan direset kembali ke kuota dasar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Salon ── */}
          {activeTab === "salon" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Info dasar */}
              <div className="admin-card" style={{ padding: "24px" }}>
                <SectionTitle icon="🏪" title="Informasi Dasar Salon" sub="Nama dan alamat dasar salon" />
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Field label="Nama Salon" value={settings.salon_name} onChange={(v) => update("salon_name", v)} placeholder="Salon Rumah Cantik Irma" />
                  <Field label="Alamat Lengkap" value={settings.salon_address} onChange={(v) => update("salon_address", v)} placeholder="Graha Suko Indah B-1, Sukodono, Sidoarjo" type="textarea" />
                  
                  {/* Dynamic Jam Operasional Display */}
                  <Field 
                    label="Jam Operasional (Terformat)" 
                    value={settings.salon_open_description || "Tutup"} 
                    readOnly={true} 
                    hint="Teks ini dihasilkan secara dinamis berdasarkan data Opening Time di tab 'Jadwal & Hari Libur'."
                  />
                  
                  <Field label="Google Maps URL" value={settings.salon_maps_url} onChange={(v) => update("salon_maps_url", v)} placeholder="https://maps.google.com/..." hint="Link langsung ke lokasi salon di Google Maps." />
                </div>
              </div>

              {/* Kontak */}
              <div className="admin-card" style={{ padding: "24px" }}>
                <SectionTitle icon="📱" title="Kontak & Media Sosial" sub="Nomor dan akun media sosial salon" />
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Field label="WhatsApp" value={settings.salon_whatsapp} onChange={(v) => update("salon_whatsapp", v)} placeholder="085174481660" prefix="+" hint="Nomor WhatsApp tanpa tanda + atau 0 di depan. Contoh: 6285174481660" />
                  <Field label="Email" value={settings.salon_email} onChange={(v) => update("salon_email", v)} placeholder="info@salonirma.com" type="email" />
                  <Field label="Instagram" value={settings.salon_instagram} onChange={(v) => update("salon_instagram", v)} placeholder="salonrumahcantik" prefix="@" />
                  <Field label="Facebook" value={settings.salon_facebook} onChange={(v) => update("salon_facebook", v)} placeholder="URL atau nama page" />
                  <Field label="TikTok" value={settings.salon_tiktok} onChange={(v) => update("salon_tiktok", v)} placeholder="salonrumahcantik" prefix="@" />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Schedule & Holidays ── */}
          {activeTab === "schedule" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Weekly Opening Hours */}
              <div className="admin-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <SectionTitle icon="⏰" title="Jam Operasional Mingguan" sub="Atur hari operasional serta jam buka & tutup salon" />
                  <button
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule || loadingSchedule}
                    style={{
                      background: "#6B3A2A", color: "white", border: "none",
                      padding: "8px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem",
                      fontWeight: 600, cursor: "pointer", borderRadius: "8px", transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#542D20")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#6B3A2A")}
                  >
                    {savingSchedule ? "Menyimpan..." : "💾 Simpan Jadwal"}
                  </button>
                </div>

                {loadingSchedule ? (
                  <div style={{ textAlign: "center", padding: "16px", fontSize: "0.82rem", color: "#B09080", fontFamily: "'DM Sans', sans-serif" }}>
                    Memuat jadwal...
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {weeklySchedules.map((sched) => (
                      <div
                        key={sched.day_of_week}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          background: "#FDFBF9",
                          border: "1px solid #EDD8CC",
                          borderRadius: "8px",
                          gap: "16px",
                          flexWrap: "wrap"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "120px" }}>
                          <input
                            type="checkbox"
                            checked={sched.isOpen}
                            onChange={(e) => handleScheduleChange(sched.day_of_week, "isOpen", e.target.checked)}
                            style={{ width: "16px", height: "16px", accentColor: "#6B3A2A", cursor: "pointer" }}
                          />
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#2C1A0E" }}>
                            {DAY_LABELS[sched.day_of_week]}
                          </span>
                        </div>

                        {sched.isOpen ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                              type="time"
                              value={sched.open_time}
                              onChange={(e) => handleScheduleChange(sched.day_of_week, "open_time", e.target.value)}
                              style={{ padding: "6px 8px", border: "1px solid #EDD8CC", borderRadius: "6px", fontSize: "0.82rem", fontFamily: "'DM Mono', monospace", outline: "none", color: "#2C1A0E" }}
                            />
                            <span style={{ fontSize: "0.78rem", color: "#B09080" }}>s.d</span>
                            <input
                              type="time"
                              value={sched.close_time}
                              onChange={(e) => handleScheduleChange(sched.day_of_week, "close_time", e.target.value)}
                              style={{ padding: "6px 8px", border: "1px solid #EDD8CC", borderRadius: "6px", fontSize: "0.82rem", fontFamily: "'DM Mono', monospace", outline: "none", color: "#2C1A0E" }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#C05060", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                            🚫 Tutup / Tidak Beroperasi
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Holidays & Custom Closures */}
              <div className="admin-card" style={{ padding: "24px" }}>
                <SectionTitle icon="📅" title="Hari Libur Khusus (Closing Time)" sub="Tutup salon sementara untuk libur/alasan tertentu & kirim WhatsApp otomatis ke pelanggan terdampak" />

                {/* Form to add new holiday */}
                <div
                  style={{
                    padding: "16px",
                    background: "#FAF5F2",
                    border: "1px solid #EDD8CC",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    marginBottom: "20px"
                  }}
                >
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6B3A2A", fontFamily: "'DM Sans', sans-serif" }}>
                    ➕ Tambah Hari Libur Baru
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.68rem", fontWeight: 600, color: "#8B6A5A", display: "block", marginBottom: "4px" }}>Tanggal Mulai</label>
                      <input
                        type="date"
                        value={newClosing.start_date}
                        onChange={(e) => setNewClosing(prev => ({ ...prev, start_date: e.target.value }))}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #EDD8CC", borderRadius: "6px", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#2C1A0E" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.68rem", fontWeight: 600, color: "#8B6A5A", display: "block", marginBottom: "4px" }}>Tanggal Selesai</label>
                      <input
                        type="date"
                        value={newClosing.end_date}
                        onChange={(e) => setNewClosing(prev => ({ ...prev, end_date: e.target.value }))}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #EDD8CC", borderRadius: "6px", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#2C1A0E" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.68rem", fontWeight: 600, color: "#8B6A5A", display: "block", marginBottom: "4px" }}>Alasan Tutup</label>
                    <input
                      type="text"
                      placeholder="Contoh: Libur Lebaran, Renovasi Salon, Pelatihan Staff"
                      value={newClosing.reason}
                      onChange={(e) => setNewClosing(prev => ({ ...prev, reason: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #EDD8CC", borderRadius: "6px", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#2C1A0E" }}
                    />
                  </div>

                  <button
                    onClick={handleAddClosing}
                    disabled={addingClosing}
                    style={{
                      background: "#C4788A", color: "white", border: "none",
                      padding: "10px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem",
                      fontWeight: 600, cursor: addingClosing ? "not-allowed" : "pointer", borderRadius: "8px", transition: "background 0.2s",
                      marginTop: "4px"
                    }}
                    onMouseEnter={(e) => { if (!addingClosing) e.currentTarget.style.background = "#A85070"; }}
                    onMouseLeave={(e) => { if (!addingClosing) e.currentTarget.style.background = "#C4788A"; }}
                  >
                    {addingClosing ? "Memproses..." : "📢 Umumkan Hari Libur"}
                  </button>
                </div>

                {/* List of existing holidays */}
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6B3A2A", fontFamily: "'DM Sans', sans-serif", marginBottom: "10px" }}>
                  📋 Daftar Hari Libur Terjadwal
                </div>

                {loadingSchedule ? (
                  <div style={{ textAlign: "center", padding: "12px", fontSize: "0.8rem", color: "#B09080" }}>
                    Memuat...
                  </div>
                ) : closingTimes.length === 0 ? (
                  <div style={{ padding: "16px", border: "1px dashed #EDD8CC", borderRadius: "8px", textAlign: "center", fontSize: "0.8rem", color: "#B09080", fontFamily: "'DM Sans', sans-serif" }}>
                    Tidak ada jadwal hari libur dalam database.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {closingTimes.map((item) => {
                      const start = new Date(item.start_datetime);
                      const end = new Date(item.end_datetime);
                      const fDate = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                      const displayRange = start.toDateString() === end.toDateString() ? fDate(start) : `${fDate(start)} - ${fDate(end)}`;

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "white",
                            border: "1px solid #F0D9E0",
                            borderRadius: "8px",
                            gap: "16px"
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#3A1A28", fontFamily: "'DM Sans', sans-serif" }}>
                              {item.reason}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#B08090", fontFamily: "'DM Mono', monospace", marginTop: "2px" }}>
                              📅 {displayRange}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteClosing(item.id)}
                            style={{
                              background: "none", border: "1px solid rgba(192,80,96,0.2)",
                              color: "#C05060", padding: "6px 12px", borderRadius: "6px",
                              fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem",
                              fontWeight: 500, cursor: "pointer", transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(192,80,96,0.06)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                          >
                            Hapus
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: QRIS Dinamis */}
          {activeTab === "qris" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="admin-card" style={{ padding: "28px" }}>
                <SectionTitle
                  icon="📱"
                  title="String Payload QRIS Statis Utama"
                  sub="String payload format EMVCo QRIS Toko. Sistem akan menginjeksi nominal invoice secara dinamis ke string ini saat pelanggan melakukan scan bayar."
                />
                
                <Field
                  label="Payload QRIS EMVCo (String)"
                  type="textarea"
                  value={settings.qris_payload}
                  onChange={(v) => setSettings((p) => ({ ...p, qris_payload: v }))}
                  placeholder="0002010102112658..."
                  hint="Pastikan diawali dengan 000201... dan memiliki format EMVCo QRIS standar Indonesia."
                />
              </div>

              {/* Tester Section */}
              <div className="admin-card" style={{ padding: "28px" }}>
                <SectionTitle
                  icon="🧪"
                  title="Tes Generator QRIS Dinamis Interaktif"
                  sub="Uji coba penyisipan nominal otomatis & verifikasi Checksum CRC16 secara realtime."
                />

                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <Field
                      label="Nominal Tes (IDR)"
                      type="number"
                      value={testAmount}
                      onChange={(v) => setTestAmount(v)}
                      placeholder="150000"
                    />

                    <button
                      onClick={() => {
                        const amt = Number(testAmount) || 0;
                        const dynamic = generateDynamicQrisPayload(settings.qris_payload, amt);
                        setTestDynamicPayload(dynamic);
                        QRCode.toDataURL(dynamic, { margin: 1, width: 240, color: { dark: "#2C1A0E", light: "#FFFFFF" } })
                          .then((url) => setTestQrDataUrl(url))
                          .catch(() => {});
                      }}
                      style={{
                        background: "#6B3A2A", color: "white", border: "none",
                        padding: "10px 18px", borderRadius: "8px", fontWeight: 600,
                        fontSize: "0.82rem", cursor: "pointer", marginTop: "4px"
                      }}
                    >
                      ⚡ Generasikan QRIS Dinamis Tes
                    </button>

                    {testDynamicPayload && (
                      <div>
                        <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#7A2848", textTransform: "uppercase", marginBottom: "4px" }}>
                          Hasil String QRIS Dinamis (Termasuk Tag 54 Amount & CRC16 Baru):
                        </div>
                        <div style={{ background: "#FDF8F5", border: "1px solid #EDD8CC", padding: "10px", borderRadius: "6px", fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", wordBreak: "break-all", color: "#6B3A2A" }}>
                          {testDynamicPayload}
                        </div>
                      </div>
                    )}
                  </div>

                  {testQrDataUrl && (
                    <div style={{ background: "#FDFAF7", border: "1px solid #EDD8CC", borderRadius: "12px", padding: "20px", textAlign: "center", minWidth: "220px" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "8px" }}>
                        Preview QR Code Tes
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={testQrDataUrl} alt="QR Code Preview" style={{ width: "160px", height: "160px", margin: "0 auto 8px", display: "block" }} />
                      <div style={{ fontSize: "0.72rem", color: "#1A7A4A", fontWeight: 600, background: "rgba(42,140,90,0.1)", padding: "4px 8px", borderRadius: "6px" }}>
                        🔒 Terkunci: Rp {Number(testAmount).toLocaleString("id-ID")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}