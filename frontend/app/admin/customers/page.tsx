// app/admin/customers/page.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import {
  fetchActiveCustomers,
  fetchPendingRegistrations,
  fetchRejectedRegistrations,
  approveRegistration,
  rejectRegistration,
  adminCreateCustomer,
  type PendingRegistration,
  type ActiveCustomer,
} from "@/actions/authActions";

import { useAdminCache } from "@/context/AdminCacheContext";

type Tab = "aktif" | "pending" | "ditolak";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px", color: "#B08090", fontSize: "14px" }}>
      <div
        style={{
          width: "28px",
          height: "28px",
          border: "3px solid #F0D9E0",
          borderTopColor: "#C4728E",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function CustomersPage() {
  const { getCache, setCache, setRevalidating, revalidatingKeys } = useAdminCache();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const cacheKey = `admin_customers_${activeTab}`;

  const [search, setSearch]       = useState("");
  const [isPending, startTransition] = useTransition();

  const [customers,   setCustomers]   = useState<ActiveCustomer[]>(() => getCache<any>("admin_customers_aktif") ?? []);
  const [pending,     setPending]      = useState<PendingRegistration[]>(() => getCache<any>("admin_customers_pending") ?? []);
  const [rejected,    setRejected]     = useState<PendingRegistration[]>(() => getCache<any>("admin_customers_ditolak") ?? []);
  const [loadingTab,  setLoadingTab]   = useState<Tab | null>(null);
  const [toast,       setToast]        = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Direct Create Customer States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName]                     = useState("");
  const [newEmail, setNewEmail]                   = useState("");
  const [newPhone, setNewPhone]                   = useState("");
  const [newPassword, setNewPassword]             = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [modalLoading, setModalLoading]           = useState(false);
  const [modalError, setModalError]               = useState("");

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setModalError("");

    if (newPassword !== newConfirmPassword) {
      setModalError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (newPassword.length < 8) {
      setModalError("Password minimal 8 karakter.");
      return;
    }

    setModalLoading(true);
    const res = await adminCreateCustomer(newName, newEmail, newPhone, newPassword);
    setModalLoading(false);

    if (res.success) {
      showToast("Pelanggan baru berhasil dibuat!", "success");
      setIsCreateModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("");
      setNewConfirmPassword("");
      loadTab(activeTab);
    } else {
      setModalError(res.error || "Gagal membuat pelanggan baru.");
    }
  }

  const loadTab = useCallback(async (tab: Tab) => {
    const key = `admin_customers_${tab}`;
    const cached = getCache<any>(key);
    if (cached) {
      if (tab === "aktif") setCustomers(cached);
      else if (tab === "pending") setPending(cached);
      else setRejected(cached);
      setRevalidating(key, true);
    } else {
      setLoadingTab(tab);
    }

    try {
      if (tab === "aktif") {
        const res = await fetchActiveCustomers();
        if (res.success && res.customers) {
          setCustomers(res.customers);
          setCache(key, res.customers);
        }
      } else if (tab === "pending") {
        const res = await fetchPendingRegistrations();
        if (res.success && res.registrations) {
          setPending(res.registrations);
          setCache(key, res.registrations);
        }
      } else {
        const res = await fetchRejectedRegistrations();
        if (res.success && res.registrations) {
          setRejected(res.registrations);
          setCache(key, res.registrations);
        }
      }
    } finally {
      setLoadingTab(null);
      setRevalidating(key, false);
    }
  }, [getCache, setCache, setRevalidating]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTab(activeTab);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, loadTab]);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setSearch("");
  }

  async function handleApprove(id: string) {
    startTransition(async () => {
      const res = await approveRegistration(id);
      if (res.success) {
        showToast("Akun berhasil disetujui dan notifikasi WhatsApp terkirim.", "success");
        setPending((prev) => prev.filter((r) => r.id !== id));
        // Refresh active list
        const activeRes = await fetchActiveCustomers();
        if (activeRes.success) setCustomers(activeRes.customers ?? []);
      } else {
        showToast(res.error ?? "Gagal menyetujui.", "error");
      }
    });
  }

  async function handleReject(id: string) {
    startTransition(async () => {
      const res = await rejectRegistration(id);
      if (res.success) {
        showToast("Pendaftaran ditolak.", "success");
        setPending((prev) => prev.filter((r) => r.id !== id));
      } else {
        showToast(res.error ?? "Gagal menolak.", "error");
      }
    });
  }

  // Filtered data
  const filteredCustomers = customers.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone_number ?? "").includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPending = pending.filter((r) =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.phone_number ?? "").includes(search) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRejected = rejected.filter((r) =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.phone_number ?? "").includes(search) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; count: number; color: string }[] = [
    { id: "pending",  label: "Menunggu Persetujuan", count: pending.length,   color: "#C9922A" },
    { id: "aktif",    label: "Pelanggan Aktif",      count: customers.length, color: "#1A7A4A" },
    { id: "ditolak",  label: "Ditolak",              count: rejected.length,  color: "#C05060" },
  ];

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "24px",
            zIndex: 9999,
            background: toast.type === "success" ? "#1A7A4A" : "#C05060",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
            fontWeight: 500,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "slideIn 0.3s ease",
          }}
        >
          <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#7A2848", marginBottom: "4px" }}>
            Manajemen Pelanggan
          </h1>
          <p style={{ fontSize: "14px", color: "#B06080" }}>Kelola akun pelanggan dan persetujuan pendaftaran baru</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              background: "#C4788A",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#A85070"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#C4788A"}
          >
            👤 + Tambah Pelanggan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "2px solid #F0D9E0" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : "2px solid transparent",
              marginBottom: "-2px",
              padding: "10px 20px",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.85rem",
              fontWeight: activeTab === tab.id ? 700 : 400,
              color: activeTab === tab.id ? tab.color : "#B08090",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "color 0.2s, border-color 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                style={{
                  background: activeTab === tab.id ? tab.color : "#F0D9E0",
                  color: activeTab === tab.id ? "white" : "#B08090",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "10px",
                  minWidth: "18px",
                  textAlign: "center",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Pending ── */}
      {activeTab === "pending" && (
        <DataTable
          data={pending}
          loading={loadingTab === "pending"}
          onRefresh={() => loadTab("pending")}
          isRevalidating={revalidatingKeys.has("admin_customers_pending")}
          searchPlaceholder="Cari pendaftar, no telp, email..."
          searchableKeys={["name", "email", "phone_number"]}
          emptyMessage="Tidak ada pendaftaran yang menunggu persetujuan 🎉"
          columns={[
            {
              key: "name",
              header: "Pendaftar",
              sortable: true,
              render: (reg) => (
                <div>
                  <div style={{ fontWeight: 600, color: "#3A1A28" }}>{reg.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#B08090" }}>{reg.email}</div>
                </div>
              ),
            },
            {
              key: "phone_number",
              header: "No. WhatsApp",
              sortable: true,
              render: (reg) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#8A4060" }}>{reg.phone_number ?? "—"}</span>,
            },
            {
              key: "createdAt",
              header: "Tgl Daftar",
              sortable: true,
              sortValue: (reg) => new Date(reg.createdAt).getTime(),
              render: (reg) => <span style={{ fontSize: "0.75rem", color: "#8A4060" }}>{formatDate(reg.createdAt)}</span>,
            },
            {
              key: "action",
              header: "Aksi",
              align: "center",
              render: (reg) => (
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button
                    onClick={() => handleApprove(reg.id)}
                    disabled={isPending}
                    style={{ background: "#1A7A4A", color: "white", border: "none", padding: "5px 12px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600, cursor: isPending ? "not-allowed" : "pointer" }}
                  >
                    ✓ Setujui
                  </button>
                  <button
                    onClick={() => handleReject(reg.id)}
                    disabled={isPending}
                    style={{ background: "rgba(192,80,96,0.08)", color: "#C05060", border: "1px solid rgba(192,80,96,0.25)", padding: "5px 12px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600, cursor: isPending ? "not-allowed" : "pointer" }}
                  >
                    ✕ Tolak
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* ── TAB: Aktif ── */}
      {activeTab === "aktif" && (
        <DataTable
          data={customers}
          loading={loadingTab === "aktif"}
          onRefresh={() => loadTab("aktif")}
          isRevalidating={revalidatingKeys.has("admin_customers_aktif")}
          searchPlaceholder="Cari pelanggan aktif, email, no HP..."
          searchableKeys={["name", "email", "phone_number"]}
          emptyMessage="Belum ada pelanggan aktif yang ditemukan 🌸"
          columns={[
            {
              key: "name",
              header: "Pelanggan",
              sortable: true,
              render: (c) => (
                <div>
                  <div style={{ fontWeight: 600, color: "#3A1A28" }}>{c.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#B08090" }}>{c.email}</div>
                </div>
              ),
            },
            {
              key: "phone_number",
              header: "No. WhatsApp",
              sortable: true,
              render: (c) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#8A4060" }}>{c.phone_number ?? "—"}</span>,
            },
            {
              key: "createdAt",
              header: "Bergabung",
              sortable: true,
              sortValue: (c) => new Date(c.createdAt).getTime(),
              render: (c) => <span style={{ fontSize: "0.75rem", color: "#8A4060" }}>{formatDate(c.createdAt)}</span>,
            },
            {
              key: "total_booking",
              header: "Booking",
              sortable: true,
              sortValue: (c) => Number(c.total_booking),
              render: (c) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", color: "#C4728E", fontWeight: 600 }}>{c.total_booking}x</span>,
            },
            {
              key: "total_sewa",
              header: "Sewa Baju",
              sortable: true,
              sortValue: (c) => Number(c.total_sewa),
              render: (c) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", color: "#C9922A", fontWeight: 600 }}>{c.total_sewa}x</span>,
            },
          ]}
        />
      )}

      {/* ── TAB: Ditolak ── */}
      {activeTab === "ditolak" && (
        <DataTable
          data={rejected}
          loading={loadingTab === "ditolak"}
          onRefresh={() => loadTab("ditolak")}
          isRevalidating={revalidatingKeys.has("admin_customers_ditolak")}
          searchPlaceholder="Cari pendaftaran ditolak..."
          searchableKeys={["name", "email", "phone_number"]}
          emptyMessage="Tidak ada pendaftaran yang ditolak 🌸"
          columns={[
            {
              key: "name",
              header: "Pendaftar",
              sortable: true,
              render: (reg) => (
                <div>
                  <div style={{ fontWeight: 600, color: "#3A1A28" }}>{reg.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#B08090" }}>{reg.email}</div>
                </div>
              ),
            },
            {
              key: "phone_number",
              header: "No. WhatsApp",
              sortable: true,
              render: (reg) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#8A4060" }}>{reg.phone_number ?? "—"}</span>,
            },
            {
              key: "createdAt",
              header: "Tgl Daftar",
              sortable: true,
              sortValue: (reg) => new Date(reg.createdAt).getTime(),
              render: (reg) => <span style={{ fontSize: "0.75rem", color: "#8A4060" }}>{formatDate(reg.createdAt)}</span>,
            },
          ]}
        />
      )}
      {/* Create Customer Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            overflowY: "auto",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "28px",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "460px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "#6B3A2A",
                marginBottom: "20px",
                borderBottom: "1px solid #EDD8CC",
                paddingBottom: "10px",
              }}
            >
              Tambah Pelanggan Baru
            </h2>

            {modalError && (
              <div
                style={{
                  background: "rgba(192,80,96,0.07)",
                  border: "1px solid rgba(192,80,96,0.2)",
                  color: "#C05060",
                  padding: "10px 14px",
                  fontSize: "0.8rem",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontFamily: "'DM Sans', sans-serif"
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", display: "block", marginBottom: "4px" }}>NAMA LENGKAP</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama Lengkap Pelanggan"
                  style={{ width: "100%", padding: "10px", border: "1px solid #EDD8CC", borderRadius: "6px", fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", display: "block", marginBottom: "4px" }}>EMAIL</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  style={{ width: "100%", padding: "10px", border: "1px solid #EDD8CC", borderRadius: "6px", fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", display: "block", marginBottom: "4px" }}>NOMOR WHATSAPP</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  style={{ width: "100%", padding: "10px", border: "1px solid #EDD8CC", borderRadius: "6px", fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", display: "block", marginBottom: "4px" }}>PASSWORD</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  style={{ width: "100%", padding: "10px", border: "1px solid #EDD8CC", borderRadius: "6px", fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6B3A2A", display: "block", marginBottom: "4px" }}>KONFIRMASI PASSWORD</label>
                <input
                  type="password"
                  required
                  value={newConfirmPassword}
                  onChange={(e) => setNewConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  style={{ width: "100%", padding: "10px", border: "1px solid #EDD8CC", borderRadius: "6px", fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={modalLoading}
                  style={{
                    background: "none",
                    border: "1px solid #EDD8CC",
                    color: "#8B6A5A",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif"
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  style={{
                    background: modalLoading ? "#B8896A" : "#6B3A2A",
                    color: "white",
                    border: "none",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: modalLoading ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif"
                  }}
                >
                  {modalLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}