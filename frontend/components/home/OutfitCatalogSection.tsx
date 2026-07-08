"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";
import DividerOrnament from "@/components/ui/DividerOrnament";

interface Outfit {
  id: number;
  outfit_name: string;
  description: string | null;
  price: number;
  size: string | null;
  image_url: string | null;
  additional_image_urls: string[] | null;
  model_2d_file_link: string | null;
  outfit_category_id: number;
  category_name: string;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function OutfitCard({ outfit }: { outfit: Outfit }) {
  const [hovered, setHovered] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const allImages = [outfit.image_url, ...(outfit.additional_image_urls ?? [])].filter(Boolean) as string[];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (allImages.length > 1) {
      setActiveImgIdx((prev) => (prev + 1) % allImages.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (allImages.length > 1) {
      setActiveImgIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setActiveImgIdx(0);
      }}
      style={{
        background: "white",
        border: "1px solid #EDD8CC",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: hovered
          ? "0 16px 36px rgba(107,58,42,0.12)"
          : "0 4px 16px rgba(107,58,42,0.05)",
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Gambar Container - aspect ratio 3:4 portrait style */}
      <div
        style={{
          height: "340px",
          background: "linear-gradient(135deg, #FDF0E8, #FDF8F3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {allImages.length > 0 ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={allImages[activeImgIdx]}
            alt={`${outfit.outfit_name} - ${activeImgIdx + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              transform: hovered ? "scale(1.03)" : "scale(1)",
              transition: "transform 0.5s ease",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span style={{ fontSize: "5rem" }}>👗</span>
        )}

        {/* Navigation Arrows for Card Gallery */}
        {hovered && allImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.85)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#6B3A2A",
                zIndex: 2,
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImage}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.85)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#6B3A2A",
                zIndex: 2,
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
              aria-label="Foto berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Gallery Dots Indicators inside Card */}
        {allImages.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "4px",
              zIndex: 2,
              background: "rgba(0,0,0,0.3)",
              padding: "3px 8px",
              borderRadius: "10px",
              backdropFilter: "blur(2px)",
            }}
          >
            {allImages.map((_, i) => (
              <span
                key={i}
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: activeImgIdx === i ? "white" : "rgba(255,255,255,0.4)",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        )}

      </div>

      {/* Info Baju */}
      <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#2C1A0E",
            marginBottom: "2px",
          }}
        >
          {outfit.outfit_name}
        </h3>
        <div
          style={{
            fontSize: "0.62rem",
            color: "#C4788A",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          {outfit.category_name}
        </div>
        
        {outfit.description && (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.82rem",
              color: "#8B6A5A",
              marginBottom: "16px",
              lineHeight: 1.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              minHeight: "2.4em",
            }}
          >
            {outfit.description}
          </p>
        )}

        {/* Harga dan Ukuran */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            borderTop: "1px solid #EDD8CC",
            paddingTop: "14px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1rem", fontWeight: 700, color: "#6B3A2A" }}>
              {formatRupiah(outfit.price)}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "#8B6A5A" }}>per hari</div>
          </div>
          
          {outfit.size && (
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#6B3A2A",
                background: "#F5EDE0",
                padding: "4px 12px",
                borderRadius: "8px",
              }}
            >
              Size {outfit.size}
            </span>
          )}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/rent" style={{ flex: 1 }}>
            <button
              style={{
                width: "100%",
                background: "#6B3A2A",
                color: "white",
                border: "none",
                padding: "10px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "8px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#522C1F"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#6B3A2A"}
            >
              Sewa Baju
            </button>
          </Link>
          {outfit.model_2d_file_link && (
            <Link href="/virtual-try-on" style={{ flex: 1 }}>
              <button
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1.5px solid #C9922A",
                  color: "#C9922A",
                  padding: "8.5px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(201,146,42,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Try-On AI
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OutfitCatalogSection() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Carousel states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(4);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/outfits")
      .then((r) => r.json())
      .then((data) => {
        setOutfits(data.outfits ?? []);
      })
      .catch((err) => console.error("[OutfitCatalogSection] error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Determine cards to show based on screen width
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      if (w >= 1024) {
        setCardsToShow(4);
      } else if (w >= 768) {
        setCardsToShow(3);
      } else if (w >= 480) {
        setCardsToShow(2);
      } else {
        setCardsToShow(1);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Show up to 10 featured outfits in the carousel
  const featuredOutfits = outfits.slice(0, 10);
  const maxIndex = Math.max(0, featuredOutfits.length - cardsToShow);

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

  // Touch handlers for swipe support on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.touches[0].clientX;

    // Threshold of 50px for swipe
    if (diffX > 50) {
      handleNext();
      touchStartX.current = null;
    } else if (diffX < -50) {
      handlePrev();
      touchStartX.current = null;
    }
  };

  return (
    <section id="katalog" style={{ padding: "100px 5%", background: "#FDFAF7", overflow: "hidden" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
        
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <SectionLabel>Koleksi Baju Sewaan</SectionLabel>
          <DividerOrnament />
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#2C1A0E",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Tampil Menawan di Setiap Momen
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "#8B6A5A",
              marginTop: "16px",
              fontSize: "1rem",
              maxWidth: "600px",
              margin: "16px auto 0",
              lineHeight: 1.7,
            }}
          >
            Temukan kebaya, gaun pesta, dan busana premium lainnya. Coba langsung secara virtual sebelum menyewa!
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ padding: "80px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
            Memuat koleksi baju...
          </div>
        ) : featuredOutfits.length === 0 ? (
          <div style={{ padding: "80px", textAlign: "center", color: "#8B6A5A", fontFamily: "'DM Sans', sans-serif" }}>
            Koleksi belum tersedia.
          </div>
        ) : (
          /* Carousel Wrapper */
          <div 
            style={{ position: "relative", marginBottom: "50px", padding: "0 10px" }}
            onTouchStart={isMobile ? undefined : handleTouchStart}
            onTouchMove={isMobile ? undefined : handleTouchMove}
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
                overflowX: isMobile ? "auto" : "hidden", 
                margin: "0 -12px", 
                padding: "10px 0",
                scrollSnapType: isMobile ? "x mandatory" : "none",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Slider Track */}
              <div
                style={{
                  display: "flex",
                  transform: isMobile ? "none" : `translateX(-${currentIndex * (100 / cardsToShow)}%)`,
                  transition: isMobile ? "none" : "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  width: isMobile ? "auto" : `calc(100% * ${featuredOutfits.length} / ${cardsToShow})`,
                  gap: isMobile ? "16px" : "0",
                  padding: isMobile ? "0 24px" : "0",
                }}
              >
                {featuredOutfits.map((outfit) => (
                  /* Outer slide container mapping width dynamically */
                  <div
                    key={outfit.id}
                    style={{
                      flex: isMobile ? "0 0 78vw" : `0 0 calc(100% / ${featuredOutfits.length})`,
                      maxWidth: isMobile ? "320px" : "none",
                      padding: isMobile ? "0" : "0 12px",
                      boxSizing: "border-box",
                      scrollSnapAlign: isMobile ? "center" : "none",
                    }}
                  >
                    <OutfitCard outfit={outfit} />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows (Only show on Desktop if total outfits exceed visible capacity) */}
            {!isMobile && featuredOutfits.length > cardsToShow && (
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
                  aria-label="Previous outfits"
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
                  aria-label="Next outfits"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Carousel Dots Indicators */}
            {!isMobile && featuredOutfits.length > cardsToShow && (
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

        {/* View All Button */}
        {!loading && featuredOutfits.length > 0 && (
          <div style={{ textAlign: "center" }}>
            <Link href="/rent">
              <button
                className="btn-outline"
                style={{
                  fontSize: "0.88rem",
                  padding: "12px 36px",
                  borderColor: "#6B3A2A",
                  color: "#6B3A2A",
                }}
              >
                Lihat Semua Koleksi →
              </button>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
