import Navbar from "@/components/layout/public/Navbar";
import Footer from "@/components/layout/public/Footer";
import AnnouncementBanner from "@/components/layout/public/AnnouncementBanner";
import VtoNotificationAlert from "@/components/layout/public/VtoNotificationAlert";
import { PUBLIC_STYLES } from "@/lib/styles";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        background: "#FDF8F3",
        color: "#2C1A0E",
        overflowX: "hidden",
      }}
    >
      <style>{PUBLIC_STYLES}</style>
      <div className="no-print"><AnnouncementBanner /></div>
      <div className="no-print"><VtoNotificationAlert /></div>
      <div className="no-print"><Navbar /></div>
      <main>{children}</main>
      <div className="no-print"><Footer /></div>
    </div>
  );
}