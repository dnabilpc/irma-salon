"use client";

// app/(public)/virtual-try-on/page.tsx

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getMyVtoStatus } from "@/actions/vto";
import type { VtoStatus } from "@/actions/vto";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────

interface Outfit {
  id: number;
  outfit_name: string;
  description: string | null;
  price: number;
  size: string | null;
  image_url: string | null;
  model_2d_file_link: string | null;
  outfit_category_id: number;
  category_name: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ── VTO Quota Bar ──────────────────────────────────────────────────────────

function VtoQuotaBar({ status }: { status: VtoStatus }) {
  const pct = status.limit > 0 ? (status.remaining / status.limit) * 100 : 0;
  const color = pct > 50 ? "#5A9E7A" : pct > 20 ? "#C9922A" : "#C05060";

  return (
    <div style={{
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "12px",
      padding: "14px 18px",
      marginBottom: "24px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Kuota Virtual Try-On
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", color, fontWeight: 600 }}>
          {status.remaining} / {status.limit} tersisa
        </span>
      </div>
      <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.5s ease" }} />
      </div>
      <div style={{ marginTop: "6px", fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
        Reset otomatis: {formatDate(status.next_reset)} · atau saat transaksi sewa selesai
      </div>
    </div>
  );
}

// ── Camera/Upload Component ────────────────────────────────────────────────

function PhotoSelector({
  onPhotoSelected,
  selectedPhoto,
}: {
  onPhotoSelected: (file: File, preview: string) => void;
  selectedPhoto: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"idle" | "camera" | "preview">("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  async function startCamera() {
    setCameraError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      setStream(s);
      setMode("camera");
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = s;
      }, 100);
    } catch {
      setCameraError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      stopCamera();
      setMode("preview");
      onPhotoSelected(file, url);
    }, "image/jpeg", 0.92);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMode("preview");
    onPhotoSelected(file, url);
  }

  function resetPhoto() {
    setMode("idle");
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Preview mode
  if (selectedPhoto && mode === "preview") {
    return (
      <div style={{ position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={selectedPhoto}
          alt="Foto kamu"
          style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "12px", display: "block" }}
        />
        <button
          onClick={resetPhoto}
          style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(44,26,14,0.7)", border: "1px solid rgba(255,255,255,0.2)",
            color: "white", cursor: "pointer", width: "32px", height: "32px",
            borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >✕</button>
        <div style={{
          position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(90,158,122,0.9)", color: "white", fontSize: "0.7rem",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 600, padding: "4px 12px",
          borderRadius: "20px", whiteSpace: "nowrap",
        }}>
          ✓ Foto siap
        </div>
      </div>
    );
  }

  // Camera mode
  if (mode === "camera") {
    return (
      <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#000", aspectRatio: "3/4" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Guide overlay */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            width: "60%", height: "80%", border: "2px dashed rgba(255,255,255,0.4)",
            borderRadius: "50% 50% 45% 45%",
          }} />
        </div>

        {/* Controls */}
        <div style={{ position: "absolute", bottom: "16px", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "12px" }}>
          <button
            onClick={() => { stopCamera(); setMode("idle"); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "10px 20px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", cursor: "pointer", backdropFilter: "blur(8px)" }}
          >
            Batal
          </button>
          <button
            onClick={capturePhoto}
            style={{ background: "white", border: "none", color: "#2C1A0E", padding: "10px 28px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
          >
            📸 Ambil Foto
          </button>
        </div>
      </div>
    );
  }

  // Idle mode
  return (
    <div>
      {cameraError && (
        <div style={{ background: "rgba(192,80,96,0.1)", border: "1px solid rgba(192,80,96,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", fontSize: "0.78rem", color: "#E8A89C", fontFamily: "'DM Sans', sans-serif" }}>
          ⚠️ {cameraError}
        </div>
      )}
      <div style={{
        border: "2px dashed rgba(255,255,255,0.15)", borderRadius: "12px",
        aspectRatio: "3/4", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "20px",
        background: "rgba(255,255,255,0.03)",
      }}>
        <div style={{ fontSize: "3rem", opacity: 0.4 }}>🤳</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.6, padding: "0 20px" }}>
          Ambil selfie atau upload foto dirimu<br />
          <span style={{ fontSize: "0.72rem", opacity: 0.6 }}>Gunakan foto full body untuk hasil terbaik</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "80%" }}>
          <button
            onClick={startCamera}
            style={{ background: "rgba(201,146,42,0.15)", border: "1px solid rgba(201,146,42,0.4)", color: "#C9922A", padding: "11px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,146,42,0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(201,146,42,0.15)")}
          >
            📸 Buka Kamera
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", padding: "11px", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            📁 Upload Foto
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
      </div>
    </div>
  );
}

