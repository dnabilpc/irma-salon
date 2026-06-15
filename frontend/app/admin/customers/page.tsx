// app/admin/customers/page.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
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
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [search, setSearch]       = useState("");
  const [isPending, startTransition] = useTransition();

  const [customers,   setCustomers]   = useState<ActiveCustomer[]>([]);
  const [pending,     setPending]      = useState<PendingRegistration[]>([]);
  const [rejected,    setRejected]     = useState<PendingRegistration[]>([]);
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
      // Reset form
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("");
      setNewConfirmPassword("");
      // Reload active customers tab
      loadTab(activeTab);
    } else {
      setModalError(res.error || "Gagal membuat pelanggan baru.");
    }
  }

  const loadTab = useCallback(async (tab: Tab) => {
    setLoadingTab(tab);
    if (tab === "aktif") {
      const res = await fetchActiveCustomers();
      if (res.success) setCustomers(res.customers ?? []);
    } else if (tab === "pending") {
      const res = await fetchPendingRegistrations();
      if (res.success) setPending(res.registrations ?? []);
    } else {
      const res = await fetchRejectedRegistrations();
      if (res.success) setRejected(res.registrations ?? []);
    }
    setLoadingTab(null);
  }, []);

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
              background: "#6B3A2A",
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
            onMouseEnter={(e) => e.currentTarget.style.background = "#C9922A"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#6B3A2A"}
          >
            👤 + Tambah Pelanggan
          </button>
          <button
            className="btn-action-gold"
            onClick={() => loadTab(activeTab)}
            disabled={loadingTab !== null}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            🔄 Refresh
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

      {/* Search bar */}
      <div className="admin-card" style={{ padding: "14px 18px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#B08090", pointerEvents: "none" }}>🔍</span>
          <input
            className="search-input"
            placeholder="Cari nama, nomor HP, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── TAB: Pending ── */}
      {activeTab === "pending" && (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0D9E0", background: "rgba(201,146,42,0.05)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1rem" }}>⏳</span>
            <span style={{ fontSize: "13px", color: "#8A5A1A", fontWeight: 600 }}>
              {filteredPending.length} pendaftaran menunggu persetujuan
            </span>
          </div>

          {loadingTab === "pending" ? <Spinner /> : filteredPending.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#B08090", fontSize: "14px" }}>
              {pending.length === 0 ? "Tidak ada pendaftaran yang menunggu persetujuan 🎉" : "Tidak ada hasil yang cocok"}
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px 220px", padding: "10px 16px", background: "#FDF8F5", borderBottom: "1px solid #F0D9E0", fontSize: "11px", color: "#B08090", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                <span>Pendaftar</span>
                <span>No. WhatsApp</span>
                <span>Tgl Daftar</span>
                <span>Aksi</span>
              </div>
              {filteredPending.map((reg) => (
                <div
                  key={reg.id}
                  style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px 220px", padding: "14px 16px", borderBottom: "1px solid #F0D9E0", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#3A1A28" }}>{reg.name}</div>
                    <div style={{ fontSize: "12px", color: "#B08090" }}>{reg.email}</div>
                  </div>
                  <span style={{ fontSize: "13px", color: "#8A4060", fontFamily: "'DM Mono', monospace" }}>
                    {reg.phone_number ?? "—"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#8A4060" }}>{formatDate(reg.createdAt)}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleApprove(reg.id)}
                      disabled={isPending}
                      style={{
                        background: "#1A7A4A",
                        color: "white",
                        border: "none",
                        padding: "7px 14px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 600,
                        cursor: isPending ? "not-allowed" : "pointer",
                        opacity: isPending ? 0.7 : 1,
                        transition: "background 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.background = "#145C37"; }}
                      onMouseLeave={(e) => { if (!isPending) e.currentTarget.style.background = "#1A7A4A"; }}
                    >
                      ✓ Setujui
                    </button>
                    <button
                      onClick={() => handleReject(reg.id)}
                      disabled={isPending}
                      style={{
                        background: "rgba(192,80,96,0.08)",
                        color: "#C05060",
                        border: "1px solid rgba(192,80,96,0.25)",
                        padding: "7px 14px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 600,
                        cursor: isPending ? "not-allowed" : "pointer",
                        opacity: isPending ? 0.7 : 1,
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onMouseEnter={(e) => { if (!isPending) { e.currentTarget.style.background = "rgba(192,80,96,0.15)"; } }}
                      onMouseLeave={(e) => { if (!isPending) { e.currentTarget.style.background = "rgba(192,80,96,0.08)"; } }}
                    >
                      ✕ Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Aktif ── */}
      {activeTab === "aktif" && (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0D9E0", background: "#FDF8F5" }}>
            <span style={{ fontSize: "13px", color: "#B08090" }}>
              Menampilkan {filteredCustomers.length} dari {customers.length} pelanggan aktif
            </span>
          </div>

          {/* Header kolom */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 80px", padding: "10px 16px", background: "#FDF8F5", borderBottom: "1px solid #F0D9E0", fontSize: "11px", color: "#B08090", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            <span>Pelanggan</span>
            <span>No. WhatsApp</span>
            <span>Bergabung</span>
            <span>Booking</span>
            <span>Sewa</span>
          </div>

          {loadingTab === "aktif" ? <Spinner /> : filteredCustomers.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#B08090", fontSize: "14px" }}>
              {customers.length === 0 ? "Belum ada pelanggan aktif" : "Tidak ada hasil yang cocok"}
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <div
                key={c.id}
                style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 80px", padding: "14px 16px", borderBottom: "1px solid #F0D9E0", alignItems: "center" }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#3A1A28" }}>{c.name}</div>
                  <div style={{ fontSize: "12px", color: "#B08090" }}>{c.email}</div>
                </div>
                <span style={{ fontSize: "12px", color: "#8A4060", fontFamily: "'DM Mono', monospace" }}>{c.phone_number ?? "—"}</span>
                <span style={{ fontSize: "13px", color: "#8A4060" }}>{formatDate(c.createdAt)}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#C4728E", fontWeight: 600 }}>{c.total_booking}x</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#C9922A", fontWeight: 600 }}>{c.total_sewa}x</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: Ditolak ── */}
      {activeTab === "ditolak" && (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0D9E0", background: "rgba(192,80,96,0.04)" }}>
            <span style={{ fontSize: "13px", color: "#C05060", fontWeight: 600 }}>
              {filteredRejected.length} pendaftaran ditolak
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px 110px", padding: "10px 16px", background: "#FDF8F5", borderBottom: "1px solid #F0D9E0", fontSize: "11px", color: "#B08090", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            <span>Pendaftar</span>
            <span>No. WhatsApp</span>
            <span>Tgl Daftar</span>
            <span>Tgl Ditolak</span>
          </div>

          {loadingTab === "ditolak" ? <Spinner /> : filteredRejected.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#B08090", fontSize: "14px" }}>
              Tidak ada pendaftaran yang ditolak
            </div>
          ) : (
            filteredRejected.map((reg) => (
              <div
                key={reg.id}
                style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px 110px", padding: "14px 16px", borderBottom: "1px solid #F0D9E0", alignItems: "center" }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#3A1A28" }}>{reg.name}</div>
                  <div style={{ fontSize: "12px", color: "#B08090" }}>{reg.email}</div>
                </div>
                <span style={{ fontSize: "12px", color: "#8A4060", fontFamily: "'DM Mono', monospace" }}>{reg.phone_number ?? "—"}</span>
                <span style={{ fontSize: "12px", color: "#8A4060" }}>{formatDate(reg.createdAt)}</span>
                <span style={{ fontSize: "12px", color: "#C05060" }}>{formatDate(reg.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .admin-card div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
            gap: 4px;
          }
        }
      `}</style>
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
          }}
        >
          <div
            style={{
              background: "white",
              padding: "28px",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              position: "relative",
              margin: "20px"
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