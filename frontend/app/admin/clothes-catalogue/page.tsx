"use client";

import { useState, useEffect, useCallback } from "react";
import ImageUploader from "@/components/ui/ImageUploader";
import MultiImageUploader from "@/components/ui/MultiImageUploader";
import { uploadAdminImage } from "@/actions/admin";

// ── Types ──────────────────────────────────────────────────────────────────

interface OutfitCategory {
  id: number;
  category_name: string;
  description: string | null;
  outfit_count: number;
}

interface Outfit {
  id: number;
  outfit_name: string;
  description: string | null;
  price: number;
  size: string | null;
  image_url: string | null;
  additional_image_urls: string[] | null;
  model_2d_file_link: string | null; // digunakan sebagai vto_image_url
  outfit_category_id: number;
  category_name: string;
}

type FormMode = "create" | "edit";
type ActiveTab = "outfits" | "categories";

interface OutfitForm {
  outfit_category_id: string;
  outfit_name: string;
  description: string;
  price: string;
  size: string;
  image_url: string;
  additional_image_urls: string[];
  model_2d_file_link: string; // vto_image_url
}

interface CategoryForm {
  category_name: string;
  description: string;
}

const EMPTY_OUTFIT_FORM: OutfitForm = {
  outfit_category_id: "",
  outfit_name: "",
  description: "",
  price: "",
  size: "",
  image_url: "",
  additional_image_urls: [],
  model_2d_file_link: "",
};

const EMPTY_CAT_FORM: CategoryForm = { category_name: "", description: "" };

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n);
}

// ── Outfit Form Modal ──────────────────────────────────────────────────────