// ── Outfit Card ────────────────────────────────────────────────────────────

function OutfitCard({
  outfit,
  selected,
  onSelect,
}: {
  outfit: Outfit;
  selected: boolean;
  onSelect: () => void;
}) {
  const hasVto = !!outfit.model_2d_file_link;

  return (
    <div
      onClick={hasVto ? onSelect : undefined}
      style={{
        background: selected ? "rgba(201,146,42,0.12)" : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${selected ? "#C9922A" : hasVto ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
        borderRadius: "10px",
        overflow: "hidden",
        cursor: hasVto ? "pointer" : "not-allowed",
        transition: "all 0.2s",
        opacity: hasVto ? 1 : 0.45,
        position: "relative",
      }}
      onMouseEnter={(e) => { if (hasVto && !selected) (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,146,42,0.5)"; }}
      onMouseLeave={(e) => { if (hasVto && !selected) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
    >
      {/* Gambar */}
      <div style={{ height: "140px", background: "rgba(255,255,255,0.04)", overflow: "hidden", position: "relative" }}>
        {outfit.image_url ? (
          <div style={{ position: "absolute", inset: 0 }}>
            <Image src={outfit.image_url} alt={outfit.outfit_name} fill style={{ objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>👗</div>
        )}
        {selected && (
          <div style={{ position: "absolute", top: "8px", right: "8px", width: "22px", height: "22px", borderRadius: "50%", background: "#C9922A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "white", fontWeight: 700 }}>
            ✓
          </div>
        )}
        {!hasVto && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif", textAlign: "center", lineHeight: 1.4 }}>
              Virtual Try-On belum tersedia untuk baju ini
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {outfit.outfit_name}
        </div>
        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
          {outfit.category_name}
        </div>
      </div>
    </div>
  );
}

// ── Result Display ─────────────────────────────────────────────────────────

function VtoResult({
  imageUrl,
  description,
  outfitName,
  onReset,
}: {
  imageUrl: string;
  description: string | null;
  outfitName: string;
  onReset: () => void;
}) {
  function handleDownload() {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `virtual-tryon-${outfitName.replace(/\s+/g, "-").toLowerCase()}.jpg`;
    link.target = "_blank";
    link.click();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "4px" }}>
          ✨ Hasil Virtual Try-On
        </div>
        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
          {outfitName}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: "400px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Hasil Virtual Try-On"
            width={800}
            height={1000}
            unoptimized
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        ) : (
          <div style={{ padding: "40px", color: "rgba(255,255,255,0.4)", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
            Gambar hasil tidak ditemukan.
          </div>
        )}
      </div>



      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={handleDownload}
          style={{
            background: "#C9922A", color: "white", border: "none",
            padding: "12px 28px", borderRadius: "8px",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#A07010")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C9922A")}
        >
          ⬇ Download Foto
        </button>
        <button
          onClick={onReset}
          style={{
            background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "12px 28px", borderRadius: "8px",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem",
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        >
          Coba Baju Lain
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function VirtualTryOnPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0F0C0A", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9922A", fontFamily: "'DM Sans', sans-serif" }}>Memuat Virtual Try-On...</div>}>
      <VirtualTryOnContent />
    </Suspense>
  );
}

function VirtualTryOnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const outfitIdParam = searchParams.get("outfitId");
  const { data: session, isPending } = useSession();

  const [vtoStatus, setVtoStatus] = useState<VtoStatus | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [categories, setCategories] = useState<{ id: number; category_name: string }[]>([]);
  const [filterCat, setFilterCat] = useState("all");
  const [loadingData, setLoadingData] = useState(true);

  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [activeTasks, setActiveTasks] = useState<{ id: number; outfitName: string; status: string }[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultDescription, setResultDescription] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Load data
  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch("/api/outfits").then((r) => r.json()),
      getMyVtoStatus(),
    ]).then(([outfitData, vtoData]) => {
      const loadedOutfits = outfitData.outfits ?? [];
      setOutfits(loadedOutfits);
      setCategories(outfitData.categories ?? []);
      if (vtoData.success && vtoData.data) setVtoStatus(vtoData.data);
      setLoadingData(false);

      if (outfitIdParam && loadedOutfits.length > 0) {
        const matching = loadedOutfits.find((o: Outfit) => String(o.id) === outfitIdParam);
        if (matching && matching.model_2d_file_link) {
          setSelectedOutfit(matching);
        }
      }
    });
  }, [session, outfitIdParam]);

  // Background polling for active tasks queued on this page instance
  useEffect(() => {
    if (activeTasks.length === 0) return;

    const interval = setInterval(async () => {
      const updated = await Promise.all(
        activeTasks.map(async (task) => {
          if (task.status === "completed" || task.status === "failed") {
            return task;
          }
          try {
            const res = await fetch(`/api/vto/status/${task.id}`);
            if (!res.ok) return task;
            const data = await res.json();
            if (data.success && data.task) {
              return { ...task, status: data.task.status };
            }
          } catch (err) {
            console.error("Error polling background task status:", err);
          }
          return task;
        })
      );
      setActiveTasks(updated);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTasks]);

  const filteredOutfits = outfits.filter((o) =>
    filterCat === "all" || String(o.outfit_category_id) === filterCat
  );

  function handlePhotoSelected(file: File, preview: string) {
    setPersonFile(file);
    setPersonPreview(preview);
  }

  function resetAll() {
    setPersonFile(null);
    setPersonPreview(null);
    setSelectedOutfit(null);
    setResultUrl(null);
    setResultDescription(null);
    setError("");
  }

  async function handleStartVto() {
    if (!personFile || !selectedOutfit || !selectedOutfit.model_2d_file_link) return;
    if (!vtoStatus?.can_use) return;

    setSubmitting(true);
    setError("");

    try {
      // Validate quota
      const statusRes = await fetch("/api/vto/usage");
      const statusData = await statusRes.json();

      if (!statusRes.ok) {
        throw new Error(statusData.error ?? "Gagal memvalidasi kuota.");
      }

      if (!statusData.can_use) {
        throw new Error("Kuota Virtual Try-On habis.");
      }

      // Send payload
      const formData = new FormData();
      formData.append("person", personFile);
      formData.append("clothesUrl", selectedOutfit.model_2d_file_link);
      formData.append("outfitName", selectedOutfit.outfit_name);

      const response = await fetch("/api/vto/process", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.taskId) {
        throw new Error(data.error ?? "Gagal memproses virtual try-on.");
      }

      const taskId = data.taskId;

      // Add to active tasks and reset form
      setActiveTasks((prev) => [
        ...prev,
        { id: taskId, outfitName: selectedOutfit.outfit_name, status: "pending" },
      ]);

      // Reset inputs
      setPersonFile(null);
      setPersonPreview(null);
      setSelectedOutfit(null);

      // Refresh quota display
      const refreshQuotaRes = await fetch("/api/vto/usage");
      const refreshQuotaData = await refreshQuotaRes.json();
      if (refreshQuotaRes.ok) {
        setVtoStatus(refreshQuotaData);
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Auth check ──

  if (isPending) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1A0E06 0%, #2C1A0E 50%, #1A0E18 100%)" }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>Memuat...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1A0E06 0%, #2C1A0E 50%, #1A0E18 100%)", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✨</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.8rem", fontWeight: 700, color: "white", marginBottom: "12px" }}>
          Virtual Try-On
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", marginBottom: "32px", maxWidth: "360px", lineHeight: 1.7 }}>
          Kamu perlu login untuk menggunakan fitur Virtual Try-On.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => router.push("/login?callbackUrl=/virtual-try-on")}
            style={{ background: "#C9922A", color: "white", border: "none", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", borderRadius: "8px" }}>
            Login
          </button>
          <button onClick={() => router.push("/register")}
            style={{ background: "transparent", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)", padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", cursor: "pointer", borderRadius: "8px" }}>
            Daftar
          </button>
        </div>
      </div>
    );
  }

  // ── Result view ──

  if (resultUrl && selectedOutfit) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1A0E06 0%, #2C1A0E 50%, #1A0E18 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "100px 24px 60px",
      }}>
        <VtoResult imageUrl={resultUrl} description={resultDescription} outfitName={selectedOutfit.outfit_name} onReset={resetAll} />
      </div>
    );
  }

  // ── Main UI ──

  const canProceed = !!personFile && !!selectedOutfit && !!vtoStatus?.can_use && !submitting;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1A0E06 0%, #2C1A0E 60%, #1A0E18 100%)",
      paddingTop: "88px",
      paddingBottom: "60px",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", letterSpacing: "0.25em", color: "#C9922A", textTransform: "uppercase", marginBottom: "10px" }}>
            Teknologi AI Fashion
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "white", marginBottom: "12px", lineHeight: 1.15 }}>
            Virtual Try-On
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
            Upload foto dirimu, pilih baju dari koleksi kami, dan lihat tampilanmu secara instan dengan teknologi AI.
          </p>
          <div style={{
            background: "rgba(201, 146, 42, 0.08)",
            border: "1px solid rgba(201, 146, 42, 0.25)",
            borderRadius: "10px",
            padding: "12px 18px",
            maxWidth: "600px",
            margin: "20px auto 0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textAlign: "left"
          }}>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>⚠️</span>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              <strong>Disclaimer:</strong> Virtual Try-On ini hanya bertujuan untuk visualisasi pakaian secara estetika dan tidak mempertimbangkan kecocokan antara ukuran baju (S, M, L, XL) dengan ukuran fisik tubuh Anda yang sebenarnya.
            </div>
          </div>
        </div>

        {/* Quota bar */}
        {vtoStatus && <VtoQuotaBar status={vtoStatus} />}

        {/* Quota habis */}
        {vtoStatus && !vtoStatus.can_use && (
          <div style={{
            background: "rgba(192,80,96,0.1)", border: "1px solid rgba(192,80,96,0.3)",
            borderRadius: "12px", padding: "16px 20px", marginBottom: "28px",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#E8A89C",
            lineHeight: 1.6,
          }}>
            ⚠️ Kuota Virtual Try-On kamu sudah habis. Kuota akan direset pada <strong>{formatDate(vtoStatus.next_reset)}</strong>, atau otomatis direset saat kamu menyelesaikan transaksi sewa baju.
          </div>
        )}

        {/* Main grid */}
        <div className="vto-main-grid">

          {/* Kiri: Upload foto */}
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: personFile ? "#5A9E7A" : "#C9922A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "white", fontWeight: 700, flexShrink: 0 }}>
                {personFile ? "✓" : "1"}
              </span>
              Foto Dirimu
            </div>
            <PhotoSelector onPhotoSelected={handlePhotoSelected} selectedPhoto={personPreview} />

            {/* Tips */}
            {!personFile && (
              <div style={{ marginTop: "14px", padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>
                  <strong style={{ color: "rgba(255,255,255,0.6)" }}>Tips foto terbaik:</strong><br />
                  ✦ Full body dari kepala hingga kaki<br />
                  ✦ Pose tegak dan terlihat jelas<br />
                  ✦ Pencahayaan cukup & latar bersih<br />
                  ✦ Hindari foto terlalu blur atau gelap
                </div>
              </div>
            )}
          </div>

          {/* Kanan: Pilih baju */}
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: selectedOutfit ? "#5A9E7A" : "rgba(255,255,255,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "white", fontWeight: 700, flexShrink: 0 }}>
                {selectedOutfit ? "✓" : "2"}
              </span>
              Pilih Baju
            </div>

            {/* Filter kategori */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button
                onClick={() => setFilterCat("all")}
                style={{ padding: "6px 14px", border: `1px solid ${filterCat === "all" ? "#C9922A" : "rgba(255,255,255,0.12)"}`, background: filterCat === "all" ? "rgba(201,146,42,0.15)" : "transparent", color: filterCat === "all" ? "#C9922A" : "rgba(255,255,255,0.5)", borderRadius: "20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}
              >
                Semua
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCat(String(c.id))}
                  style={{ padding: "6px 14px", border: `1px solid ${filterCat === String(c.id) ? "#C9922A" : "rgba(255,255,255,0.12)"}`, background: filterCat === String(c.id) ? "rgba(201,146,42,0.15)" : "transparent", color: filterCat === String(c.id) ? "#C9922A" : "rgba(255,255,255,0.5)", borderRadius: "20px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}
                >
                  {c.category_name}
                </button>
              ))}
            </div>

            {/* Grid baju */}
            {loadingData ? (
              <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem" }}>
                Memuat koleksi...
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px", maxHeight: "480px", overflowY: "auto", paddingRight: "4px" }}>
                {filteredOutfits.map((outfit) => (
                  <OutfitCard
                    key={outfit.id}
                    outfit={outfit}
                    selected={selectedOutfit?.id === outfit.id}
                    onSelect={() => setSelectedOutfit(outfit)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected outfit preview */}
        {selectedOutfit && (
          <div style={{
            marginTop: "24px", padding: "14px 18px",
            background: "rgba(201,146,42,0.08)", border: "1px solid rgba(201,146,42,0.25)",
            borderRadius: "10px", display: "flex", alignItems: "center", gap: "14px",
          }}>
            {selectedOutfit.image_url && (
              <Image src={selectedOutfit.image_url} alt={selectedOutfit.outfit_name} width={48} height={48} style={{ objectFit: "cover", borderRadius: "6px" }} />
            )}
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.9rem", fontWeight: 700, color: "white" }}>
                {selectedOutfit.outfit_name}
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
                {selectedOutfit.category_name}
              </div>
            </div>
            <button
              onClick={() => setSelectedOutfit(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "1rem" }}
            >✕</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(192,80,96,0.1)", border: "1px solid rgba(192,80,96,0.3)", borderRadius: "8px", fontSize: "0.82rem", color: "#E8A89C", fontFamily: "'DM Sans', sans-serif" }}>
            ⚠️ {error}
          </div>
        )}

        {/* CTA Button */}
        <div style={{ marginTop: "28px", display: "flex", justifyContent: "center" }}>
          <button
            onClick={handleStartVto}
            disabled={!canProceed}
            style={{
              background: canProceed ? "linear-gradient(135deg, #6B3A2A, #C9922A)" : "rgba(255,255,255,0.08)",
              color: canProceed ? "white" : "rgba(255,255,255,0.25)",
              border: "none",
              padding: "16px 48px",
              borderRadius: "10px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.9rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              cursor: canProceed ? "pointer" : "not-allowed",
              transition: "all 0.3s",
              boxShadow: canProceed ? "0 8px 32px rgba(201,146,42,0.25)" : "none",
            }}
            onMouseEnter={(e) => { if (canProceed) e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {submitting ? "Menyiapkan Antrean..." : !vtoStatus?.can_use ? "Kuota Habis" : !personFile ? "Upload foto dulu" : !selectedOutfit ? "Pilih baju dulu" : "✨ Mulai Virtual Try-On"}
          </button>
        </div>

        {/* Active VTO Tasks Queue Panel */}
        {activeTasks.length > 0 && (
          <div style={{
            marginTop: "32px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "20px 24px",
            maxWidth: "600px",
            width: "100%",
            margin: "32px auto 0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px" }}>
              <span style={{ fontSize: "1.1rem" }}>⏳</span>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: "white" }}>
                Antrean Virtual Try-On Aktif
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {activeTasks.map((task) => {
                let statusText = "Menunggu Antrean...";
                let statusColor = "rgba(255,255,255,0.5)";
                let isDone = task.status === "completed";
                let isFailed = task.status === "failed";
                let isProcessing = task.status === "processing";

                if (isProcessing) {
                  statusText = "AI Sedang memproses... (1-2 menit)";
                  statusColor = "#C9922A";
                } else if (isDone) {
                  statusText = "Selesai!";
                  statusColor = "#5A9E7A";
                } else if (isFailed) {
                  statusText = "Gagal";
                  statusColor = "#C05060";
                }

                return (
                  <div key={task.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ color: "rgba(255,255,255,0.8)" }}>
                      👗 {task.outfitName}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        color: statusColor,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        {isProcessing && (
                          <span style={{
                            width: "6px", height: "6px", borderRadius: "50%", background: "#C9922A",
                            animation: "pulse 1.2s infinite"
                          }} />
                        )}
                        {statusText}
                      </span>
                      {isDone && (
                        <button
                          onClick={() => {
                            fetch(`/api/vto/status/${task.id}/read`, { method: "POST" });
                            router.push("/dashboard?section=vto");
                          }}
                          style={{
                            background: "#C9922A",
                            border: "none",
                            color: "white",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Lihat Hasil
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <style>{`
        .vto-main-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .vto-main-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
      `}</style>
    </div>
  );
}