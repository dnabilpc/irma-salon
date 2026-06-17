// components/layout/public/VtoNotificationAlert.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface UnnotifiedTask {
  id: number;
  status: "completed" | "failed";
  outfit_name: string | null;
  result_image_url: string | null;
  error_message: string | null;
}

export default function VtoNotificationAlert() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTask, setActiveTask] = useState<UnnotifiedTask | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/vto/unnotified");
      if (!res.ok) return;

      const data = (await res.json()) as UnnotifiedTask[];
      if (data && data.length > 0) {
        setActiveTask(data[0]);
        setDismissed(false);
      } else {
        setActiveTask(null);
        setDismissed(true);
      }
    } catch (err) {
      console.error("Failed to check VTO notifications:", err);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      // Do NOT call setState here — state will not be rendered when session is null
      // because the render guard below returns null when !session.
      return;
    }

    // Defer initial check so setState runs outside the synchronous effect body
    const initialCheck = setTimeout(checkNotifications, 0);

    // Poll every 20 seconds
    pollIntervalRef.current = setInterval(checkNotifications, 20000);

    return () => {
      clearTimeout(initialCheck);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [session, checkNotifications]);

  if (!session || dismissed || !activeTask) return null;

  const handleDismiss = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Optimistic dismiss
    setDismissed(true);

    try {
      await fetch(`/api/vto/status/${activeTask.id}/read`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to mark VTO notification as read:", err);
    }
  };

  const handleViewResults = async () => {
    await handleDismiss();
    router.push("/dashboard?section=vto");
  };

  const isSuccess = activeTask.status === "completed";

  return (
    <div
      style={{
        background: isSuccess
          ? "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #C4728E 100%)"
          : "linear-gradient(135deg, #7F1D1D 0%, #C05060 50%, #8E5441 100%)",
        color: "white",
        fontSize: "0.82rem",
        padding: "10px 48px 10px 24px",
        textAlign: "center",
        position: "relative",
        zIndex: 9998,
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 2px 10px rgba(79,70,229,0.15)",
        animation: "slideDownVto 0.4s ease-out",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        lineHeight: 1.5,
      }}
    >
      <span style={{ fontSize: "1.05rem" }}>{isSuccess ? "✨" : "⚠️"}</span>
      <span>
        {isSuccess ? (
          <>
            Virtual Try-On untuk baju <strong>{activeTask.outfit_name || "yang dipilih"}</strong> berhasil selesai dibuat!{" "}
            <button
              onClick={handleViewResults}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 600,
                fontSize: "0.78rem",
                marginLeft: "6px",
                textDecoration: "underline",
              }}
            >
              Lihat Hasil di Dashboard
            </button>
          </>
        ) : (
          <>
            Virtual Try-On untuk baju <strong>{activeTask.outfit_name || "yang dipilih"}</strong> gagal diproses.{" "}
            <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>({activeTask.error_message || "Kesalahan server"})</span>
          </>
        )}
      </span>

      <button
        onClick={(e) => handleDismiss(e)}
        style={{
          position: "absolute",
          right: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.15)",
          border: "none",
          color: "white",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "0.75rem",
          fontWeight: "bold",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
      >
        ✕
      </button>

      <style>{`
        @keyframes slideDownVto {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
