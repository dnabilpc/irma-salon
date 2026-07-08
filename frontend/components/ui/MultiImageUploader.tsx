"use client";

import { useState, useRef, useEffect } from "react";
import { uploadAdminImage } from "@/actions/admin";
import { compressImage } from "@/lib/utils";

interface MultiImageUploaderProps {
  value: string[]; // Array of image URLs
  onChange: (urls: string[]) => void;
  folder: "outfits" | "vto" | "services" | "general";
  filenamePrefix: string;
  label: string;
}

export default function MultiImageUploader({
  value = [],
  onChange,
  folder,
  filenamePrefix,
  label,
}: MultiImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
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

  const handleUploadSingleBase64 = async (base64Data: string): Promise<string | null> => {
    try {
      const res = await uploadAdminImage(base64Data, folder, filenamePrefix);
      if (res.success && res.data?.imageUrl) {
        return res.data.imageUrl;
      } else {
        console.error("Upload failed:", res.error);
        return null;
      }
    } catch (err) {
      console.error("Upload connection error:", err);
      return null;
    }
  };

  const processFiles = async (files: FileList) => {
    setError(null);
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setError("Pilih setidaknya satu file gambar (JPG, PNG, WebP).");
      return;
    }

    const localUrls: string[] = [];

    for (const file of validFiles) {
      let base64 = "";
      try {
        base64 = await compressImage(file);
      } catch (err) {
        console.error("Compression failed:", err);
        // Fallback to original file
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => resolve(reader.result as string);
        });
      }
      localUrls.push(base64);
    }

    if (localUrls.length > 0) {
      onChange([...value, ...localUrls]);
    }
  };

  // Drag handlers
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
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

  const capturePhoto = async () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL("image/jpeg");
        stopCamera();
        
        onChange([...value, base64Data]);
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div style={{ marginBottom: "20px", fontFamily: "'DM Sans', sans-serif" }}>
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

      {/* Grid of existing images + upload zone */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        
        {/* Previews Row */}
        {value.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: "10px",
              background: "#FDFAF9",
              border: "1px solid #EDD8CC",
              padding: "12px",
              borderRadius: "10px",
            }}
          >
            {value.map((url, idx) => (
              <div
                key={url + "-" + idx}
                style={{
                  position: "relative",
                  aspectRatio: "1/1",
                  borderRadius: "8px",
                  border: "1px solid #EDD8CC",
                  overflow: "hidden",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Gallery preview ${idx + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "rgba(217, 64, 96, 0.9)",
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  }}
                  aria-label="Hapus gambar"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drop Zone Box */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={{
            position: "relative",
            width: "100%",
            height: "110px",
            background: "#FDFAF9",
            border: dragActive ? "2px dashed #C9922A" : "2px dashed #EDD8CC",
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
            multiple
            style={{ display: "none" }}
            onChange={handleFileInputChange}
            disabled={uploadingCount > 0 || isCameraActive}
          />

          {/* LOADING STATE */}
          {uploadingCount > 0 && (
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
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  border: "2.5px solid rgba(107,58,42,0.1)",
                  borderTopColor: "#6B3A2A",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#6B3A2A", fontWeight: 500 }}>
                Mengunggah {uploadingCount} file tersisa...
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
                  padding: "8px",
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
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
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
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* DEFAULT IDLE STATE */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
              textAlign: "center",
              cursor: "pointer",
              width: "100%",
              height: "100%",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6B3A2A", margin: "0 0 4px 0" }}>
              🖼️ Seret gambar ke sini atau klik untuk memilih file
            </p>
            <p style={{ fontSize: "0.62rem", color: "#8B6A5A", margin: "0 0 10px 0" }}>
              Bisa memilih beberapa file gambar sekaligus
            </p>

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
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Pilih Banyak File
              </button>
              <button
                type="button"
                onClick={startCamera}
                style={{
                  background: "transparent",
                  border: "1px solid #C9922A",
                  color: "#C9922A",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📸 Gunakan Kamera
              </button>
            </div>
          </div>
        </div>
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
