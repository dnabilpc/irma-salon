"use client";

// app/admin/settings/page.tsx

import { useState, useEffect, useCallback } from "react";

interface Settings {
  // VTO
  vto_limit_default: string;
  vto_reset_interval_days: string;
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
}

const DEFAULT_SETTINGS: Settings = {
  vto_limit_default: "5",
  vto_reset_interval_days: "14",
  salon_name: "",
  salon_whatsapp: "",
  salon_instagram: "",
  salon_facebook: "",
  salon_tiktok: "",
  salon_email: "",
  salon_address: "",
  salon_maps_url: "",
  salon_open_description: "",
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
  label, value, onChange, type = "text", placeholder = "", hint = "", prefix = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string; prefix?: string;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: prefix ? "9px 12px 9px 0" : "9px 12px",
    border: "none", outline: "none",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem",
    color: "#2C1A0E", background: "transparent",
  };

  return (
    <div>
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", fontWeight: 600, color: "#7A2848", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #F0D9E0", borderRadius: "8px", background: "white", overflow: "hidden" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#C4728E")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#F0D9E0")}
      >
        {prefix && (
          <span style={{ padding: "9px 10px 9px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "#B08090", flexShrink: 0, borderRight: "1px solid #F0D9E0", marginRight: "0" }}>
            {prefix}
          </span>
        )}
        {type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, paddingLeft: "12px" }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"vto" | "salon">("vto");

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings((prev) => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => { setLoading(false); showToast("Gagal memuat settings.", false); });
  }, [showToast]);

  function update(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
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
          <p style={{ fontSize: "0.78rem", color: "#B09080" }}>Konfigurasi Virtual Try-On dan informasi salon</p>
        </div>
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
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #F0D9E0" }}>
        {([
          { key: "vto", label: "⚙️ Virtual Try-On" },
          { key: "salon", label: "🏪 Info Salon" },
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", maxWidth: "700px" }}>

          {/* ── Tab: VTO ── */}
          {activeTab === "vto" && (
            <div className="admin-card" style={{ padding: "24px" }}>
              <SectionTitle icon="✨" title="Konfigurasi Virtual Try-On" sub="Atur batas penggunaan dan periode reset kuota VTO per user" />

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <Field
                  label="Batas VTO per User"
                  value={settings.vto_limit_default}
                  onChange={(v) => update("vto_limit_default", v)}
                  type="number"
                  placeholder="5"
                  hint="Jumlah maksimal penggunaan Virtual Try-On per user dalam satu periode reset."
                />
                <Field
                  label="Interval Reset (hari)"
                  value={settings.vto_reset_interval_days}
                  onChange={(v) => update("vto_reset_interval_days", v)}
                  type="number"
                  placeholder="14"
                  hint="Setiap berapa hari kuota VTO direset secara otomatis. Default: 14 hari (2 minggu). Kuota juga direset saat transaksi sewa baju selesai."
                />

                {/* Preview info */}
                <div style={{ background: "rgba(196,120,138,0.06)", border: "1px solid #F0D9E0", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#7A2848", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginBottom: "8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Preview Kebijakan
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#8A4060", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, margin: 0 }}>
                    Setiap user mendapat <strong>{settings.vto_limit_default || "5"} kali</strong> penggunaan Virtual Try-On
                    per <strong>{settings.vto_reset_interval_days || "14"} hari</strong>.
                    Kuota juga akan direset otomatis saat user menyelesaikan transaksi sewa baju.
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
                <SectionTitle icon="🏪" title="Informasi Dasar Salon" sub="Nama, alamat, dan jam operasional salon" />
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Field label="Nama Salon" value={settings.salon_name} onChange={(v) => update("salon_name", v)} placeholder="Salon Rumah Cantik Irma" />
                  <Field label="Alamat Lengkap" value={settings.salon_address} onChange={(v) => update("salon_address", v)} placeholder="Graha Suko Indah B-1, Sukodono, Sidoarjo" type="textarea" />
                  <Field label="Jam Operasional" value={settings.salon_open_description} onChange={(v) => update("salon_open_description", v)} placeholder="Senin – Sabtu, 09.00 – 18.00 WIB" hint="Teks deskripsi jam buka yang ditampilkan di website." />
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
        </div>
      )}
    </div>
  );
}