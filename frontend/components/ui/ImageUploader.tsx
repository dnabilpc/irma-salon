"use client";

import { useState, useRef, useEffect } from "react";
import { uploadAdminImage } from "@/actions/admin";
import { compressImage } from "@/lib/utils";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder: "outfits" | "vto" | "services" | "general";
  filenamePrefix: string;
  label: string;
  aspectRatio?: string; // e.g. "3/4" or "16/9"
}

export default function ImageUploader({
  value,
  onChange,
  folder,
  filenamePrefix,
  label,
  aspectRatio = "4/3",
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle image upload process
  const processImageUpload = async (base64Data: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await uploadAdminImage(base64Data, folder, filenamePrefix);
      if (res.success && res.data?.imageUrl) {
        onChange(res.data.imageUrl);
      } else {
        setError(res.error ?? "Gagal mengunggah gambar.");
      }
    } catch {
      setError("Terjadi kesalahan koneksi saat mengunggah.");
    } finally {
      setLoading(false);
    }
  };

  // Convert File object to base64, compress and upload
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG, PNG, WebP).");
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      processImageUpload(compressedBase64);
    } catch (err) {
      console.error("[handleFile] Compression failed:", err);
      // Fallback to original image if compression fails
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          processImageUpload(reader.result);
        }
      };
    }
  };

  // File drop/drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Camera capture methods
  const startCamera = async () => {
    setIsCameraActive(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setError("Gagal mengakses kamera perangkat.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const context = canvas.getContext("2d");
      if (context) {
        // Handle mirror if front camera (optional, we keep it natural)
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL("image/jpeg");
        stopCamera();
        processImageUpload(base64Data);
      }
    }
  };

  return (
    <div style={{ marginBottom: "16px", fontFamily: "'DM Sans', sans-serif" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "#7A5C50",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>

      {/* Main Container with Aspect Ratio */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: aspectRatio,
          background: "#FDFAF9",
          border: dragActive
            ? "2px dashed #C9922A"
            : "2px dashed #EDD8CC",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transition: "all 0.2s ease",
          boxShadow: dragActive ? "0 4px 20px rgba(201,146,42,0.08)" : "none",
        }}
      >
        {/* Hidden native input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileInputChange}
          disabled={loading || isCameraActive}
        />

        {/* LOADING STATE */}
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(253,250,249,0.85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid rgba(107,58,42,0.1)",
                borderTopColor: "#6B3A2A",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span style={{ fontSize: "0.8rem", color: "#6B3A2A", fontWeight: 500 }}>
              Mengunggah ke Storage...
            </span>
            <style jsx global>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* CAMERA SCREEN */}
        {isCameraActive && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "black",
              display: "flex",
              flexDirection: "column",
              zIndex: 5,
            }}
          >
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", flex: 1 }}
            />
            <div
              style={{
                padding: "12px",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                background: "rgba(0,0,0,0.85)",
              }}
            >
              <button
                type="button"
                onClick={capturePhoto}
                style={{
                  background: "#C9922A",
                  color: "white",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📸 Ambil Foto
              </button>
              <button
                type="button"
                onClick={stopCamera}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.25)",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW IMAGE STATE */}
        {value ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded file"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                display: "flex",
                gap: "6px",
                background: "rgba(255,255,255,0.9)",
                padding: "6px 10px",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6B3A2A",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Ganti
              </button>
              <span style={{ color: "#EDD8CC" }}>|</span>
              <button
                type="button"
                onClick={startCamera}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#C9922A",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Kamera
              </button>
              <span style={{ color: "#EDD8CC" }}>|</span>
              <button
                type="button"
                onClick={() => onChange("")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#D94060",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        ) : (
          /* DEFAULT IDLE STATE */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
              width: "100%",
              height: "100%",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🖼️</div>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6B3A2A", margin: 0 }}>
              Pilih file gambar atau seret kesini
            </p>
            <p style={{ fontSize: "0.68rem", color: "#8B6A5A", marginTop: "4px", marginBottom: "14px" }}>
              Mendukung file PNG, JPG, JPEG, WebP
            </p>

            {/* Quick action buttons (bypass click container event) */}
            <div
              style={{ display: "flex", gap: "8px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "#6B3A2A",
                  color: "white",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Pilih File
              </button>
              <button
                type="button"
                onClick={startCamera}
                style={{
                  background: "transparent",
                  border: "1px solid #C9922A",
                  color: "#C9922A",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📸 Ambil Kamera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ERROR FEEDBACK */}
      {error && (
        <p style={{ color: "#D94060", fontSize: "0.7rem", marginTop: "5px", fontWeight: 500 }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
