// components/ui/ServiceCard.tsx
// Kartu layanan di ServicesSection — hover effect lift + accent bar
// Client Component karena ada useState untuk hover effect
"use client";

import { useState } from "react";
import type { Service } from "@/types";
import Image from "next/image";

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        padding: "36px 28px",
        border: `1px solid ${hovered ? "#E8A89C" : "#EDD8CC"}`,
        transition: "all 0.3s ease",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 48px rgba(107,58,42,0.12)"
          : "0 2px 8px rgba(107,58,42,0.04)",
      }}>
      {/* Accent bar kiri — muncul saat hover */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "3px",
          height: "100%",
          background: "#6B3A2A",
          transform: hovered ? "scaleY(1)" : "scaleY(0)",
          transition: "transform 0.3s ease",
          transformOrigin: "bottom",
        }}
      />

      {/* Badge "NEW" — hanya muncul jika service.isNew */}
      {service.isNew && (
        <span
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "#C9922A",
            color: "white",
            fontSize: "0.65rem",
            padding: "3px 10px",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            fontWeight: 600,
          }}>
          NEW
        </span>
      )}

      {/* Image */}
      <div style={{ marginBottom: "16px", borderRadius: "8px", overflow: "hidden", aspectRatio: "3/2" }}>
        <Image
          src={service.image}
          alt={service.name}
          width={300}
          height={200}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Nama layanan */}
      <h3
        style={{
          fontSize: "1.15rem",
          fontWeight: 700,
          marginBottom: "10px",
          color: "#2C1A0E",
          fontFamily: "'Playfair Display', Georgia, serif",
          transition: "color 0.2s",
        }}>
        {service.name}
      </h3>

      {/* Deskripsi */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.875rem",
          color: "#8B6A5A",
          lineHeight: 1.6,
          marginBottom: "20px",
          fontWeight: 300,
        }}>
        {service.desc}
      </p>

      {/* Footer kartu: harga + durasi */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #EDD8CC",
          paddingTop: "16px",
        }}>
        <span
          style={{
            fontWeight: 700,
            color: "#6B3A2A",
            fontSize: "0.9rem",
            fontFamily: "'DM Sans', sans-serif",
          }}>
          {service.price}
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.75rem",
            color: "#8B6A5A",
          }}>
          ⏱ {service.duration}
        </span>
      </div>
    </div>
  );
}
