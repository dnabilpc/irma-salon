import Badge from "@/components/ui/Badge";
import { RECENT_RENTALS } from "@/constants/data";
import { formatRupiah, getRentalStyle } from "@/lib/utils";

const COL = "76px 1fr 1fr 72px 80px 106px 88px";

export default function RentalTable() {
  return (
    <div style={{ background: "#1A0F05", border: "1px solid #2A1A0A" }}>

      {/* Header */}
      <div
        style={{
          padding: "18px 18px 14px",
          borderBottom: "1px solid #2A1A0A",
        }}
      >
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          Sewa Baju Aktif
        </h3>
        <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>
          Transaksi persewaan terkini
        </p>
      </div>

      {/* Column headers */}
      <div
        className="table-row"
        style={{
          gridTemplateColumns: COL,
          color: "rgba(255,255,255,0.22)",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          fontFamily: "'DM Mono', monospace",
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
                color: "rgba(255,255,255,0.25)",
              }}
            >
              {r.id}
            </span>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {r.customer}
            </span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              {r.item}
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              {r.rentDate}
            </span>
            {/* Tanggal kembali merah jika terlambat */}
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                color: r.status === "terlambat"
                  ? "#DC5050"
                  : "rgba(255,255,255,0.3)",
                fontWeight: r.status === "terlambat" ? 600 : 400,
              }}
            >
              {r.returnDate}
            </span>
            <Badge label={r.status} bg={rs.bg} color={rs.color} />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.72rem",
                color: "#C9922A",
                fontWeight: 500,
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