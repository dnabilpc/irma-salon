"use client";

import { useEffect, useState } from "react";

interface Holiday {
  id: number;
  start_datetime: string;
  end_datetime: string;
  reason: string;
}

export default function AnnouncementBanner() {
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Fetch settings and check for upcoming holidays
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.upcoming_holidays && Array.isArray(data.upcoming_holidays) && data.upcoming_holidays.length > 0) {
          const nearestHoliday = data.upcoming_holidays[0] as Holiday;
          
          // Check if already dismissed
          const isDismissed = localStorage.getItem(`dismissed_holiday_${nearestHoliday.id}`) === "true";
          if (!isDismissed) {
            setHoliday(nearestHoliday);
            setDismissed(false);
          }
        }
      })
      .catch((err) => console.error("Failed to load holiday announcements:", err));
  }, []);

  if (dismissed || !holiday) return null;

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const startStr = formatDate(holiday.start_datetime);
  const endStr = formatDate(holiday.end_datetime);
  
  // Format range
  const startDay = holiday.start_datetime.split("T")[0];
  const endDay = holiday.end_datetime.split("T")[0];
  const dateRangeDisplay = startDay === endDay ? startStr : `${startStr} s.d ${endStr}`;

  const handleDismiss = () => {
    localStorage.setItem(`dismissed_holiday_${holiday.id}`, "true");
    setDismissed(true);
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #6B3A2A 0%, #8E5441 50%, #C9922A 100%)",
        color: "white",
        fontSize: "0.82rem",
        padding: "10px 48px 10px 24px",
        textAlign: "center",
        position: "relative",
        zIndex: 9999,
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 2px 10px rgba(107,58,42,0.15)",
        animation: "slideDown 0.4s ease-out",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        lineHeight: 1.5
      }}
    >
      <span style={{ fontSize: "1.05rem" }}>📢</span>
      <span>
        <strong>Pemberitahuan:</strong> Rumah Cantik Irma akan tutup sementara pada <strong>{dateRangeDisplay}</strong> karena <em>{holiday.reason}</em>. Booking dan pelayanan salon pada tanggal tersebut tidak tersedia.
      </span>

      <button
        onClick={handleDismiss}
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
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
      >
        ✕
      </button>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