function OutfitFormModal({
  mode, initial, categories, onClose, onSave,
}: {
  mode: FormMode;
  initial: OutfitForm;
  categories: OutfitCategory[];
  onClose: () => void;
  onSave: (form: OutfitForm) => Promise<void>;
}) {
  const [form, setForm] = useState<OutfitForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof OutfitForm, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.outfit_name.trim()) { setError("Nama baju wajib diisi."); return; }
    if (form.outfit_name.trim().length > 50) { setError("Nama baju tidak boleh lebih dari 50 karakter."); return; }
    if (!form.outfit_category_id) { setError("Pilih kategori baju."); return; }
    const parsedPrice = Number(form.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) { setError("Harga harus berupa angka positif."); return; }
    if (form.description && form.description.length > 255) { setError("Deskripsi tidak boleh lebih dari 255 karakter."); return; }
    if (form.size && form.size.length > 10) { setError("Ukuran (size) tidak boleh lebih dari 10 karakter."); return; }
    setSaving(true); setError("");
    try {
      // 1. Upload main display image if it's base64
      let finalImageUrl = form.image_url;
      if (finalImageUrl && finalImageUrl.startsWith("data:image/")) {
        const uploadRes = await uploadAdminImage(finalImageUrl, "outfits", "outfit-catalog");
        if (!uploadRes.success || !uploadRes.data?.imageUrl) {
          throw new Error(uploadRes.error || "Gagal mengunggah foto display.");
        }
        finalImageUrl = uploadRes.data.imageUrl;
      }

      // 2. Upload additional gallery images if any of them are base64
      let finalAdditionalUrls = form.additional_image_urls || [];
      if (finalAdditionalUrls.length > 0) {
        const uploadedAdditional: string[] = [];
        for (const url of finalAdditionalUrls) {
          if (url && url.startsWith("data:image/")) {
            const uploadRes = await uploadAdminImage(url, "outfits", "outfit-gallery");
            if (!uploadRes.success || !uploadRes.data?.imageUrl) {
              throw new Error(uploadRes.error || "Gagal mengunggah salah satu foto galeri.");
            }
            uploadedAdditional.push(uploadRes.data.imageUrl);
          } else {
            uploadedAdditional.push(url);
          }
        }
        finalAdditionalUrls = uploadedAdditional;
      }

      // 3. Upload VTO image if it's base64
      let finalModel2dUrl = form.model_2d_file_link;
      if (finalModel2dUrl && finalModel2dUrl.startsWith("data:image/")) {
        const uploadRes = await uploadAdminImage(finalModel2dUrl, "vto", "outfit-vto");
        if (!uploadRes.success || !uploadRes.data?.imageUrl) {
          throw new Error(uploadRes.error || "Gagal mengunggah foto Virtual Try-On.");
        }
        finalModel2dUrl = uploadRes.data.imageUrl;
      }

      await onSave({
        ...form,
        image_url: finalImageUrl,
        additional_image_urls: finalAdditionalUrls,
        model_2d_file_link: finalModel2dUrl,
      });
    }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid #F0E0E6",
    borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem",
    color: "#2C1A0E", background: "#FDFAF7", outline: "none", transition: "border-color 0.2s",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", fontWeight: 600,
    color: "#7A5C50", letterSpacing: "0.08em", textTransform: "uppercase",
    display: "block", marginBottom: "5px",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,0.3)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "16px", width: "100%", maxWidth: "520px", overflow: "hidden", boxShadow: "0 24px 64px rgba(196,120,138,0.2)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F0E0E6", background: "linear-gradient(135deg, #FDF8F3, #FDF0F4)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "#2C1A0E" }}>
            {mode === "create" ? "Tambah Baju Baru" : "Edit Baju"}
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

          {/* Kategori */}
          <div>
            <label style={labelStyle}>Kategori *</label>
            <select
              value={form.outfit_category_id}
              onChange={(e) => update("outfit_category_id", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")}
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category_name}</option>
              ))}
            </select>
          </div>

          {/* Nama */}
          <div>
            <label style={labelStyle}>Nama Baju *</label>
            <input
              value={form.outfit_name}
              onChange={(e) => update("outfit_name", e.target.value)}
              placeholder="cth. Kebaya Merah Pengantin"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")}
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label style={labelStyle}>Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Deskripsi singkat..."
              rows={2}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Harga Sewa/Hari (Rp) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="200000"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")}
              />
            </div>
            <div>
              <label style={labelStyle}>Ukuran</label>
              <input
                value={form.size}
                onChange={(e) => update("size", e.target.value)}
                placeholder="M, L, XL, All Size"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")}
              />
            </div>
          </div>

          {/* Uploader Gambar Display */}
          <ImageUploader
            value={form.image_url}
            onChange={(url) => update("image_url", url)}
            folder="outfits"
            filenamePrefix="outfit-catalog"
            label="Foto Display (untuk Katalog)"
            aspectRatio="4/3"
          />

          {/* Uploader Gambar Galeri Tambahan */}
          <MultiImageUploader
            value={form.additional_image_urls}
            onChange={(urls) => update("additional_image_urls", urls)}
            folder="outfits"
            filenamePrefix="outfit-gallery"
            label="Foto Galeri Tambahan (Display Katalog)"
          />

          {/* Uploader Foto VTO */}
          <ImageUploader
            value={form.model_2d_file_link}
            onChange={(url) => update("model_2d_file_link", url)}
            folder="vto"
            filenamePrefix="outfit-vto"
            label="Foto Virtual Try-On (VTO AI)"
            aspectRatio="4/3"
          />
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F0E0E6", display: "flex", gap: "10px", justifyContent: "flex-end", position: "sticky", bottom: 0, background: "white" }}>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "1px solid #F0E0E6", color: "#7A5C50", padding: "9px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", cursor: "pointer", borderRadius: "8px" }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: saving ? "#C4A882" : "#C4788A", color: "white", border: "none", padding: "9px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", borderRadius: "8px" }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#A85070"; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#C4788A"; }}
          >
            {saving ? "Menyimpan..." : mode === "create" ? "Tambah Baju" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category Form Modal ────────────────────────────────────────────────────

function CategoryFormModal({
  mode, initial, onClose, onSave,
}: {
  mode: FormMode;
  initial: CategoryForm;
  onClose: () => void;
  onSave: (form: CategoryForm) => Promise<void>;
}) {
  const [form, setForm] = useState<CategoryForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!form.category_name.trim()) { setError("Nama kategori wajib diisi."); return; }
    if (form.category_name.trim().length > 50) { setError("Nama kategori tidak boleh lebih dari 50 karakter."); return; }
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!nameRegex.test(form.category_name.trim())) {
      setError("Nama kategori hanya boleh mengandung huruf, angka, spasi, tanda hubung (-), atau garis bawah (_).");
      return;
    }
    if (form.description && form.description.length > 255) {
      setError("Deskripsi tidak boleh lebih dari 255 karakter.");
      return;
    }
    setSaving(true); setError("");
    try { await onSave(form); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid #F0E0E6",
    borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem",
    color: "#2C1A0E", background: "#FDFAF7", outline: "none",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,0.3)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "16px", width: "100%", maxWidth: "400px", overflow: "hidden", boxShadow: "0 24px 64px rgba(196,120,138,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F0E0E6", background: "linear-gradient(135deg, #FDF8F3, #FDF0F4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "#2C1A0E" }}>
            {mode === "create" ? "Tambah Kategori" : "Edit Kategori"}
          </div>
          <button onClick={onClose} style={{ background: "rgba(196,120,138,0.08)", border: "1px solid #F0E0E6", color: "#C4788A", cursor: "pointer", width: "30px", height: "30px", borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {error && (
            <div style={{ background: "rgba(192,80,96,0.07)", border: "1px solid rgba(192,80,96,0.2)", borderRadius: "8px", padding: "10px 14px", fontSize: "0.8rem", color: "#C05060" }}>
              {error}
            </div>
          )}
          <div>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", fontWeight: 600, color: "#7A5C50", letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "5px" }}>
              Nama Kategori *
            </label>
            <input
              value={form.category_name}
              onChange={(e) => setForm((p) => ({ ...p, category_name: e.target.value }))}
              placeholder="cth. Kebaya, Gaun Pesta"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")}
            />
          </div>
          <div>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", fontWeight: 600, color: "#7A5C50", letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: "5px" }}>
              Deskripsi
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Deskripsi kategori..."
              rows={2}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")}
            />
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F0E0E6", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #F0E0E6", color: "#7A5C50", padding: "9px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", cursor: "pointer", borderRadius: "8px" }}>Batal</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: saving ? "#C4A882" : "#C4788A", color: "white", border: "none", padding: "9px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", borderRadius: "8px" }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#A85070"; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#C4788A"; }}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────

