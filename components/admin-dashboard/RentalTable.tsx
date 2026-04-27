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
          borderBottom: "1px solid #F0E0E6",
          background: "white",
        }}
      >
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#2C1A0E",
          }}
        >
          Sewa Baju Aktif
        </h3>
        <p style={{ fontSize: "0.68rem", color: "#B09080", marginTop: "2px" }}>
          Transaksi persewaan terkini
        </p>
      </div>

      {/* Column headers */}
      <div
        className="table-row"
        style={{
          gridTemplateColumns: COL,
          color: "#B09080",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          fontFamily: "'DM Mono', monospace",
          background: "#FDFAF7",
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
                fontSize: "0.68rem",
                color: "#B09080",
              }}
            >
              {r.id}
            </span>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "#2C1A0E",
              }}
            >
              {r.customer}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#7A5C50" }}>
              {r.item}
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                color: "#7A5C50",
              }}
            >
              {r.rentDate}
            </span>
            {/* Tanggal kembali merah jika terlambat */}
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                color: r.status === "terlambat" ? "#C05060" : "#7A5C50",
                fontWeight: r.status === "terlambat" ? 700 : 400,
              }}
            >
              {r.returnDate}
            </span>
            <Badge label={r.status} bg={rs.bg} color={rs.color} />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.72rem",
                color: "#C4788A",
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