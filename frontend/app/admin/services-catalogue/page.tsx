"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import ImageUploader from "@/components/ui/ImageUploader";
import { uploadAdminImage } from "@/actions/admin";

// ── Types ──────────────────────────────────────────────────────────────────

interface SalonService {
  id: number;
  service_name: string;
  price: number;
  hour_duration: number;
  image_url: string | null;
  is_price_variable: boolean;
  is_active?: boolean;
}

type FormMode = "create" | "edit";

interface ServiceForm {
  service_name: string;
  price: string;
  hour_duration: string;
  image_url: string;
  is_price_variable: boolean;
}

const EMPTY_FORM: ServiceForm = {
  service_name: "",
  price: "",
  hour_duration: "",
  image_url: "",
  is_price_variable: false,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n);
}

// ── Form Modal ─────────────────────────────────────────────────────────────

function ServiceFormModal({
  mode, initial, onClose, onSave,
}: {
  mode: FormMode;
  initial: ServiceForm;
  onClose: () => void;
  onSave: (form: ServiceForm) => Promise<void>;
}) {
  const [form, setForm] = useState<ServiceForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof ServiceForm>(field: K, value: ServiceForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.service_name.trim()) { setError("Nama layanan wajib diisi."); return; }
    if (form.service_name.trim().length > 100) { setError("Nama layanan tidak boleh lebih dari 100 karakter."); return; }
    const parsedPrice = Number(form.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) { setError("Harga tidak boleh negatif."); return; }
    const parsedDuration = Number(form.hour_duration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) { setError("Durasi harus berupa angka positif."); return; }
    setSaving(true);
    setError("");
    try {
      let finalImageUrl = form.image_url;
      if (finalImageUrl && finalImageUrl.startsWith("data:image/")) {
        const uploadRes = await uploadAdminImage(finalImageUrl, "services", "service-catalog");
        if (!uploadRes.success || !uploadRes.data?.imageUrl) {
          throw new Error(uploadRes.error || "Gagal mengunggah foto layanan.");
        }
        finalImageUrl = uploadRes.data.imageUrl;
      }
      await onSave({ ...form, image_url: finalImageUrl });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "9px 12px",
    border: "1px solid #F0E0E6", borderRadius: "8px",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem",
    color: "#2C1A0E", background: "#FDFAF7", outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem",
    fontWeight: 600, color: "#7A5C50", letterSpacing: "0.08em",
    textTransform: "uppercase" as const, display: "block", marginBottom: "5px",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,0.3)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", overflowY: "auto" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "16px", width: "100%", maxWidth: "480px", overflowY: "auto", maxHeight: "90vh", boxShadow: "0 24px 64px rgba(196,120,138,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F0E0E6", background: "linear-gradient(135deg, #FDF8F3, #FDF0F4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "#2C1A0E" }}>
            {mode === "create" ? "Tambah Layanan Baru" : "Edit Layanan"}
          </div>
          <button onClick={onClose} style={{ background: "rgba(196,120,138,0.08)", border: "1px solid #F0E0E6", color: "#C4788A", cursor: "pointer", width: "30px", height: "30px", borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {error && (
            <div style={{ background: "rgba(192,80,96,0.07)", border: "1px solid rgba(192,80,96,0.2)", borderRadius: "8px", padding: "10px 14px", fontSize: "0.8rem", color: "#C05060", fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>Nama Layanan *</label>
            <input value={form.service_name} onChange={(e) => update("service_name", e.target.value)} placeholder="cth. Hair Treatment" style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Harga (Rp) *</label>
              <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="85000" style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")} />
            </div>
            <div>
              <label style={labelStyle}>Durasi (jam) *</label>
              <input type="number" value={form.hour_duration} onChange={(e) => update("hour_duration", e.target.value)} placeholder="1" style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")} />
            </div>
          </div>

          {/* Uploader Gambar Jasa */}
          <ImageUploader
            value={form.image_url}
            onChange={(url) => update("image_url", url)}
            folder="services"
            filenamePrefix="service-catalog"
            label="Foto Jasa Salon"
            aspectRatio="4/3"
          />

          {/* Checkbox Harga Variabel */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <input
              type="checkbox"
              id="is_price_variable"
              checked={form.is_price_variable}
              onChange={(e) => update("is_price_variable", e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "#C4788A",
                cursor: "pointer"
              }}
            />
            <label
              htmlFor="is_price_variable"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#7A5C50",
                cursor: "pointer",
                userSelect: "none"
              }}
            >
              Harga Variabel (Tampilkan sebagai "Mulai dari")
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F0E0E6", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #F0E0E6", color: "#7A5C50", padding: "9px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", cursor: "pointer", borderRadius: "8px" }}>
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: saving ? "#C4A882" : "#C4788A", color: "white", border: "none", padding: "9px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", borderRadius: "8px", transition: "background 0.2s" }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#A85070"; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#C4788A"; }}
          >
            {saving ? "Menyimpan..." : mode === "create" ? "Tambah Layanan" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────

function DeleteConfirmModal({ name, onClose, onConfirm, loading }: {
  name: string; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,0.3)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", overflowY: "auto" }} onClick={onClose}>
      <div style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "16px", width: "100%", maxWidth: "400px", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 24px 64px rgba(196,120,138,0.2)", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: "2.5rem", marginBottom: "14px" }}>🗑️</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "8px" }}>
          Hapus Layanan?
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#7A5C50", lineHeight: 1.6, marginBottom: "24px" }}>
          Layanan <strong>{name}</strong> akan dihapus permanen. Layanan yang sudah memiliki riwayat booking tidak dapat dihapus.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #F0E0E6", color: "#7A5C50", padding: "9px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", cursor: "pointer", borderRadius: "8px" }}>
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ background: "rgba(192,80,96,0.1)", border: "1.5px solid rgba(192,80,96,0.3)", color: "#C05060", padding: "9px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", borderRadius: "8px" }}>
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

import { useAdminCache } from "@/context/AdminCacheContext";

export default function ServicesCataloguePage() {
  const { getCache, setCache, setRevalidating, revalidatingKeys } = useAdminCache();
  const cacheKey = "admin_services_catalogue";

  const [services, setServices] = useState<SalonService[]>(() => getCache<any>(cacheKey) ?? []);
  const [loading, setLoading]   = useState(!getCache<any>(cacheKey));
  const [search, setSearch]     = useState("");
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const [formMode, setFormMode]     = useState<FormMode>("create");
  const [formOpen, setFormOpen]     = useState(false);
  const [formInitial, setFormInitial] = useState<ServiceForm>(EMPTY_FORM);
  const [editingId, setEditingId]   = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SalonService | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchServices = useCallback(async () => {
    const cached = getCache<any>(cacheKey);
    if (cached) {
      setServices(cached);
      setLoading(false);
      setRevalidating(cacheKey, true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
        setCache(cacheKey, data);
      }
    } catch {
      showToast("Gagal memuat data layanan.", false);
    } finally {
      setLoading(false);
      setRevalidating(cacheKey, false);
    }
  }, [getCache, setCache, setRevalidating, showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filtered = services.filter((s) =>
    !search || s.service_name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setFormMode("create");
    setFormInitial(EMPTY_FORM);
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(s: SalonService) {
    setFormMode("edit");
    setFormInitial({
      service_name: s.service_name,
      price: String(s.price),
      hour_duration: String(s.hour_duration),
      image_url: s.image_url ?? "",
      is_price_variable: !!s.is_price_variable,
    });
    setEditingId(s.id);
    setFormOpen(true);
  }

  async function handleSave(form: ServiceForm) {
    const payload = {
      service_name: form.service_name,
      price: Number(form.price),
      hour_duration: Number(form.hour_duration),
      image_url: form.image_url || null,
      is_price_variable: !!form.is_price_variable,
    };

    const url    = formMode === "create" ? "/api/admin/services" : `/api/admin/services/${editingId}`;
    const method = formMode === "create" ? "POST" : "PUT";

    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");

    if (formMode === "create") {
      setServices((prev) => [...prev, data].sort((a, b) => a.service_name.localeCompare(b.service_name)));
    } else {
      setServices((prev) => prev.map((s) => s.id === editingId ? data : s));
    }

    setFormOpen(false);
    showToast(formMode === "create" ? "Layanan berhasil ditambahkan!" : "Layanan berhasil diperbarui!", true);
  }

  async function handleReactivate(service: SalonService) {
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_name: service.service_name,
          price: String(service.price),
          hour_duration: String(service.hour_duration),
          image_url: service.image_url || "",
          is_price_variable: service.is_price_variable,
          is_active: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, is_active: true } : s));
      showToast("Layanan berhasil diaktifkan kembali!", true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal mengaktifkan kembali.", false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res  = await fetch(`/api/admin/services/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.deactivated) {
        setServices((prev) => prev.map((s) => s.id === deleteTarget.id ? { ...s, is_active: false } : s));
        showToast("Layanan dinonaktifkan karena sudah memiliki riwayat booking.", true);
      } else {
        setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        showToast("Layanan berhasil dihapus.", true);
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal menghapus.", false);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "72px", right: "24px", zIndex: 2000, background: "white", border: `1.5px solid ${toast.ok ? "rgba(90,158,122,0.5)" : "rgba(192,80,96,0.5)"}`, color: toast.ok ? "#3D7A5A" : "#C05060", padding: "12px 20px", borderRadius: "10px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, boxShadow: "0 8px 24px rgba(196,120,138,0.15)", display: "flex", alignItems: "center", gap: "8px" }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
            Katalog Jasa Salon
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#B09080" }}>
            {services.length} layanan terdaftar
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{ background: "#C4788A", color: "white", border: "none", padding: "10px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", borderRadius: "10px", transition: "background 0.2s", display: "flex", alignItems: "center", gap: "8px" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#A85070")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C4788A")}
        >
          + Tambah Layanan
        </button>
      </div>

      {/* DataTables Component */}
      <DataTable
        data={services}
        loading={loading}
        onRefresh={fetchServices}
        isRevalidating={revalidatingKeys.has(cacheKey)}
        searchPlaceholder="Cari nama layanan salon..."
        searchableKeys={["service_name", "price", "hour_duration"]}
        emptyMessage="Belum ada layanan salon yang ditemukan 🌸"
        columns={[
          {
            key: "image_url",
            header: "Foto",
            width: "70px",
            render: (s) => (
              <div style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", background: "#FDF0F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={s.image_url} alt={s.service_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "1.2rem" }}>✂️</span>
                )}
              </div>
            ),
          },
          {
            key: "service_name",
            header: "Nama Layanan",
            sortable: true,
            render: (s) => (
              <div>
                <div style={{ fontWeight: 600, color: "#2C1A0E" }}>{s.service_name}</div>
                {s.is_active === false && (
                  <span style={{ fontSize: "0.68rem", color: "#C05060", background: "rgba(192,80,96,0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                    Non-Aktif
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "price",
            header: "Harga",
            sortable: true,
            sortValue: (s) => Number(s.price),
            render: (s) => (
              <div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: "#C4788A" }}>
                  {s.is_price_variable && <span style={{ fontSize: "0.72rem", color: "#B09080", fontWeight: 400 }}>Mulai </span>}
                  {formatRupiah(Number(s.price))}
                </span>
              </div>
            ),
          },
          {
            key: "hour_duration",
            header: "Durasi Est.",
            sortable: true,
            sortValue: (s) => Number(s.hour_duration),
            render: (s) => <span style={{ fontSize: "0.78rem", color: "#7A5C50" }}>⏱️ {s.hour_duration} Jam</span>,
          },
          {
            key: "action",
            header: "Aksi",
            align: "center",
            render: (s) => (
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                {s.is_active === false ? (
                  <button
                    onClick={() => handleReactivate(s)}
                    style={{ background: "#5A9E7A", color: "white", border: "none", padding: "5px 12px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    ✓ Aktifkan
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => openEdit(s)}
                      style={{ background: "transparent", border: "1px solid #F0E0E6", color: "#C4788A", padding: "5px 10px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer" }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      style={{ background: "rgba(192,80,96,0.08)", border: "1px solid rgba(192,80,96,0.25)", color: "#C05060", padding: "5px 10px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer" }}
                    >
                      🗑️ Hapus
                    </button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Modals */}
      {formOpen && (
        <ServiceFormModal
          mode={formMode}
          initial={formInitial}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.service_name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}