function DeleteConfirmModal({ name, onClose, onConfirm, loading }: {
  name: string; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,0.3)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "16px", width: "100%", maxWidth: "380px", padding: "28px", boxShadow: "0 24px 64px rgba(196,120,138,0.2)", textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "14px" }}>🗑️</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "8px" }}>Konfirmasi Hapus</div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "#7A5C50", lineHeight: 1.6, marginBottom: "22px" }}>
          <strong>{name}</strong> akan dihapus permanen dan tidak dapat dikembalikan.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #F0E0E6", color: "#7A5C50", padding: "9px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", cursor: "pointer", borderRadius: "8px" }}>Batal</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ background: "rgba(192,80,96,0.1)", border: "1.5px solid rgba(192,80,96,0.3)", color: "#C05060", padding: "9px 22px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", borderRadius: "8px" }}
          >
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function ClothesCataloguePage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [categories, setCategories] = useState<OutfitCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("outfits");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [outfitFormOpen, setOutfitFormOpen] = useState(false);
  const [outfitFormMode, setOutfitFormMode] = useState<FormMode>("create");
  const [outfitFormInitial, setOutfitFormInitial] = useState<OutfitForm>(EMPTY_OUTFIT_FORM);
  const [editingOutfitId, setEditingOutfitId] = useState<number | null>(null);

  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catFormMode, setCatFormMode] = useState<FormMode>("create");
  const [catFormInitial, setCatFormInitial] = useState<CategoryForm>(EMPTY_CAT_FORM);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; type: "outfit" | "category" } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // refreshKey di-increment setiap kali ingin re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  // fetchData hanya increment refreshKey — tidak memanggil setState langsung
  const fetchData = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Fetch data — semua setState hanya dipanggil di dalam callback async (bukan synchronous)
  useEffect(() => {
    const controller = new AbortController();

    // setLoading via queueMicrotask agar tidak synchronous di body effect
    queueMicrotask(() => setLoading(true));

    fetch("/api/admin/outfits", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setOutfits(data.outfits ?? []);
        setCategories(data.categories ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setLoading(false);
        setToast({ msg: "Gagal memuat data.", ok: false });
        setTimeout(() => setToast(null), 3000);
      });

    return () => controller.abort();
  }, [refreshKey]);

  const filteredOutfits = outfits.filter((o) => {
    const matchSearch = !search || o.outfit_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || String(o.outfit_category_id) === filterCat;
    return matchSearch && matchCat;
  });

  // Outfit handlers
  function openCreateOutfit() {
    setOutfitFormMode("create");
    setOutfitFormInitial(EMPTY_OUTFIT_FORM);
    setEditingOutfitId(null);
    setOutfitFormOpen(true);
  }

  function openEditOutfit(o: Outfit) {
    setOutfitFormMode("edit");
    setOutfitFormInitial({
      outfit_category_id: String(o.outfit_category_id),
      outfit_name: o.outfit_name,
      description: o.description ?? "",
      price: String(o.price),
      size: o.size ?? "",
      image_url: o.image_url ?? "",
      additional_image_urls: o.additional_image_urls ?? [],
      model_2d_file_link: o.model_2d_file_link ?? "",
    });
    setEditingOutfitId(o.id);
    setOutfitFormOpen(true);
  }

  async function handleSaveOutfit(form: OutfitForm) {
    const payload = {
      outfit_category_id: Number(form.outfit_category_id),
      outfit_name: form.outfit_name,
      description: form.description || null,
      price: Number(form.price),
      size: form.size || null,
      image_url: form.image_url || null,
      additional_image_urls: form.additional_image_urls || [],
      model_2d_file_link: form.model_2d_file_link || null,
    };
    const url = outfitFormMode === "create" ? "/api/admin/outfits" : `/api/admin/outfits/${editingOutfitId}`;
    const method = outfitFormMode === "create" ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");
    await fetchData();
    setOutfitFormOpen(false);
    showToast(outfitFormMode === "create" ? "Baju berhasil ditambahkan!" : "Baju berhasil diperbarui!", true);
  }

  // Category handlers
  function openCreateCategory() {
    setCatFormMode("create");
    setCatFormInitial(EMPTY_CAT_FORM);
    setEditingCatId(null);
    setCatFormOpen(true);
  }

  function openEditCategory(c: OutfitCategory) {
    setCatFormMode("edit");
    setCatFormInitial({ category_name: c.category_name, description: c.description ?? "" });
    setEditingCatId(c.id);
    setCatFormOpen(true);
  }

  async function handleSaveCategory(form: CategoryForm) {
    const url = catFormMode === "create" ? "/api/admin/outfit-categories" : `/api/admin/outfit-categories/${editingCatId}`;
    const method = catFormMode === "create" ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");
    await fetchData();
    setCatFormOpen(false);
    showToast(catFormMode === "create" ? "Kategori berhasil ditambahkan!" : "Kategori berhasil diperbarui!", true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const url = deleteTarget.type === "outfit"
        ? `/api/admin/outfits/${deleteTarget.id}`
        : `/api/admin/outfit-categories/${deleteTarget.id}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchData();
      setDeleteTarget(null);
      showToast("Data berhasil dihapus.", true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal menghapus.", false);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  // Stats
  const vtoCount = outfits.filter((o) => !!o.model_2d_file_link).length;

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "72px", right: "24px", zIndex: 2000, background: "white", border: `1.5px solid ${toast.ok ? "rgba(90,158,122,0.5)" : "rgba(192,80,96,0.5)"}`, color: toast.ok ? "#3D7A5A" : "#C05060", padding: "12px 20px", borderRadius: "10px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, boxShadow: "0 8px 24px rgba(196,120,138,0.15)", display: "flex", alignItems: "center", gap: "8px" }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
            Katalog Pakaian Sewaan
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#B09080" }}>
            {outfits.length} baju · {categories.length} kategori ·{" "}
            <span style={{ color: "#C9922A", fontWeight: 600 }}>{vtoCount} siap VTO</span>
          </p>
        </div>
        <button
          onClick={activeTab === "outfits" ? openCreateOutfit : openCreateCategory}
          style={{ background: "#C4788A", color: "white", border: "none", padding: "10px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", borderRadius: "10px", transition: "background 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#A85070")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C4788A")}
        >
          + {activeTab === "outfits" ? "Tambah Baju" : "Tambah Kategori"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #F0E0E6" }}>
        {([
          { key: "outfits", label: `Katalog Baju (${outfits.length})` },
          { key: "categories", label: `Kategori (${categories.length})` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              background: "none", border: "none",
              borderBottom: activeTab === key ? "2px solid #C4788A" : "2px solid transparent",
              color: activeTab === key ? "#C4788A" : "#B09080",
              padding: "10px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem",
              fontWeight: activeTab === key ? 600 : 400, cursor: "pointer", transition: "all 0.2s", marginBottom: "-1px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Katalog Baju ── */}
      {activeTab === "outfits" && (
        <>
          {/* Filter + Search */}
          <div style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "12px", flexWrap: "wrap", boxShadow: "0 1px 4px rgba(196,120,138,0.06)" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#C4788A", pointerEvents: "none" }}>🔍</span>
              <input
                type="text"
                placeholder="Cari nama baju..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", background: "#FDFAF7", border: "1px solid #F0E0E6", borderRadius: "8px", padding: "8px 12px 8px 36px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "#2C1A0E", outline: "none" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")}
              />
            </div>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              style={{ background: "#FDFAF7", border: "1px solid #F0E0E6", borderRadius: "8px", padding: "8px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "#2C1A0E", outline: "none", cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#F0E0E6")}
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category_name}</option>
              ))}
            </select>
          </div>

          {/* Grid baju */}
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#C4788A", fontFamily: "'DM Sans', sans-serif" }}>Memuat data...</div>
          ) : filteredOutfits.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#B09080", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem" }}>
              {search || filterCat !== "all" ? "Baju tidak ditemukan." : "Belum ada baju. Klik '+ Tambah Baju' untuk mulai."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
              {filteredOutfits.map((o) => (
                <div
                  key={o.id}
                  style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(196,120,138,0.06)", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(196,120,138,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "#E8C0D0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(196,120,138,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "#F0E0E6"; }}
                >
                  {/* Gambar */}
                  <div style={{ height: "180px", background: "linear-gradient(135deg, #FDF0F4, #FDF8F3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                    {o.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.image_url} alt={o.outfit_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <span style={{ fontSize: "3rem" }}>👗</span>
                    )}
                    {/* Badge VTO */}
                    {o.model_2d_file_link ? (
                      <div style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(201,146,42,0.92)", color: "white", fontSize: "0.58rem", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", letterSpacing: "0.06em" }}>
                        ✨ VTO SIAP
                      </div>
                    ) : (
                      <div style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.7)", fontSize: "0.55rem", fontWeight: 600, padding: "3px 8px", borderRadius: "6px" }}>
                        VTO BELUM ADA
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: "0.62rem", color: "#C4788A", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                      {o.category_name}
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
                      {o.outfit_name}
                    </div>
                    {o.description && (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: "#B09080", marginBottom: "10px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                        {o.description}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.88rem", fontWeight: 600, color: "#C4788A" }}>
                        {formatRupiah(o.price)}<span style={{ fontSize: "0.6rem", color: "#B09080", fontWeight: 400 }}>/hari</span>
                      </span>
                      {o.size && (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "#B09080", background: "#F5EBF0", padding: "2px 8px", borderRadius: "6px" }}>
                          {o.size}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => openEditOutfit(o)}
                        style={{ flex: 1, background: "rgba(196,120,138,0.08)", border: "1px solid rgba(196,120,138,0.25)", color: "#C4788A", padding: "7px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", borderRadius: "8px", transition: "all 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(196,120,138,0.15)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(196,120,138,0.08)")}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: o.id, name: o.outfit_name, type: "outfit" })}
                        style={{ flex: 1, background: "rgba(192,80,96,0.06)", border: "1px solid rgba(192,80,96,0.2)", color: "#C05060", padding: "7px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", borderRadius: "8px", transition: "all 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(192,80,96,0.12)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(192,80,96,0.06)")}
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Kategori ── */}
      {activeTab === "categories" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#C4788A", fontFamily: "'DM Sans', sans-serif" }}>Memuat data...</div>
          ) : categories.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#B09080", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem" }}>
              Belum ada kategori. Klik &apos;+ Tambah Kategori&apos;.
            </div>
          ) : (
            categories.map((c) => (
              <div key={c.id} style={{ background: "white", border: "1px solid #F0E0E6", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 4px rgba(196,120,138,0.06)" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(196,120,138,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                  👗
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "2px" }}>
                    {c.category_name}
                  </div>
                  {c.description && (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#B09080" }}>{c.description}</div>
                  )}
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#C4788A", background: "rgba(196,120,138,0.1)", padding: "3px 10px", borderRadius: "6px", flexShrink: 0 }}>
                  {c.outfit_count} baju
                </span>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button
                    onClick={() => openEditCategory(c)}
                    style={{ background: "rgba(196,120,138,0.08)", border: "1px solid rgba(196,120,138,0.25)", color: "#C4788A", padding: "7px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", borderRadius: "8px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(196,120,138,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(196,120,138,0.08)")}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: c.id, name: c.category_name, type: "category" })}
                    style={{ background: "rgba(192,80,96,0.06)", border: "1px solid rgba(192,80,96,0.2)", color: "#C05060", padding: "7px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", borderRadius: "8px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(192,80,96,0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(192,80,96,0.06)")}
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {outfitFormOpen && (
        <OutfitFormModal
          mode={outfitFormMode}
          initial={outfitFormInitial}
          categories={categories}
          onClose={() => setOutfitFormOpen(false)}
          onSave={handleSaveOutfit}
        />
      )}
      {catFormOpen && (
        <CategoryFormModal
          mode={catFormMode}
          initial={catFormInitial}
          onClose={() => setCatFormOpen(false)}
          onSave={handleSaveCategory}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}