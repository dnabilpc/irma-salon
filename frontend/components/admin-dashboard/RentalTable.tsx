// components/admin-dashboard/RentalTable.tsx
import Badge from "@/components/ui/Badge";
import { RECENT_RENTALS } from "@/constants/data";
import { formatRupiah, getRentalStyle } from "@/lib/utils";

const COL = "76px 1fr 1fr 72px 80px 106px 88px";

export default function RentalTable() {
  return (
    <div className="admin-card" style={{ overflow: "hidden" }}>

      {/* Header */}
      <div
        style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid #F0D9E0",
          background: "#FDF8F5",
        }}
      >
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#3A1A28",
          }}
        >
          Sewa Baju Aktif
        </h3>
        <p style={{ fontSize: "12px", color: "#B08090", marginTop: "2px" }}>
          Transaksi persewaan terkini
        </p>
      </div>

      {/* Header kolom */}
      <div
        className="table-row"
        style={{
          gridTemplateColumns: COL,
          background: "#FDF8F5",
          fontSize: "12px",
          color: "#B08090",
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          fontWeight: 600,
        }}
      >
        <span>ID</span>
        <span>Pelanggan</span>
        <span>Item</span>
        <span>Mulai</span>
        <span>Kembali</span>
        <span>Status</span>
        <span>Total</span>
      </div>

      {/* Data rows */}
      {RECENT_RENTALS.map((r) => {
        const rs = getRentalStyle(r.status);
        return (
          <div
            key={r.id}
            className="table-row"
            style={{ gridTemplateColumns: COL }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                color: "#B08090",
              }}
            >
              {r.id}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#3A1A28" }}>
              {r.customer}
            </span>
            <span style={{ fontSize: "13px", color: "#8A4060" }}>
              {r.item}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#8A4060" }}>
              {r.rentDate}
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                color: r.status === "terlambat" ? "#D94060" : "#8A4060",
                fontWeight: r.status === "terlambat" ? 700 : 400,
              }}
            >
              {r.returnDate}
            </span>
            <Badge label={r.status} bg={rs.bg} color={rs.color} />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "13px",
                color: "#C9922A",
                fontWeight: 600,
              }}
            >
              {formatRupiah(r.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}