"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ServiceCard from "@/components/ui/ServiceCard";
import SectionLabel from "@/components/ui/SectionLabel";
import DividerOrnament from "@/components/ui/DividerOrnament";
import type { Service } from "@/types";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function getServiceDesc(name: string) {
  const n = name.toLowerCase();
  if (n.includes("haircut") || n.includes("potong")) return "Potong rambut stylish sesuai keinginan Anda oleh hair stylist berpengalaman.";
  if (n.includes("color") || n.includes("warna") || n.includes("semir")) return "Pewarnaan rambut trendi dengan produk berkualitas yang menjaga kesehatan rambut.";
  if (n.includes("facial") || n.includes("skincare") || n.includes("kulit")) return "Perawatan kulit wajah terbaik untuk kesegaran dan kesehatan kulit alami.";
  if (n.includes("creambath") || n.includes("spa") || n.includes("treatment")) return "Pijatan relaksasi kepala dan nutrisi mendalam untuk kekuatan dan keindahan rambut.";
  if (n.includes("makeup") || n.includes("rias") || n.includes("wisuda")) return "Rias wajah profesional flawless untuk hari istimewa, wisuda, pesta, atau pernikahan.";
  if (n.includes("rebonding") || n.includes("smoothing") || n.includes("catok")) return "Pelurusan rambut aman dengan hasil lurus berkilau alami dan tahan lama.";
  return `Layanan ${name} berkualitas tinggi untuk menunjang penampilan dan kecantikan Anda di Irma Salon.`;
}

export default function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Carousel states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(3);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        const mapped = data.map((row: any) => ({
          id: row.id,
          name: row.service_name,
          desc: getServiceDesc(row.service_name),
          price: `${row.is_price_variable ? "Mulai " : ""}${formatRupiah(Number(row.price))}`,
          image: row.image_url || "https://hyninbeauty.id/wp-content/uploads/2023/10/8.-8-Manfaat-Hair-Treatment-di-Salon-Wajib-Kamu-Ketahui-1.jpg",
          duration: `${Math.round(Number(row.hour_duration) * 60)} menit`,
        }));
        setServices(mapped);
      })
      .catch((err) => console.error("[ServicesSection] error fetching data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Determine cards to show based on screen width
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      if (w >= 1024) {
        setCardsToShow(3);
      } else if (w >= 768) {
        setCardsToShow(2);
      } else {
        setCardsToShow(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, services.length - cardsToShow);

  // Keep currentIndex in bounds if screen resized and maxIndex changed
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    // Require at least 40px swipe to register
    if (diffX > 40) {
      handleNext();
    } else if (diffX < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <section id="layanan" style={{ padding: "100px 5%", background: "white", overflow: "hidden" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <SectionLabel>Apa yang kami tawarkan</SectionLabel>
          <DividerOrnament />
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#2C1A0E",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Layanan Unggulan Kami
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "#8B6A5A",
              marginTop: "16px",
              fontSize: "1rem",
              maxWidth: "500px",
              margin: "16px auto 0",
              lineHeight: 1.7,
            }}
          >
            Dari perawatan kecantikan hingga rias wajah, semua bisa kamu
            booking online dengan mudah.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ padding: "80px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
            Memuat layanan...
          </div>
        ) : services.length === 0 ? (
          <div style={{ padding: "80px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
            Layanan kecantikan belum tersedia.
          </div>
        ) : (
          /* Carousel Wrapper */
          <div 
            style={{ position: "relative", marginBottom: "30px", padding: "0 10px" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Style to hide webkit scrollbars */}
            <style dangerouslySetInnerHTML={{ __html: `
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}} />

            {/* Viewport Container */}
            <div 
              className="hide-scrollbar"
              style={{ 
                overflowX: "hidden", 
                margin: "0 -12px", 
                padding: "10px 0",
              }}
            >
              {/* Slider Track */}
              <div
                style={{
                  display: "flex",
                  transform: `translateX(-${currentIndex * (100 / services.length)}%)`,
                  transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  width: `calc(100% * ${services.length} / ${cardsToShow})`,
                  gap: "0",
                  padding: "0",
                  willChange: "transform",
                }}
              >
                {services.map((service) => (
                  <div
                    key={service.id}
                    style={{
                      flex: `0 0 calc(100% / ${services.length})`,
                      padding: "0 12px",
                      boxSizing: "border-box",
                    }}
                  >
                    <ServiceCard service={service} />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            {!isMobile && services.length > cardsToShow && (
              <>
                {/* Prev Button */}
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: cardsToShow === 1 ? "15px" : "-20px",
                    transform: "translateY(-50%)",
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    background: "white",
                    border: "1px solid #EDD8CC",
                    boxShadow: "0 4px 12px rgba(107,58,42,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    zIndex: 10,
                    color: "#6B3A2A",
                    opacity: currentIndex === 0 ? 0.4 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (currentIndex !== 0) {
                      e.currentTarget.style.background = "#FDFAF7";
                      e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                  }}
                  aria-label="Previous services"
                >
                  <ChevronLeft size={24} />
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={currentIndex === maxIndex}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: cardsToShow === 1 ? "15px" : "-20px",
                    transform: "translateY(-50%)",
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    background: "white",
                    border: "1px solid #EDD8CC",
                    boxShadow: "0 4px 12px rgba(107,58,42,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: currentIndex === maxIndex ? "not-allowed" : "pointer",
                    zIndex: 10,
                    color: "#6B3A2A",
                    opacity: currentIndex === maxIndex ? 0.4 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (currentIndex !== maxIndex) {
                      e.currentTarget.style.background = "#FDFAF7";
                      e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                  }}
                  aria-label="Next services"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Carousel Dots Indicators — shown on all screen sizes */}
            {services.length > cardsToShow && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "24px",
                }}
              >
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      width: currentIndex === idx ? "24px" : "8px",
                      height: "8px",
                      borderRadius: "4px",
                      background: currentIndex === idx ? "#6B3A2A" : "#EDD8CC",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}